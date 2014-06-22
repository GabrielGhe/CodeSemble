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
			return subscription;
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

MyApp.constant("Language", {
	javascript: "javascript",
	html: "html",
	go: "go",
	sql: "sql",
	php: "php",
	python: "python",
	ruby: "ruby",
	shell: "shell"
});

/* ###############################################################################
 * ##
 * ##							InstanceCRTL
 * ##
 * ############################################################################### */
MyApp.controller("InstanceCTRL", [
	'$scope','$routeParams', 'Faye', '$sce', 'Language', '$modal', function($scope, $routeParams, Faye, $sce, Language, $modal){

	//Codemirror properties
	$scope.editorOptions = {
        value: "\n",
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript",
		theme: "monokai",
		autoCloseBrackets : true
    };

    $scope.open = function () {
		var modalInstance = $modal.open({
			templateUrl: 'modal.html',
			controller: 'ModalCtrl',
			backdrop: 'static'
		});

		modalInstance.result.then(function (username) {
			$scope.name = username;
			$scope.FayeLoading();
		});
    };

    $scope.ChangeLanguage = function(lang){
    	var newLang = Language[lang];
    	if(newLang){
    		$scope.editorOptions.mode = newLang;
    	}
    };

	$scope.to_trusted = function(html_code) {
		return $sce.trustAsHtml(html_code);
	};

    $scope.Who = function(){
    	return $scope.users.length;
    };

    $scope.AddUser = function(obj){
 		$scope.$apply(function() {
			$scope.users.push(obj);
		});
 	};

 	$scope.RemoveUser = function(obj, cb){
 		for(var i=0; i != $scope.users.length; ++i){
 			var colorAtI = $scope.users[i].color;
 			if(obj == colorAtI){
 				var whoLeft = $scope.users.splice(i, 1);
				cb(whoLeft[0]);
				break;
 			}
 		}
 	};

 	$scope.AddChatMessage = function(obj){
 		$scope.$apply(function() {
			$scope.comments.push(obj);
		});
 	};

 	$scope.PostSubscribe = function(){
 		var obj = {
 			type: "postsubscribe",
			name: $scope.name,
			color: $scope.color
 		};
 		Faye.publish('/' + $scope.instanceId, JSON.stringify(obj));
 	}

 	$scope.Init = function(){
 		$scope.chatShow = false;
 		$scope.instanceId = $routeParams.id;
 		$scope.color = "";
 		$scope.events = new EventHandler($scope);

 		$scope.name = "";
 		$scope.files = ['untitled', 'thingy', 'blah', 'kay'];
 		$scope.comments = [];
 		$scope.users = [];
 	};

 	$scope.FayeLoading = function(){
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
 	$scope.open();
}]);

MyApp.controller("ModalCtrl", ['$scope', '$modalInstance', function($scope, $modalInstance){
	$scope.ok = function (username) {
		$modalInstance.close(username);
	}
}]);

//-------------------------------------------
function EventHandler(scope){
	var myScope = scope;
	var firstTime = true;

	this.postsubscribe = function(obj){
		obj.text = (firstTime)? "Welcome " + scope.name : obj.name + " has entered the room";
		firstTime = false;
		myScope.AddChatMessage(obj);
		myScope.AddUser({ name:obj.name, color:obj.color});
	};

	this.subscribe = function(obj){
		if(scope.color == ""){
			scope.color = obj.color;
			scope.PostSubscribe();
		}
	};


	this.unsubscribe = function(obj){
		myScope.RemoveUser(obj.color, function(whoLeft){
			var name = (whoLeft.name) || "User";
			obj.text = name + " has left the room";
			myScope.AddChatMessage(obj);
		});
	};
}