var InstanceModel = require('../model/instanceModel');

//Get Home
exports.index = function(req, res){
    InstanceModel.createSingleInstance(res);
};

//Get 404
exports.pageNotFound = function(req, res){
    res.send(404);
};

//GET instance
exports.getInstancePath = function(req, res){
	InstanceModel.getInstance(req.params.id, res);
};

//Faye Message passing
exports.message = function(req, res){
	bayeux.getClient().publish('/channel', {text: req.body.message});
	res.send(200);
};

exports.getUsers = function(req, res){
	InstanceModel.getUsers(req.params.id, res);
};

exports.getFile = function(req, res){
    InstanceModel.getFile(req.params.id, res);
};
