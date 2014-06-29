function ReceiveEventHandler(scope){
    var myScope = scope;
    var firstTime = true;
    var self = this;

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

    this.addToEditor = function(obj){
        if(obj.color !== myScope.color){
            myScope._editor.replaceRange(obj.text,{
                line: obj.from.line,
                ch: obj.from.ch
            }, {
                line: obj.to.line,
                ch: obj.to.ch
            });
        }
    };

    this.deleteFromEditor = function(obj){
        if(obj.color !== myScope.color){
            myScope._editor.replaceRange("",{
                line: obj.from.line,
                ch: obj.from.ch
            }, {
                line: obj.to.line,
                ch: obj.to.ch
            });
        }
    };

    this["+input"] = function(obj){
        self.addToEditor(obj);
    };

    this["+delete"] = function(obj){
        self.deleteFromEditor(obj);
    };

    this["paste"] = function(obj){
        self.addToEditor(obj);
    };

    this["cut"] = function(obj){
        self.deleteFromEditor(obj);
    }
}