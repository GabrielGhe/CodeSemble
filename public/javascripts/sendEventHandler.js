function SendEventHandler(scope, Faye){
    var myScope = scope;
    var myFaye = Faye;

    this["+input"] = function(change){
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
            text: change.text.join("\n")
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
        Faye.publish('/' + myScope.instanceId, JSON.stringify(obj));
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
}