var cradle = require('cradle');
var db = new(cradle.Connection)({
	cache: false,
	auth: {
		username: 'root',
		password: 'root'
	}
});
var userDb = db.database('_users');

var user = {
	createUserDatabase: function(data, res, userData) {
		var newDb = db.database(data.name);
		newDb.exists(function(error, exists) {
			if (error) {
				user.deleteUser(userData);
				res.json({
					success: false,
					message: 'There was an error creating user database.',
					data: err
				});
			}
			else if (exists) {
				user.deleteUser(userData);
				res.json({
					success: false,
					message: 'User database already exists.',
					data: {}
				});
			}
			else {
				newDb.create();
				//setTimeout(function() {
				//	user.setUserDatabaseSecurity(newDb, data, res, userData);
				//}, 3000);
				user.setUserDatabaseSecurity(newDb, data, res, userData);
			}
		});
	},
	setUserDatabaseSecurity: function(newDb, data, res, userData) {
		newDb.exists(function(error, exists) {
			if (!exists) {
				user.deleteUser(userData);
				res.json({
					success: false,
					message: 'There was an error creating user database.',
					data: {}
				});
			}
			else {
				var securityObject = {
					"admins" : {
						"names" : [],
						"roles" : ["admin"]
					},
					"members" : {
						"names" : [data.name],
						"roles" : []
					}
				};
				newDb.save('_security', securityObject, function(error, response) {
					if (error) {
						user.deleteUser(userData);
						db.destroy(data.name);
						res.json({
							success: false,
							message: 'There was an error creating user database.',
							data: error
						});
					}
					else {
						res.json({
							success: true,
							message: 'User database created.',
							data: userData
						});
					}
				});
			}
		});
	},
	saveUser: function(data, res) {
		userDb.save(data, function(error, response) {
			var userData = {
				id: response.id,
				rev: response.rev
			};
			if (error) {
				res.json({
					success: false,
					message: 'User could not be created.',
					data: error
				});
			}
			else {
				user.createUserDatabase(data, res, userData);
			}
		});
	},
	deleteUser: function(userData) {
		userDb.remove(userData.id, userData.rev, function(err, res) {
			console.log(err || res);
		});
	}
};

module.exports = {
	create: function(req, res) {

		// Display name validation
		req.assert('displayName', 'Display name is required').notEmpty();
		req.assert('displayName', 'Display name must be between 4 and 20 characters.').len(4, 20);
		req.assert('displayName', 'Display name can only contain letters or numbers with no spaces.').isAlphanumeric();

		// Email validation
		req.assert('email', 'Email is required').notEmpty();
		req.assert('email', 'Email entered is not valid.').isEmail();

		// password validation
		req.assert('password', 'A valid password is required').notEmpty();
		req.assert('password', 'Password must be between 4 and 20 characters.').len(4, 20);

		var errors = req.validationErrors();
		if(errors){
			res.json({
				success: false,
				message: 'There are validation errors.',
				data: errors
			});

		}
		else if (!errors){

			var displayName = req.sanitize('displayName').trim().toString();
			var email = req.sanitize('email').trim().toString();
			var parsedEmail1 = email.replace('.', '_');
			var parsedEmail = parsedEmail1.replace('@', '_');
			var password = req.sanitize('password').trim().toString();

			var data = {
				_id: 'org.couchdb.user:' + parsedEmail,
				type: 'user',
				roles: [],
				name: parsedEmail,
				displayName: displayName,
				email: email,
				password: password
			};

			userDb.get('org.couchdb.user:' + data.name, function(error, doc) {
				if (error) {
					user.saveUser(data, res);
				}
				else {
					res.json({
						success: false,
						message: 'Email already exists in the database.',
						data: {}
					});
				}
			});
		}
	}
};