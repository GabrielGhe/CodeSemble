"use strict";

//http://cdnjs.com/libraries/codemirror
var MyApp = angular.module("MyApp", ["ngRoute", "ngAnimate", "ui.bootstrap", "ui.codemirror", "luegg.directives"]);

//Routing Configuration 
MyApp.config(["$routeProvider", "$locationProvider",
    function($routeProvider, $locationProvider) {
        $routeProvider
            .when("/:id", {
                templateUrl: "partials/partialInstance.html",
                controller: "InstanceCTRL"
            })
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.html5Mode(true);
    }
]);


//Faye factory
MyApp.factory("Faye", ["$log", "$http",
    function($log, $http) {
        var subscription;
        var client = new Faye.Client("/faye", {
            timeout: 60
        });

        return {
            publish: function(channel, message) {
                client.publish(channel, message);
            },

            subscribe: function(channel, callback) {
                subscription = client.subscribe(channel, callback);
                return subscription;
            },

            unsubscribe: function() {
                subscription.cancel();
            },

            getUsers: function(id, cb) {
                $http.get("/" + id + "/users").then(function(response) {
                    cb(response.data);
                });
            },

            getFile: function(id, cb) {
                $http.get("/" + id + "/file").then(function(response) {
                    cb(response.data);
                });
            }
        }
    }
]);

//Faye factory
MyApp.factory("CodeMirrorEditor", [
    function() {
        var _editor;

        return {
            setEditor: function(editor) {
                _editor = editor;
            },

            getEditor: function() {
                return _editor;
            }
        }
    }
]);

MyApp.filter("notme", function() {
    return function(input, scope) {
        var newArray = [];
        for (var i = 0; i != input.length; ++i) {
            if (input[i].color !== scope.color) {
                newArray.push(input[i]);
            }
        }
        return newArray;
    }
});

MyApp.directive("usercursor", ["CodeMirrorEditor",
    function(CodeMirrorEditor) {
        var sSel
          , eSel
          , selection
          , myColor;

        return {
            restrict: "E",
            transclude: true,
            template: '<div ng-transclude></div>',
            link: function(scope, element, attrs) {
                element.addClass("userCursor");
                myColor = scope.$eval(attrs.color);
                CodeMirrorEditor.getEditor().addWidget({
                    line: 0,
                    ch: 0
                }, element[0]);
                scope.$watch(attrs.name, function(name) {
                    element.html(name);
                });
                
                //Selection
                scope.$watch(attrs.startsel, function(startsel) {
                    sSel = startsel;
                    if (selection) selection.clear();
                    if (eSel && !angular.equals(sSel, eSel)) {
                        selection = CodeMirrorEditor
                                    .getEditor()
                                    .markText(sSel,eSel, { css: "background-color:" + myColor + ";" });
                    }
                }, true);
                scope.$watch(attrs.endsel, function(endsel) {
                    eSel = endsel;
                    if (selection) selection.clear();
                    if (sSel && !angular.equals(sSel, eSel)) {
                        selection = CodeMirrorEditor
                                    .getEditor()
                                    .markText(sSel,eSel, { css: "background-color:" + myColor + ";" });
                    }
                }, true);

                // Cursor position
                scope.$watch(attrs.x, function(x) {
                    element.css("left", x + "px");
                });
                scope.$watch(attrs.y, function(y) {
                    element.css("top", y + "px");
                });
            }
        };
    }
]);

/* ###############################################################################
 * ##
 * ##                           InstanceCRTL
 * ##
 * ############################################################################### */
