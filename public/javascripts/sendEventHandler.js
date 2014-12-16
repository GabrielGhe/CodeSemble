"use strict";

function SendEventHandler(scope, Faye){
    var myScope = scope;
    var myFaye = Faye;

    this.changeLanguage = function(lang){
        var obj = {
            type: "changeLanguage",
            author: myScope.name,
            color: myScope.color,
            language: lang
        };
        Faye.publish("/" + myScope.instanceId, JSON.stringify(obj));
    };

    this.cursorActivity = function(pos){
        var obj = {
            type: "cursorActivity",
            y: pos.top,
            x: pos.left,
            color: pos.color
        };
        Faye.publish('/' + myScope.instanceId, JSON.stringify(obj));
    };

    this.cut = function(change){
        var obj = {
            type: "cut",
            author: myScope.name,
            color: myScope.color,
            from: {
                ch: change.from.ch,
                line: change.from.line
            },
            to: {
                ch: change.to.ch,
                line: change.to.line
            }
        };
        Faye.publish('/' + myScope.instanceId, JSON.stringify(obj));
    };

    this["+delete"] = function(change){
        var obj = {
            type: "+delete",
            author: myScope.name,
            color: myScope.color,
            from: {
                ch: change.from.ch,
                line: change.from.line
            },
            to: {
                ch: change.to.ch,
                line: change.to.line
            }
        };
        Faye.publish("/" + myScope.instanceId, JSON.stringify(obj));
    };

    this["+input"] = function(change, cm){
        var lines = [];
        for(var i = 0; i < change.text.length; ++i){
            lines.push(cm.getLine(change.from.line + i));
        }
        var obj = {
            type: "+input",
            author: myScope.name,
            color: myScope.color,
            from: {
                ch: change.from.ch,
                line: change.from.line
            },
            to: {
                ch: change.to.ch,
                line: change.to.line
            },
            text: change.text.join("\n"),
            lines: lines
        };
        Faye.publish("/" + myScope.instanceId, JSON.stringify(obj));
    };

    this.paste = function(change){
        var obj = {
            type: "paste",
            author: myScope.name,
            color: myScope.color,
            from: {
                ch: change.from.ch,
                line: change.from.line
            },
            to: {
                ch: change.to.ch,
                line: change.to.line
            },
            text: change.text.join("\n")
        };
        Faye.publish("/" + myScope.instanceId, JSON.stringify(obj));
    };

    this.scrollIntoView = function(obj){
        var obj = {
            type:"scrollIntoView",
            author: myScope.name,
            color: myScope.color,
            text: "Look at line " + (obj.line + 1),
            line: obj.line
        };
        Faye.publish('/' + myScope.instanceId, JSON.stringify(obj));
    };

    this.sendMessage = function(text){
        var obj = {
            type:"sendMessage",
            author: myScope.name,
            color: myScope.color,
            text: text
        };
        Faye.publish("/" + myScope.instanceId, JSON.stringify(obj));
    };
}
