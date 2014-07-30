"use strict";

var InstanceModel = require('../model/instanceModel');
var ColorMaker = require('../utils/colorMaker');
var Q = require('q');
var eventList = ['sendMessage', 'cut', 'paste', '+delete', '+input'];

/**
 * Setting up the bayeux events
 */
exports.setup = function(bay) {
    var bayeux = bay;

    var nameCheckExtension = {
        incoming: function(message, callback) {
		    try{
		    	if(message.channel.indexOf('/meta') === -1){
		    		var data = JSON.parse(message.data);
		    		if(data['type'] === 'postsubscribe'){
		    			InstanceModel.setSingleUserName(message.clientId, message.channel, data['name']);
		    		}
		    		if(eventList.indexOf(data['type']) > -1){
		    			InstanceModel.updateDateInstance(message.channel);
		    		}
		    	}
		    }finally{
		    	callback(message);
		    }
        }
    };
    bayeux.addExtension(nameCheckExtension);

    /**
     * The subscribe event
     * Happens when a new user subscribes to a channel
     */
    bayeux.on('subscribe', function(clientId, channel) {
        console.log('[  SUBSCRIBE] ' + clientId + ' -> ' + channel);
        //save in mongo and send new message that new user has subscribed
        InstanceModel.saveSingleUser(clientId, channel, function() {
            var obj = {
                type: "subscribe",
                color: ColorMaker.makeRGB(clientId)
            };
            bayeux.getClient().publish(channel, JSON.stringify(obj), function(err) {
                console.log('Error ', err);
            });
        });
    });

    /**
     * The unsubsribe event
     * Happens when a user unsubsribes, closes tab or loses connection
     */
    bayeux.on('unsubscribe', function(clientId, channel) {
        console.log('[UNSUBSCRIBE] ' + clientId + ' -> ' + channel);
        //delete from mongo and send new message that user has unsubscribed
        InstanceModel.removeSingleUser(clientId, channel, function() {

            var obj = {
                type: 'unsubscribe',
                color: ColorMaker.makeRGB(clientId)
            };

            bayeux.getClient().publish(channel, JSON.stringify(obj), function(err) {
                console.log('Error ', err);
            });
        });
    });

    /**
     * The disconnect event
     * Happens right after the subsribe event
     */
    bayeux.on('disconnect', function(clientId) {
        console.log('[ DISCONNECT] ' + clientId);
    });
};

//SETUP FAYE EXTENSION
//http://faye.jcoglan.com/node/extensions.html