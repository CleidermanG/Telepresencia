var app = angular.module('myApp', ['ngFileUpload', 'ngMaterial']);

app.config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);
app.service('WebexTeams', function ($http, Upload, $sce) {
    this.users = function () {
        return $http({
            method: 'GET',
            url: 'http://localhost:7001/users',
            header: { 'Content-Type': 'application/json; charset-utf-8' }
        });
    };
    this.userScreenshot = function (inspeccion, file) {
        console.log(inspeccion.numero);

        Upload.upload({
            url: 'http://localhost:7001/image',
            data: {
                inspeccion: inspeccion.numero,
                file: file
            }
        }).then(function (resp) {
            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    };

    this.userVideo = function (inspeccion, file) {
        return Upload.upload({
            url: 'http://localhost:7001/video',
            data: {
                inspeccion: inspeccion,
                file: file
            }
        });
    };

    this.userLoadScreen = function (inspeccion) {
        return $http({
            method: 'GET',
            url: 'http://localhost:7001/image',
            header: { 'Content-Type': 'application/json; charset-utf-8' },
            params: { inspeccion: inspeccion.numero }
        });
    };

    this.userLoadVideos = function (inspeccion) {
        return $http({
            method: 'GET',
            url: 'http://localhost:7001/videos',
            header: { 'Content-Type': 'application/json; charset-utf-8' },
            params: { inspeccion: inspeccion.numero }
        });
    };


    this.Login = function ($location) {
        return $http({
            method: 'POST',
            url: 'https://api.ciscospark.com/v1/access_token',
            header: { 'Content-Type': 'application/json; charset-utf-8' },
            data: {
                "grant_type": "authorization_code",
                "client_id": "Cd721ccbaa2ab99b47da3368933fbe12a4638ccbc132a01d39cf3cefec05edf6c",
                "client_secret": "bdc97b96bea78d5ce2006af6a3e22d593b5f61e4386489313ef9cf9ec3f9e001",
                "code": $location.search()['code'],
                "redirect_uri": "https://037fbd74.ngrok.io/src/views/index.html"
            },
        });
    };

    this.User = function (access_token) {
        return $http({
            method: 'GET',
            url: 'https://api.ciscospark.com/v1/people/me',
            headers: {
                'Authorization': 'Bearer ' + access_token
            }
        });
    };

    this.sendMessageObservation = function (data) {
        return $http.post('http://localhost:7001/observacion', JSON.stringify(data));
    };

    this.loadObservations = function (inspeccion) {
        return $http({
            method: 'GET',
            url: 'http://localhost:7001/observationsmessages',
            header: { 'Content-Type': 'application/json; charset-utf-8' },
            params: { inspeccion: inspeccion.numero }
        });
    };

});




app.controller('myCtrl', function ($scope, WebexTeams, $http, Upload, $location, $window) {

    $scope.ban = true;
    let webex;
    var blob,
        file

    $scope.avatarUserLogin = "https://2mingenieria.com.ve/wp-content/uploads/2018/10/kisspng-avatar-user-medicine-surgery-patient-avatar-5acc9f7a7cb983.0104600115233596105109.jpg"
    $scope.access_token = 'ZjYwNmRkMTYtYjYzMS00ZDA5LWE5ODQtZjg0NGYxODA5YjE2OTA2OGQ1YWEtODk2_PF84_consumer'
    var recorder; // globally accessible
    $scope.toogle = angular.element(document.getElementById('sidebar'));
    $scope.toogle2 = angular.element(document.getElementById('myInput'));
    var canvas = document.getElementById('canvas');
    $scope.imagesScreenshot = [];
    $scope.videosInspeccion = [];
    $scope.hideChat = true;

    var users = WebexTeams.users();
    users.then(function (data) {
        $scope.friends = data.data;
    }, function (data) {
        alert('Error al cargar los contactos');
    });

    var w, h, ratio;
    document.getElementById(`remote-view-video`).addEventListener('loadedmetadata', function () {
        video = document.getElementById(`remote-view-video`);
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }, false);



    $scope.cargarDatosInspeccion = function (inspeccion) {
        $scope.w3_close();
        $scope.multimediaUrl = "http://localhost:7001/multimedia/" + inspeccion.numero;
        var screenshotUser = WebexTeams.userLoadScreen(inspeccion);
        screenshotUser.then(function successCallback(data) {
            $scope.imagesScreenshot = data.data
        }, function errorCallback(error) {
            console.log(error);
        });

        var videosUser = WebexTeams.userLoadVideos(inspeccion);
        videosUser.then(function successCallback(dataVideo) {
            $scope.videosInspeccion = dataVideo.data
        }, function errorCallback(error) {
            console.log(error);
        });

        $scope.loadObservations (inspeccion);


        $scope.sendObservation = function (keyEvent) {
            if (keyEvent.which === 13) {
                $scope.tets();
            }
        }

        $scope.tets = function () {
            $scope.data = {
                inspeccion: inspeccion.numero,
                observacion: $scope.myMessageObservation
            };
            var observation = WebexTeams.sendMessageObservation($scope.data);
            observation.then(function successCallback(data) {
                alert('Se agregó una observación a la inspección ' + inspeccion.numero)
            }, function errorCallback(error) {
                console.log(error);
            });
            $scope.myMessageObservation = ' '
            $scope.loadObservations (inspeccion);
        }
    }

    $scope.loadObservations = function (inspeccion) {
        var observacion = WebexTeams.loadObservations(inspeccion);
        observacion.then(function successCallback(data) {
           
           console.log(data);
           
        });
    }



    $scope.llamar = function (inspeccion) {
        $scope.w3_close();
        document.getElementById('btnColgar').setAttribute("style", "visibility: visible;");
        document.getElementById('btnScreen').setAttribute("style", "visibility: visible;");
        const call = spark.phone.dial(inspeccion.email);
        $scope.call = call;
        $scope.bindCallEvents(call, inspeccion);
    };

    $scope.connection = function () {
        var login = WebexTeams.Login($location);
        login.then(function (data) {
            console.log(data.data.access_token);
            
            
            $scope.connect(data.data.access_token);
        })
            .catch(function (error) {
                console.log(error);
                window.location.href = "https://api.ciscospark.com/v1/authorize?client_id=Cd721ccbaa2ab99b47da3368933fbe12a4638ccbc132a01d39cf3cefec05edf6c&response_type=code&redirect_uri=https%3A%2F%2F037fbd74.ngrok.io%2Fsrc%2Fviews%2Findex.html&scope=spark%3Aall%20spark%3Akms&state=set_state_here"
            });
    }



    $scope.logout = function () {
        if (webex.canAuthorize) {
            // $window.location.href = "https://3c9cd59f.ngrok.io/src/views/index2.html";
            webex.logout();

        } else {
            // No user is authenticated
            console.log('cannot logout when no user is authenticated');
        }
    }

    $scope.connect = function (access_token) {
        alert("Conexión establecida ya puedes iniciar las video llamadas");
        spark = ciscospark.init({
            credentials: {

                access_token: $scope.access_token
            }
        });
        spark.phone.register()
            .catch((err) => {
                console.error(err);
                alert(err);
                throw err;
            });
        $scope.authorize($scope.access_token);
        var user = WebexTeams.User($scope.access_token);
        user.then(function (user) {
            if (user.data.avatar) {
                $scope.avatarUserLogin = user.data.avatar;
            }
            $scope.userLoginName = user.data.nickName;
            $scope.userLoginEmail = user.data.emails[0];

        });
    }



    $scope.authorize = function (access_token) {
        webex = window.webex = Webex.init({
            credentials: {
                access_token: $scope.access_token
            }
        });

        if (webex.canAuthorize) {
            return Promise.resolve(webex.canAuthorize);
        }
        return Promise.reject(webex.canAuthorize);
    }



    $scope.bindCallEvents = function (call, inspeccion) {
        $scope.call = call;
        $scope.inspeccion = inspeccion;
        console.log($scope.inspeccion);
        call.on(`error`, (err) => {
            console.error(err);
            alert(err);
        });
        var videoPreview = document.getElementById('remote-view-video');

        call.once(`remoteMediaStream:change`, () => {
            document.getElementById(`remote-view-video`).srcObject = call.remoteMediaStream;
            document.getElementById(`remote-view-video`).onloadedmetadata = function () {
                recorder = RecordRTC($scope.call.remoteMediaStream, {
                    type: 'video',
                });
                recorder.startRecording();
            };

        });
        call.on(`connected`, () => {
            document.getElementById('btnScreen').setAttribute("style", "visibility: visible;"); s
        });
        call.on(`disconnected`, () => {
            if (recorder != null && recorder != undefined)
                recorder.stopRecording(stopRecordingCallback);
            // document.getElementById("remote-view-video").controls = true;
            call = undefined;
            document.getElementById('btnColgar').setAttribute("style", "visibility: hidden;");
            document.getElementById('btnScreen').setAttribute("style", "visibility: hidden;");
        });

        $scope.dataURItoBlob = function (dataURI) {
            // convert base64/URLEncoded data component to raw binary data held in a string
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ia], { type: mimeString });
        }


        $scope.screenshot = function () {
            $scope.cargarDatosInspeccion(inspeccion);
            var dataURL = canvas.toDataURL()
            var context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            blob = $scope.dataURItoBlob(dataURL);
            file = new File([blob], "fileName.jpeg", {
                type: "'image/jpeg'"
            });

            WebexTeams.userScreenshot(inspeccion, file);
            $scope.cargarDatosInspeccion(inspeccion);
        }

        function stopRecordingCallback() {
            var fileName = Math.random() * (100000000 - 1000000) + 1000000;
            blob = recorder.getBlob();
            file = new File([blob], (fileName + 'test.webm'), {
                type: 'video/webm'
            });

            var video = WebexTeams.userVideo($scope.inspeccion.numero, file);
            video.then(function (response) {
                alert(response.data)
            }),
                function () {
                    recorder.destroy();
                    recorder = null;
                };

            document.getElementById(`remote-view-video`).src = null;
            document.getElementById(`remote-view-video`).srcObject = null;
            document.getElementById(`remote-view-video`).srcObject = undefined;
            document.getElementById(`remote-view-video`).src = URL.createObjectURL(recorder.getBlob());

        }

    }

    $scope.colgar = function () {

        document.getElementById('btnColgar').setAttribute("style", "visibility: hidden;");
        document.getElementById('btnScreen').setAttribute("style", "visibility: hidden;");
        $scope.call.hangup();

        // $http({
        //     method: 'POST',
        //     url: 'https://api.ciscospark.com/v1/messages',
        //     headers: {
        //         'Authorization': `Bearer NzQ3NGZkOTgtMGQ3MS00NmVmLTkwYjktNGE0NzNhNTRiZmFjMDc4ZmQ1MjAtOWM1_PF84_consumer`,
        //     },
        //     data: {
        //         "toPersonEmail": "cgonzales391@uan.edu.co",
        //         "text": "Se terminó la inspección y quedó registrada bajo el número 582044"
        //     },
        // }).then(function successCallback(data) {
        //     console.log('succes: ' + data);
        // }, function errorCallback(error) {
        //     console.log(error);
        // });
    }

    // document.getElementById("remote-view-video").controls = true;

    $scope.chat = function (inspeccion) {
        $scope.hideChat = !$scope.hideChat;

        if ($scope.hideChat == false) {
            $scope.w3_close();
            document.getElementById("videoTam").style.width = "50%";
            document.getElementById("imagesTam").style.width = "20%";
            document.getElementById("chatTam").style.width = "30%";
            $scope.inspeccion = {
                numero: inspeccion.numero,
                email: inspeccion.email
            };
            $scope.initChat($scope.inspeccion, $scope.userLoginEmail);
        } else {
            document.getElementById("videoTam").style.width = "60%";
            document.getElementById("imagesTam").style.width = "40%";
        }
    };


    $scope.w3_open = function () {
        if ($scope.ban) {
            $scope.ban = false
            document.getElementById("main").style.marginLeft = "25%";
            document.getElementById("mySidebar").style.width = "25%";
            document.getElementById("mySidebar").style.display = "block";
            // document.getElementById("openNav").style.display = 'none';
        } else {
            $scope.ban = true;
            $scope.w3_close();
        }
    }

    $scope.w3_close = function () {
        document.getElementById("main").style.marginLeft = "0%";
        document.getElementById("mySidebar").style.display = "none";
        document.getElementById("openNav").style.display = "inline-block";
    }

})