//http://cdnjs.com/libraries/codemirror
var MyApp = angular.module('MyApp', ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'ui.codemirror']);

//Routing Configuration 
MyApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
	$routeProvider
		.when('/:id', { templateUrl : "partials/partialInstance.html", controller : "InstanceCTRL"})
		.otherwise({ redirectTo : '/'});

	$locationProvider.html5Mode(true);
}]);


//Faye factory
MyApp.factory('Faye', ['$log', '$http', function($log, $http){
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
		},

		getUsers: function(id, cb){
			users = [];
			$http.get("/" + id + "/users").then(function(response) {
				cb(response.data);
			});
		}
	}
}]);

/* ###############################################################################
 * ##
 * ##							InstanceCRTL
 * ##
 * ############################################################################### */
MyApp.controller("InstanceCTRL", ['$scope', '$routeParams', 'Faye', '$sce', function($scope, $routeParams, Faye, $sce){

	//Codemirror properties
	$scope.editorOptions = {
        value: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript",
		theme: "monokai",
		autoCloseBrackets : true
    };

	$scope.to_trusted = function(html_code) {
		return $sce.trustAsHtml(html_code);
	}

    $scope.DisplayOnlineUsers = function(){
    	obj = {
    		category: 'showUsers',
			type:'announcement',
			text: $scope.users.length + ""
		};
		$scope.AddChatMessage(obj);
    }

    $scope.AddUser = function(obj){
 		$scope.$apply(function() {
			$scope.users.push(obj);
		});
 	}

 	$scope.RemoveUser = function(obj){
 		var index = $scope.users.indexOf(obj);
 		if(index != -1){
 			$scope.$apply(function() {
				$scope.users.splice(index, 1);
			});
 		}
 	}

 	$scope.AddChatMessage = function(obj){
 		$scope.$apply(function() {
			$scope.comments.push(obj);
		});
 	}

 	$scope.Init = function(){
 		$scope.chatShow = false;
 		$scope.instanceId = $routeParams.id;
 		$scope.color = "";
 		$scope.events = new EventHandler($scope);

 		$scope.files = ['untitled', 'thingy', 'blah', 'kay'];
 		$scope.comments = [];
 		$scope.users = [];

 		//get users currently in the instance
 		Faye.getUsers($scope.instanceId, function(users){
 			for(var i=0; i != users.length; ++i){
 				$scope.users.push(users[i]);
 			}
 		});

 		// Listen to data coming from the server via Faye
		Faye.subscribe('/' + $scope.instanceId, function(msg) {
			// Handle messages
			var message = JSON.parse(msg);
			var func = $scope.events[message.type];
			if(func) func(message);
		});

		//if someone leaves page, tell everyone
		angular.element(window).bind("beforeunload", function(){
			Faye.unsubscribe();
		});
 	}

 	$scope.Init();
}]);

//-------------------------------------------
function EventHandler(scope){
	var myScope = scope;
	var firstTime = true;

	this.announcement = function(obj){
		myScope.AddChatMessage(obj);
	}

	this.subscribe = function(obj){
		if(scope.color == ""){
			scope.color = obj.color;
			obj.text = "Welcome";
		} else {
			obj.text = "has entered the room";
		}
		myScope.AddChatMessage(obj);
		if(firstTime){
			firstTime = false;
			myScope.DisplayOnlineUsers();
		}
		myScope.AddUser(obj.color);
	};


	this.unsubscribe = function(obj){
		obj.text = " has left the room";
		myScope.AddChatMessage(obj);
		myScope.RemoveUser(obj.color);
	};
}