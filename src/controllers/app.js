var app = angular.module('myApp', ['ngFileUpload', 'ngMaterial']);

app.config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);
app.service('WebexTeams', function($http, Upload, $sce) {
    this.users = function() {
        return $http({
            method: 'GET',
            url: 'http://localhost:7001/users',
            header: { 'Content-Type': 'application/json; charset-utf-8' }
        });
    };
    this.userScreenshot = function(inspeccion, file) {
        console.log(inspeccion.numero);

        Upload.upload({
            url: 'http://localhost:7001/image',
            data: {
                inspeccion: inspeccion.numero,
                file: file
            }
        }).then(function(resp) {
            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
        }, function(resp) {
            console.log('Error status: ' + resp.status);
        }, function(evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    };

    this.userVideo = function(inspeccion, file) {
        return Upload.upload({
            url: 'http://localhost:7001/video',
            data: {
                inspeccion: inspeccion,
                file: file
            }
        });
    };

    this.userLoadScreen = function(inspeccion) {
        return $http({
            method: 'GET',
            url: 'http://localhost:7001/image',
            header: { 'Content-Type': 'application/json; charset-utf-8' },
            params: { inspeccion: inspeccion.numero }
        });
    };

    this.userLoadVideos = function(inspeccion) {
        return $http({
            method: 'GET',
            url: 'http://localhost:7001/videos',
            header: { 'Content-Type': 'application/json; charset-utf-8' },
            params: { inspeccion: inspeccion.numero }
        });
    };


    this.login = function($location) {
        return $http({
            method: 'POST',
            url: 'https://api.ciscospark.com/v1/access_token',
            header: { 'Content-Type': 'application/json; charset-utf-8' },
            data: {
                "grant_type": "authorization_code",
                "client_id": "Cd721ccbaa2ab99b47da3368933fbe12a4638ccbc132a01d39cf3cefec05edf6c",
                "client_secret": "bdc97b96bea78d5ce2006af6a3e22d593b5f61e4386489313ef9cf9ec3f9e001",
                "code": $location.search()['code'],
                "redirect_uri": "https://3c9cd59f.ngrok.io/src/views/index2.html"
            },
        });
    };


});




app.controller('myCtrl', function($scope, WebexTeams, $http, Upload, $location, $window) {

    $scope.ban = true;
    let webex;
    var blob,
        file
    $scope.access_token = 'ZGNlMzc0OWItMWMwMC00MTZlLTg5ZDYtM2IwZjQ0MGQ0NjVhMzg1NGVmMWUtMTk3_PF84_consumer'
    var recorder; // globally accessible
    $scope.toogle = angular.element(document.getElementById('sidebar'));
    $scope.toogle2 = angular.element(document.getElementById('myInput'));
    var canvas = document.getElementById('canvas');
    $scope.imagesScreenshot = [];
    $scope.videosInspeccion = [];
    $scope.hideChat = true;

    var users = WebexTeams.users();
    users.then(function(data) {
        $scope.friends = data.data;
    }, function(data) {
        alert('Error al cargar los contactos');
    });

    var w, h, ratio;
    document.getElementById(`remote-view-video`).addEventListener('loadedmetadata', function() {
        video = document.getElementById(`remote-view-video`);
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }, false);



    $scope.cargarScreenshot = function(inspeccion) {
        $scope.multimediaUrl = "http://localhost:7001/multimedia/" + inspeccion.numero;
        var screenshotUser = WebexTeams.userLoadScreen(inspeccion);
        screenshotUser.then(function successCallback(data) {
            console.log(data);
            $scope.imagesScreenshot = data.data
        }, function errorCallback(error) {
            console.log(error);
        });

        var videosUser = WebexTeams.userLoadVideos(inspeccion);
        videosUser.then(function successCallback(dataVideo) {
            console.log(dataVideo);
            $scope.videosInspeccion = dataVideo.data
        }, function errorCallback(error) {
            console.log(error);
        });
    }

    $scope.llamar = function(inspeccion) {
        $scope.w3_close();
        document.getElementById('btnColgar').setAttribute("style", "visibility: visible;");
        document.getElementById('btnScreen').setAttribute("style", "visibility: visible;");
        const call = spark.phone.dial(inspeccion.email);
        $scope.call = call;
        $scope.bindCallEvents(call, inspeccion);
    };

    $scope.connection = function() {



        var login = WebexTeams.login($location);
        login.then(function(data) {
                console.log(data);
                $scope.connect(data.data.access_token);
            })
            .catch(function(error) {
                console.log(error);
                window.location.href = "https://api.ciscospark.com/v1/authorize?client_id=Cd721ccbaa2ab99b47da3368933fbe12a4638ccbc132a01d39cf3cefec05edf6c&response_type=code&redirect_uri=https%3A%2F%2F3c9cd59f.ngrok.io%2Fsrc%2Fviews%2Findex2.html&scope=spark%3Aall%20spark%3Akms&state=set_state_here"
            });
    }

    $scope.logout = function() {
        if (webex.canAuthorize) {
            // $window.location.href = "https://3c9cd59f.ngrok.io/src/views/index2.html";
            webex.logout();

        } else {
            // No user is authenticated
            console.log('cannot logout when no user is authenticated');
        }
    }

    $scope.connect = function(access_token) {
        // console.log('succes: ' + access_token);
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
    }



    $scope.authorize = function(access_token) {
        webex = window.webex = Webex.init({
            credentials: {
                access_token: access_token
            }
        });

        if (webex.canAuthorize) {
            return Promise.resolve(webex.canAuthorize);
        }
        return Promise.reject(webex.canAuthorize);
    }

    $scope.bindCallEvents = function(call, inspeccion) {
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
            document.getElementById(`remote-view-video`).onloadedmetadata = function() {
                recorder = RecordRTC($scope.call.remoteMediaStream, {
                    type: 'video',
                });
                recorder.startRecording();
            };

        });
        call.on(`connected`, () => {
            document.getElementById('btnScreen').setAttribute("style", "visibility: visible;");

        });
        call.on(`disconnected`, () => {
            if (recorder != null && recorder != undefined)
                recorder.stopRecording(stopRecordingCallback);
            // document.getElementById("remote-view-video").controls = true;
            call = undefined;
            document.getElementById('btnColgar').setAttribute("style", "visibility: hidden;");
            document.getElementById('btnScreen').setAttribute("style", "visibility: hidden;");
        });

        $scope.dataURItoBlob = function(dataURI) {
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


        $scope.screenshot = function() {
            $scope.cargarScreenshot(inspeccion);
            var dataURL = canvas.toDataURL()
            var context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            blob = $scope.dataURItoBlob(dataURL);
            file = new File([blob], "fileName.jpeg", {
                type: "'image/jpeg'"
            });

            WebexTeams.userScreenshot(inspeccion, file);
            $scope.cargarScreenshot(inspeccion);
        }



        function stopRecordingCallback() {
            var fileName = Math.random() * (100000000 - 1000000) + 1000000;
            blob = recorder.getBlob();
            file = new File([blob], (fileName + 'test.webm'), {
                type: 'video/webm'
            });

            var video = WebexTeams.userVideo($scope.inspeccion.numero, file);
            video.then(function(response) {
                    alert(response.data)
                }),
                function() {
                    recorder.destroy();
                    recorder = null;
                };

            document.getElementById(`remote-view-video`).src = null;
            document.getElementById(`remote-view-video`).srcObject = null;
            document.getElementById(`remote-view-video`).srcObject = undefined;
            document.getElementById(`remote-view-video`).src = URL.createObjectURL(recorder.getBlob());

        }

    }

    $scope.colgar = function() {

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

    $scope.chat = function(inspeccion) {
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
            $scope.initChat($scope.inspeccion);
        } else {
            document.getElementById("videoTam").style.width = "60%";
            document.getElementById("imagesTam").style.width = "40%";
        }
    };


    $scope.w3_open = function() {
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

    $scope.w3_close = function() {
        document.getElementById("main").style.marginLeft = "0%";
        document.getElementById("mySidebar").style.display = "none";
        document.getElementById("openNav").style.display = "inline-block";
    }

})