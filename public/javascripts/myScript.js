//http://cdnjs.com/libraries/codemirror
var MyApp = angular.module('MyApp', ['ngRoute', 'ngAnimate', 'ui.bootstrap']);

//Routing Configuration 
MyApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
	$routeProvider
		.when('/:id', { templateUrl : "partials/partialInstance.html", controller : "InstanceCTRL"})
		.otherwise({ redirectTo : '/'});

	$locationProvider.html5Mode(true);
}]);

//Faye factory
MyApp.factory('Faye', function(){
	var subscription;
	var client = new Faye.Client('http://localhost:3000/faye', {
		timeout : 60
	});

	return {
		publish: function(channel, message) {
		  client.publish(channel, message);
		},

		subscribe: function(channel, callback) {
		  subscription = client.subscribe(channel, callback);
		},

		unsubscribe: function(){
			subscription.cancel();
		}
	}
});


/* ###############################################################################
 * ##
 * ##							InstanceCRTL
 * ##
 * ############################################################################### */
MyApp.controller("InstanceCTRL", ["$scope", "$routeParams", 'Faye', function($scope, $routeParams, Faye){

	$scope.editorOptions = {
        value: "\n\n\n",
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript",
		theme: "monokai",
		autoCloseBrackets : true
    };

 	$scope.Init = function(){
 		$scope.instanceId = $routeParams.id;
 		$scope.members = [];
 		$scope.events = new EventHandler($scope);
 		$scope.files = ['untitled', 'thingy', 'blah', 'kay'];
 		$scope.comments = [];

 		// Listen to data coming from the server via Faye
		Faye.subscribe('/' + $scope.instanceId, function(msg) {
			var message = JSON.parse(msg);
			var func = $scope.events[message.type];
			if(func) func(message);
		});

		angular.element(window).bind("beforeunload", function(){
			Faye.unsubscribe();
		});
 	}

 	$scope.AddChatMessage = function(obj){
 		$scope.$apply(function() {
			$scope.comments.push(obj);
		});
 	}

 	$scope.Init();
}]);

function EventHandler(scope){
	var myScope = scope;

	this.subscribe = function(obj){
		obj.text = obj.clientId + " has entered the room";
		myScope.AddChatMessage(obj);
	};

	this.unsubscribe = function(obj){
		obj.text = obj.clientId + " has left the room";
		myScope.AddChatMessage(obj);
	};
}