var InstanceModel = require('../model/instanceModel');

//Get Home
exports.index = function(req, res){
  InstanceModel.createSingleInstance(res);
};

//GET instance
exports.instancePath = function(req, res){
	InstanceModel.getUsers(req.params.id, res);
};

//Faye Message passing
exports.message = function(req, res){
	bayeux.getClient().publish("/channel", {text: req.body.message});
	res.send(200);
};