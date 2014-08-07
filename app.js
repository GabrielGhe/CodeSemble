
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var InstanceModel = require('./model/instanceModel');
InstanceModel.removeAllEmpty();

//Mongoose connecting
//---------------------------------------------
var mongoose = require('mongoose');
if (process.env.NODE_ENV === 'production') {
    mongoose.connect('mongodb://cmg427:First Heroku App@kahana.mongohq.com:10034/app28150436');
} else {
    mongoose.connect('mongodb://localhost/codesemble');
}

mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});

var app = express();

// all environments
//---------------------------------------------
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
//---------------------------------------------
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// routes
//---------------------------------------------
app.get('/', routes.index);
app.get('/404', routes.pageNotFound);
app.get('/:id', routes.getInstancePath);
app.get('/message', routes.message);
app.get('/:id/users', routes.getUsers);
app.get('/:id/file', routes.getFile);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//FAYE
//---------------------------------------------
var faye = require('faye');
var bayeux = new faye.NodeAdapter({
	mount: '/faye',
	timeout: 10
});

bayeux.attach(server);
var bayeuxEvents = require('./routes/events');
bayeuxEvents.setup(bayeux);