MyApp.controller("InstanceCTRL", [
    "$scope", "$routeParams", "Faye", "$sce", "$modal", "CodeMirrorEditor", "$timeout",
    function($scope, $routeParams, Faye, $sce, $modal, CodeMirrorEditor, $timeout) {

        $scope.languages = [
            {name: "JavaScript", mode: "javascript"},
            {name: "Go", mode: "go"},
            {name: "SQL", mode: "sql"},
            {name: "Python", mode: "python"},
            {name: "Ruby", mode: "ruby"},
            {name: "Shell", mode: "shell"},
            {name: "Java", mode: "text/x-java"},
            {name: "C++", mode: "text/x-c++src"},
            {name: "C", mode: "text/x-csrc"},
            {name: "C#", mode: "text/x-csharp"}
        ];

        //Codemirror properties
        $scope.editorOptions = {
            value: "\n\n\n",
            lineNumbers: true,
            matchBrackets: true,
            mode: "javascript",
            theme: "monokai"
        };

        //Codemirror editor loaded
        $scope.codemirrorLoaded = function(_editor) {
            CodeMirrorEditor.setEditor(_editor);
            $scope._editor = _editor;

            _editor.on("change", function(cm, change) {
                var func = $scope.sendEvents[change.origin];
                if (func) func(change, cm);
            });

            _editor.on("cursorActivity", function(cm) {
                if($scope.sel) $scope.sel.clear();
                var coor = cm.cursorCoords(false, "local");

                // Added selection and color
                coor.startSel = cm.getCursor(true);
                coor.endSel = cm.getCursor(false);
                coor.color = $scope.color;

                // Broadcast
                var func = $scope.sendEvents["cursorActivity"];
                if (func) func(coor);
            });

            _editor.on("gutterClick", function(cm, n) {
                var info = cm.lineInfo(n);
                var func = $scope.sendEvents["scrollIntoView"];
                if (func) func(info);
            });
        };

        //User joined event
        $scope.addUser = function(obj) {
            $scope.$apply(function() {
                $scope.users.push(obj);
            });
        };

        $scope.addChatMessage = function(obj) {
            $scope.$apply(function() {
                if ($scope.comments.length >= 40) {
                    $scope.comments.splice(0, 1);
                }
                $scope.comments.push(obj);
            });
        };

        //Change programming language in editor
        $scope.onSelect = function(item, receive){
            var newLang = item.mode;
            if (newLang) {
                // clear value inside inputbox
                $scope.selectedLanguage = '';
                $scope.currentLanguage = item.name;
                $scope.editorOptions.mode = newLang;
                $scope._editor.setOption("mode", $scope.editorOptions.mode);

                // change language for everyone
                var func = $scope.sendEvents["changeLanguage"];
                if (func && !receive) func(item);
            }
        };

        //Validate language selection
        $scope.validateSelection = function(){
            var bad = true;
            var currentMode;
            for (var i=0; i < $scope.languages.length; ++i) {
                // what was written is a possible value
                if ($scope.languages[i].name == $scope.selectedLanguage) {
                    bad = false;
                }
                if ($scope.languages[i].mode == $scope.editorOptions.mode) {
                    currentMode = $scope.languages[i].name;
                }
            }

            if($scope.selectedLanguage != currentMode){
                bad = true;
            }

            if (bad && currentMode) {
                $scope.currentLanguage = currentMode;
            }
        };

        //Scroll into view line
        $scope.goToLine = function(line) {
            var editor = $scope._editor;
            editor.scrollIntoView({
                line: line,
                ch: 0
            });
            editor.addLineClass(line, "text", "line-active");
            $timeout(function() {
                editor.removeLineClass(line, "text", "line-active");
            }, 200);
        };

        //Event to send a message
        $scope.messageEvent = function(e) {
            var text = $scope.messageText;
            if (event.keyCode === 13 && text.trim() !== "") {
                $scope.messageText = "";
                $scope.sendEvents["sendMessage"](text);
            }
        };

        //removes user from users array
        $scope.removeUser = function(obj, cb) {
            for (var i = 0; i != $scope.users.length; ++i) {
                var colorAtI = $scope.users[i].color;
                if (obj == colorAtI) {
                    var whoLeft = $scope.users.splice(i, 1);
                    cb(whoLeft[0]);
                    break;
                }
            }
        };

        //keeps track of mouse position
        $scope.mouseMoved = function(e) {
            for(var i = 0; i < $scope.users.length; ++i) {
                var deltaX = e.x - $scope.users[i].x;
                var deltaY = e.y - $scope.users[i].y;
                var diff = Math.pow(deltaX, 2) + Math.pow(deltaY, 2);
                diff = parseInt(Math.sqrt(diff));

                // if the diff is less than 100 and show is false
                if (diff <= 100 && !$scope.users[i].show) {
                    $scope.users[i].show = true;
                // if the diff is more than 100 and show is true
                } else if(diff > 100 && $scope.users[i].show) {
                    $scope.users[i].show = false;
                }
            }
        };

        //Trusted html code
        $scope.to_trusted = function(html_code) {
            return $sce.trustAsHtml(html_code);
        };

        //How many users
        $scope.who = function() {
            return $scope.users.length;
        };

        //Event that fires right after user on page subscribes
        $scope.postSubscribe = function() {
            var obj = {
                type: "postsubscribe",
                name: $scope.name,
                color: $scope.color
            };
            Faye.publish("/" + $scope.instanceId, JSON.stringify(obj));
        }

        $scope.init = function() {
            //Initialize event handlers
            $scope.receiveEvents = new ReceiveEventHandler($scope);
            $scope.sendEvents = new SendEventHandler($scope, Faye);

            //Initialize objects
            $scope.name = "";
            $scope.showChat = true;
            $scope.instanceId = $routeParams.id;
            $scope.color = "";
            $scope.comments = [];
            $scope.users = [];
            $scope.selectedLanguage = "";
            $scope.currentLanguage = $scope.languages[0].name;
        };

        $scope.fayeLoading = function() {
            //get users currently in the instance
            Faye.getUsers($scope.instanceId, function(users) {
                for (var i = 0; i != users.length; ++i) {
                    $scope.users.push({
                        name: users[i].name,
                        color: users[i].color
                    });
                }
            });

            //Get file
            Faye.getFile($scope.instanceId, function(payload) {
                $scope._editor.setValue(JSON.parse(payload));
            });

            // Listen to data coming from the server via Faye
            Faye.subscribe("/" + $scope.instanceId, function(msg) {
                // Handle messages
                var message = JSON.parse(msg);
                var func = $scope.receiveEvents[message.type];
                if (func) func(message);
            });

            //if someone leaves page, tell everyone
            angular.element(window).bind("beforeunload", function() {
                Faye.unsubscribe();
            });
        };

        //Open Modal
        $scope.open = function() {
            var modalInstance = $modal.open({
                templateUrl: "modal.html",
                controller: "ModalCtrl",
                backdrop: "static"
            });
            modalInstance.result.then(function(username) {
                $scope.name = username;
                $scope.fayeLoading();
                $scope._editor.focus();
            });
        };

        $scope.init();
        $scope.open();
    }
]);

/* ###############################################################################
 * ##
 * ##                           ModalCtrl
 * ##
 * ############################################################################### */
MyApp.controller("ModalCtrl", ["$scope", "$modalInstance",
    function($scope, $modalInstance) {
        //Accept name
        $scope.ok = function(username) {
            if (username.trim() !== "") {
                $modalInstance.close(username);
            }
        };

        //User pressed enter
        $scope.enter = function(event, username) {
            if (event.keyCode === 13) {
                $scope.ok(username);
            }
        };
    }
]);