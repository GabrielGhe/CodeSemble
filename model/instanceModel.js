var mongoose = require('mongoose');

var instanceModelSchema = mongoose.Schema({
	users : [String]
});

/**
 * Method to close DrawIns
 * @param  {String} inst_id [id of session]
 */
instanceModelSchema.statics.removeInstanceIfEmpty = function(inst_id){
	var good_sess_id = sess_id.substring(1);
	this.findOne({ _id : good_sess_id}, function(err, obj){
		if(!err){
			if(obj && obj.users.length == 0){
				obj.remove();
			}
		} else {
			console.log(err);
		}
	});
}

/**
 * Method used to create new session
 */
instanceModelSchema.statics.createSingleInstance = function(res){
	var entry = new this({ users : [] });
	entry.save();
	console.log("Created new Draw Instance " + entry.id);
	res.redirect(301, "/" + entry.id);
}

/**
 * Method used to save a single user
 * @param  {string} user_id [Id of the user]
 * @param  {string} inst_id [Id of the session]
 */
instanceModelSchema.statics.saveSingleUser = function(user_id, inst_id){
	console.log("In Save Single User");
	var Model = this;
	var good_inst_id = inst_id.substring(1);
	Model.findOneAndUpdate({ _id : good_inst_id}, {$push : { users : user_id }}, function(err, model){
		if(err) console.log(err);
	});
}

/**
 * Method to remove a single user
 * @param  {string} user_id [Id of the user]
 * @param  {string} inst_id [Id of the session]
 */
instanceModelSchema.statics.removeSingleUser = function(user_id, inst_id){
	var Model = this;
	var good_inst_id = inst_id.substring(1);
	Model.update({ '_id' : good_inst_id}, {$pull : {users : user_id}}, function(err, model){
		if(!err){
			Model.removeSessionIfEmpty(inst_id);
		} else {
			console.log(err);
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
		var users;
		if(!err && obj){
			users = obj.users;
			res.render('instanceView', { title: 'Codeship', users: users });
		} else {
			if(err) console.log(err);
			if(!obj) res.redirect(301, "/404"); //TODO make a 404
		}
	});
}

module.exports = mongoose.model('InstanceModel', instanceModelSchema, 'InstanceModel');