app.directive('myCustomer', function() {
    return {
        templateUrl: function(elem, attr) {
            return '../views/' + attr.type + '.html';
        },
        controller: "controllerChat"

    };
});