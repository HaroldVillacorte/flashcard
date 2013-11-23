
/**
 * Module dependencies.
 */

 module.exports = function() {

 	var express = require('express');
	var routes = require('./routes');
	var user = require('./routes/user');
	var path = require('path');
	var expressValidator = require('express-validator');

	var app = express();

	// all environments
	app.set('port', process.env.PORT || 3000);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'ejs');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(expressValidator());
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));

	// development only
	if ('development' == app.get('env')) {
	  app.use(express.errorHandler());
	}

	app.all('*', function(req, res, next) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET, PUT');
	  	res.header('Access-Control-Allow-Headers', 'X-Requested-With');
	  	next();
	});

	app.get('/', routes.index);
	app.put('/put/user', user.create);

	return app;
 };
