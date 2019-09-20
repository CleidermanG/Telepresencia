app.service('ChatWebex', function($http, Upload, ) {
    this.user = function(inspeccion) {
        return $http({
            method: 'GET',
            url: 'http://localhost:7001/chatmessages',
            params: { inspeccion: inspeccion },
            headers: { 'Accept': 'application/json' }
        });
    };
    this.sendMessage = function(data) {
        $http.post('http://localhost:7001/chat', JSON.stringify(data));
    };
    this.usersAvatar = function(access_token, email) {
        return $http({
            method: 'GET',
            url: 'https://api.ciscospark.com/v1/people?email=' + email,
            headers: {
                'Authorization': 'Bearer ' + access_token
            }
        });
    };
});

app.controller('controllerChat', function($scope, ChatWebex, $http, Upload) {


    $scope.initChat = function(inspeccion) {
        // console.log(inspeccion);
        $scope.inspeccionChat = inspeccion;
        $scope.mensajes = [];

        var users = ChatWebex.user($scope.inspeccionChat.numero);
        users.then(function(data) {
            $scope.mensajes = data.data;
        }, function(data) {
            alert('Error al cargar los mensajes' + data);
        });

        $scope.authorize().then(() => {

            webex.messages.listen()
                .then(() => {
                    alert("Conexión establecida ya puedes iniciar el chat");
                    // console.log('listening to message events');
                    webex.messages.on('created', (message) => {
                        console.log('message created event:');
                        // console.log(message);


                        $scope.data = {
                            personId: message.actorId,
                            email: message.data.personEmail,
                            mensaje: message.data.text,
                            fecha: message.data.created,
                            inspeccion: $scope.inspeccionChat.numero
                        };

                        var users = ChatWebex.usersAvatar($scope.access_token, message.data.personEmail);
                        users.then(function(data) {
                            $scope.data.avatar = data.data.items[0].avatar;
                            $scope.data.displayName = data.data.items[0].displayName;
                            $scope.mensajes.push($scope.data);
                            ChatWebex.sendMessage($scope.data);
                        }, function(data) {
                            alert('Error al cargar el avatar' + data);
                        });
                    });
                    webex.messages.on('deleted', (message) => {
                        console.log('message deleted event:');
                        console.log(message);
                    });
                })
                .catch((err) => {
                    console.error(`error listening to messages: ${err}`);
                });
        });


    }

    $scope.sendMenssage = function() {
        var menssage = {
            toPersonEmail: $scope.inspeccionChat.email,
            text: $scope.myMessage,
        }
        webex.messages.create(menssage)
            .then(() => {
                $scope.myMessage = '';
            })
            .catch((err) => {
                console.error(`error listening to messages: ${err}`);
            });
    }

    $scope.sendMessageIntro = function(keyEvent) {
        if (keyEvent.which === 13)
            $scope.sendMenssage();
    }

    $scope.messageFromMe = function(mensaje) {
        if (mensaje.email == $scope.inspeccionChat.email)
            return 'container2';
        else
            return 'container2 darker'
    }

    $scope.imageFromMe = function(mensaje) {


        if (mensaje.email == $scope.inspeccionChat.email)
            return 'left';
        else
            return 'right'
    }

    $scope.fechaFromMe = function(mensaje) {
        if (mensaje.email == $scope.inspeccionChat.email)
            return 'time-right';
        else
            return 'time-left'
    }


});

app.directive("keepScroll", function() {
    return {
        controller: function($scope) {
            var element = null;

            this.setElement = function(el) {
                element = el;
            }
            this.addItem = function(item) {
                element.scrollTop = (element.scrollTop + item.clientHeight + 1);
            };
        },
        link: function(scope, el, attr, ctrl) {
            ctrl.setElement(el[0]);
        }
    };
}).directive("scrollItem", function() {
    return {
        require: "^keepScroll",
        link: function(scope, el, att, scrCtrl) {
            scrCtrl.addItem(el[0]);
        }
    }
})