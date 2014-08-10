"use strict";

var mongoose = require('mongoose');
var ColorMaker = require('../utils/colorMaker');
var moment = require('moment');
var ReadWriteLock = require('rwlock');
var lock = new ReadWriteLock();

var instanceModelSchema = mongoose.Schema({
    users: [{
        _id: String,
        name: String,
    }],
    file: String,
    updated: Number,
    created: Number
});

//createSingleInstance
//getInstance
//getUsers
//removeAllEmpty
//removeSingleUser
//saveSingleUser
//setSingleUserName
//updateDateInstance

/**
 * Method used to create new session
 */
instanceModelSchema.statics.createSingleInstance = function(res) {
    var unixTimestamp = moment().unix();
    var entry = new this({
        users: [],
        file: "\n\n\n",
        created: unixTimestamp,
        updated: unixTimestamp
    });
    entry.save();
    console.log('Created new Instance ' + entry.id);
    res.redirect(301, "/" + entry.id);
}

/**
 * Method that returns the instance
 * @param  {String} inst_id [session id]
 * @param  {Object} res     [response]
 */
instanceModelSchema.statics.getInstance = function(inst_id, res) {
    var Model = this;
    Model.findOne({
        "_id": inst_id
    }, function(err, obj) {
        var users;
        if (!err && obj) {
            res.render('instanceView', {
                title: 'CodeSemble'
            });
        } else {
            if (err) console.log(err);
            if (!obj) res.redirect(301, "/404"); //TODO make a 404
        }
    });
}


/**
 * Method to get all the users
 * @param  {String} inst_id [session id]
 * @param  {Object} res     [response]
 */
instanceModelSchema.statics.getUsers = function(inst_id, res) {
    var Model = this;
    Model.findOne({
        '_id': inst_id
    }, function(err, obj) {
        var users = [];
        if (!err && obj) {
            users = obj.users.map(function(el) {
                return ColorMaker.makeRGB(el._id);
            });
        }
        res.write(JSON.stringify(users));
        res.end();
    });
}

/**
 * Method to get all the users
 * @param  {String} inst_id [session id]
 * @param  {Object} res     [response]
 */
instanceModelSchema.statics.getFile = function(inst_id, res) {
    var Model = this;
    Model.findOne({
        '_id': inst_id
    }, function(err, obj) {
        if (!err && obj) {
            var file = obj.file;
            if(file){
                res.write(JSON.stringify(file));
            }
            res.end();
        }
    });
}

/**
 * Method to remove empty Instances
 */
instanceModelSchema.statics.removeAllEmpty = function() {
    this.remove({
        $or: [{
            'users': {
                $size: 0
            }
        }, {
            'updated': {
                $lt: moment().subtract('hours', 3).unix()
            }
        }]
    }, function(err, x) {});
}

/**
 * Method to remove a single user
 * @param  {string} user_id [Id of the user]
 * @param  {string} inst_id [Id of the session]
 * @param  {func} cb [callback]
 */
instanceModelSchema.statics.removeSingleUser = function(user_id, inst_id, cb) {
    var Model = this;
    var good_inst_id = inst_id.substring(1);
    Model.update({
        '_id': good_inst_id
    }, {
        $pull: {
            users: {
                _id: user_id
            }
        }
    }, function(err, model) {
        if (!err) {
            Model.removeAllEmpty();
            cb(model.user_id);
        } else {
            console.log(err);
        }
    });
}

/**
 * Method used to save a single user
 * @param  {string} user_id [Id of the user]
 * @param  {string} inst_id [Id of the session]
 */
instanceModelSchema.statics.saveSingleUser = function(user_id, inst_id, cb) {
    var Model = this;
    var good_inst_id = inst_id.substring(1);
    var user_obj = {
        _id: user_id
    };
    Model.update({
        _id: good_inst_id
    }, {
        $push: {
            users: user_obj
        }
    }, function(err, model) {
        if (err) {
            console.log(err);
        } else {
            cb();
        }
    });
}

/**
 * Method to set the user's name
 * @param  {String} user_id [Id of the user]]
 * @param  {String} inst_id [Id of the session]
 * @param  {String} name    [name to set]
 */
instanceModelSchema.statics.setSingleUserName = function(user_id, inst_id, name) {
    var Model = this;
    var good_inst_id = inst_id.substring(1);
    Model.update({
        _id: good_inst_id,
        users: {
            _id: user_id
        }
    }, {
        $set: {
            'users.$.name': name
        }
    }, function(err, model) {
        if (err) {
            console.log(err);
        }
    });
}


/**
 * Method to update creation time
 * @param  {String} inst_id [session id]
 */
instanceModelSchema.statics.updateDateInstance = function(inst_id) {
    var Model = this;
    var good_inst_id = inst_id.substring(1);
    Model.update({
        '_id': good_inst_id
    }, {
        $set: {
            'updated': moment().unix()
        }
    }, function(err, model) {
        if (err) console.log('Error updating date', err);
    });
}

/**
 * Method to get all the users
 * @param  {String} inst_id [session id]
 * @param  {Object} data    [data]
 */
instanceModelSchema.statics.updateFile = function(inst_id, data){
    var Model = this;
    var good_inst_id = inst_id.substring(1);
    var obj = {};

    function addText(data, model, release){
        var text = model.file.split("\n");
        var line = text[data.from.line];
        var toadd = (data.text === "")? "\n" : data.text;

        line = line.slice(0, data.from.ch) + toadd + line.slice(data.from.ch);
        text[data.from.line] = line;

        text = text.join("\n").split("\n");
        for(var i=0; i < data.lines.length; ++i){
            text[data.from.line + i] = data.lines[i];
        }

        model.file = text.join("\n");
        model.save(function(e){
            release();
        });
    }

    function removeText(data, model, release){
        var text = model.file;
        var lines = text.split("\n");
        
        function removeLinesInBetween(lines, start, end){
            var removed = 0;
            for(var i=end-1; i > start; --i){
                lines.splice(i, 1);
                ++removed;
            }

            return {
                removed: removed,
                lines: lines
            };
        }

        function replaceRange(s, start, end, substitute) {
            return s.substring(0, start) + substitute + s.substring(end);
        }

        var newLines = removeLinesInBetween(lines, data.from.line, data.to.line);
        lines = newLines.lines;
        data.to.line -= newLines.removed;

        //same line
        if (data.from.line === data.to.line){
            lines[data.from.line] = replaceRange(lines[data.from.line], data.from.ch, data.to.ch, "");
        } else {
            //diff line
            lines[data.from.line] = lines[data.from.line].substring(0, data.from.ch) + lines[data.to.line].substring(data.to.ch);
            lines.splice(data.to.line, 1);
        }

        model.file = lines.join("\n");
        model.save(function(e){
            release();
        });
    }

    //CUT
    obj.cut = function(data, model, release){
        removeText(data, model, release);
    };
    //DELETE
    obj["+delete"] = function(data, model, release){
        removeText(data, model, release);
    };
    //PASTE
    obj.paste = function(data, model, release){
        addText(data,model, release);
    };
    //ADD
    obj["+input"] = function(data, model, release){
        addText(data,model, release);
    };

    Model.findOne({
        "_id": good_inst_id
    }, function(err, model) {
        if (!err && model) {
            var func = obj[data['type']];
            if(func){
                lock.writeLock(good_inst_id, function (release) {
                    func(data, model, release);
                });
            }       
        }
    });
}

module.exports = mongoose.model('InstanceModel', instanceModelSchema, 'InstanceModel');