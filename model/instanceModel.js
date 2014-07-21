var mongoose = require('mongoose');
var ColorMaker = require('../utils/colorMaker');
var moment = require('moment');

var instanceModelSchema = mongoose.Schema({
	users : [{
		_id: String,
		name: String,
	}],
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
instanceModelSchema.statics.createSingleInstance = function(res){
	var unixTimestamp = moment().unix();
	var entry = new this({ users: [], created: unixTimestamp, updated: unixTimestamp });
	entry.save();
	console.log("Created new Instance " + entry.id);
	res.redirect(301, "/" + entry.id);
}

/**
 * Method that returns the instance
 * @param  {String} inst_id [session id]
 * @param  {Object} res     [response]
 */
instanceModelSchema.statics.getInstance = function(inst_id, res){
	var Model = this;
	Model.findOne({ "_id" : inst_id }, function(err, obj){
		var users;
		if(!err && obj){
			res.render('instanceView', { title: 'CodeSemble' });
		} else {
			if(err) console.log(err);
			if(!obj) res.redirect(301, "/404"); //TODO make a 404
		}
	});
}


/**
 * Method to get all the users
 * @param  {String} inst_id [session id]
 * @param  {Object} res     [response]
 */
instanceModelSchema.statics.getUsers = function(inst_id, res){
	var Model = this;
	Model.findOne({ "_id" : inst_id }, function(err, obj){
		var users = [];
		if(!err && obj){
			users = obj.users.map(function(el){
				return ColorMaker.makeRGB(el._id);
			});
		}
		res.write(JSON.stringify(users));
		res.end();
	});
}

/**
 * Method to remove empty Instances
 */
instanceModelSchema.statics.removeAllEmpty = function(){
	this.remove({ $or: [
		{ "users" : { $size: 0 } },
		{ "updated": { $lt: moment().subtract("hours", 3).unix() }}
	]}, function(err, x){});
}

/**
 * Method to remove a single user
 * @param  {string} user_id [Id of the user]
 * @param  {string} inst_id [Id of the session]
 * @param  {func} cb [callback]
 */
instanceModelSchema.statics.removeSingleUser = function(user_id, inst_id, cb){
	var Model = this;
	var good_inst_id = inst_id.substring(1);
	Model.update({ "_id" : good_inst_id}, {$pull : {users : { _id: user_id } } }, function(err, model){
		if(!err){
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
instanceModelSchema.statics.saveSingleUser = function(user_id, inst_id, cb){
	var Model = this;
	var good_inst_id = inst_id.substring(1);
	var user_obj = { _id: user_id };
	Model.update({ _id : good_inst_id}, {$push : { users : user_obj }}, function(err, model){
		if(err){
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
instanceModelSchema.statics.setSingleUserName = function(user_id, inst_id, name){
	var Model = this;
	var good_inst_id = inst_id.substring(1);
	Model.update({ _id: good_inst_id, users: { _id: user_id }}, {$set: { 'users.$.name': name }}, function(err, model){
		if(err){ console.log(err); }
	});
}


/**
 * Method to update creation time
 * @param  {String} inst_id [session id]
 */
instanceModelSchema.statics.updateDateInstance = function(inst_id, cb){
	var Model = this;
	var good_inst_id = inst_id.substring(1);
	Model.update({ '_id' : good_inst_id}, {$set: { 'updated': moment().unix() }}, function(err, model){
		if(err){
			console.log("Error updating date", err);
		} else {
			console.log("New model", model);
		}
	});
}

module.exports = mongoose.model('InstanceModel', instanceModelSchema, 'InstanceModel');
