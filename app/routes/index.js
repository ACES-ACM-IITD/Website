'use strict';

var path = process.cwd();
var contactFormMailer = require('../controllers/contactFormMailer.js');
var galleryController = require('../controllers/galleryController.js');
var userController = require('../controllers/userController.js');
var unzip = require('unzip');
var logger = require('../../logger');
const bcrypt = require("bcrypt");
const multer  = require('multer')
var User = require('../models/users.js');
var Event = require('../models/events.js');
const upload=multer({dest: '/public/uploads'})
module.exports = function(app, fs) {

	function isLoggedIn(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}
		else {
			res.redirect('/login');
		}
	}

	// Authentication and Authorization Middleware
	var auth = function(req, res, next) {
		if (req.session && req.session.user)
			return next();
		else
			return res.redirect('/login');
	};

	var adminAuth = function(req, res, next) {
		if (req.session && req.session.admin)
			return next();
		else
			return res.redirect('/login');
	};

	var presidentAuth = function(req, res, next) {
		if (req.session && req.session.president)
			return next();
		else
			return res.redirect('/login');
	};

	app.route('/')
		.get(function(req, res) {
			res.render(path + '/public/index');
		})
		.post(function(req, res) {
			//console.log(req.body);
			contactFormMailer.mailOptions["subject"] = 'MESSAGE FROM WEBSITE: ' + contactFormMailer.escapeHtml(req.body["subject"]);
			contactFormMailer.mailOptions["html"] = "<br /><p>" + contactFormMailer.escapeHtml(req.body["message"]) + "</p><br /><span>From :</span><br /><span>  " +
				contactFormMailer.escapeHtml(req.body["name"]) + "</span><br /><span>  " + contactFormMailer.escapeHtml(req.body["email"]) + "</span>";
			res.sendStatus(200);

			//contactFormMailer.sendFeedback();
			//res.redirect('/public/index.html');
		});
	app.route('/gallery')
		.get(function(req, res) {
			res.render(path + '/public/gallery');
		});
	app.route('/team')
		.get(function(req, res) {
			userController.allUsers().then(function(docs) {
				var users = docs;
				users.password = '';
				// console.log(users);
				res.render(path + '/public/team', { team: users });
			});
		});
	app.route('/events')
		.get(function(req, res) {
			res.render(path + '/public/events');
		});
	app.route('/images')
		.get(function(req, res) {
			res.send(galleryController.readDir());
		});
	app.route('/login')
		.get(function(req, res) {
			res.sendFile(path + '/public/login.html');
		})
		.post(function(req, res) {
			if (!req.body.username || !req.body.password) {
				res.send('login failed');
			}
			else if (req.body.username === process.env.USERNAME_ADMIN && req.body.password === process.env.PASSWORD_ADMIN) {
				logger.info('admin login');
				req.session.user = "admin";
				req.session.admin = true;
				req.session.president = false;
				res.redirect('/admin');
			}
			else if (req.body.username === process.env.USERNAME_PREZ && req.body.password === process.env.PASSWORD_PREZ) {
				logger.info("president login");
				req.session.user = "president";
				req.session.admin = true;
				req.session.president = true;
				res.redirect('/president');
			}
			else {
				userController.findUser(req.body).then(function(user) {
					req.session.user = user.username;
					req.session.admin = user.admin;
					logger.info('Login by= ' + req.session.user + ' isAdmin= ' + req.session.admin);
					if (user.admin) res.redirect('/admin');
					else res.redirect('/user');
				}, function(msg) {
					res.send(msg);
				});
			}
		});
	// app.route('/admin')
	// 	.get(adminAuth, function(req, res) {
	// 		bankController.getAmount().then(function(amt) {
	// 			res.render(path + '/public/admin', { amount: amt });
	// 		});
	// 	});
	app.route('/logout')
		.get(auth, function(req, res) {
			req.session.destroy();
			res.redirect('/login');
		});
	app.route('/pics')
		.post(auth, function(req, res) {
			if (Object.keys(req.files).length === 0 && req.files.constructor === Object)
				return res.status(400).send('No files were uploaded.');
			else if (req.files.file.name.slice(-3) != 'zip')
				return res.send('Please upload a zip file');
			req.files.file.mv(path + '/public/img/events/uploaded', function(err) {
				if (err)
					return res.status(500).send(err);
				logger.info('Pics uploaded by= ' + req.session.user + ' Filename= ' + req.files.file.name);
				try {
					fs.createReadStream(path + '/public/img/events/uploaded').pipe(unzip.Extract({ path: path + '/public/img/events/' }));
				}
				catch (err) {
					res.send('Please upload a valid zip file');
				}
				if (req.session.admin)
					res.redirect('/admin');
				else
					res.redirect('/user');
			});
		});
	// app.route('/bills')
	// 	.post(auth, function(req, res) {
	// 		if (Object.keys(req.files).length === 0 && req.files.constructor === Object)
	// 			return res.status(400).send('No files were uploaded.');
	// 		logger.info('Bill uploaded by= ' + req.session.user);
	// 		req.files.bill.mv(path + '/public/bills/' + req.body.event + '_' + req.files.bill.name, function(err) {
	// 			if (err)
	// 				return res.status(500).send(err);
	// 			billController.addBill(req.body, req.session.user, '/bills/' + req.body.event + '_' + req.files.bill.name);
	// 			if (req.session.admin)
	// 				res.redirect('/admin');
	// 			else
	// 				res.redirect('/user');
	// 		});
	// 	})
	// 	.get(auth, function(req, res) {
	// 		billController.allBills().then(function(docs) {
	// 			res.send(docs);
	// 		});
	// 	});
	// app.route('/update')
	// 	.get(adminAuth, function(req, res) {
	// 		logger.info('Bill deleted by= ' + req.session.user);
	// 		billController.deleteBill(req.query.id);
	// 		if (req.session.president)
	// 			res.redirect('/president');
	// 		else
	// 			res.redirect('/admin');
	// 	})
	// 	.post(adminAuth, function(req, res) {
	// 		logger.info('Bill marked reimbursed by= ' + req.session.user);
	// 		billController.updateBill(req.body.bill_id);
	// 		if (req.session.president)
	// 			res.redirect('/president');
	// 		else
	// 			res.redirect('/admin');
	// 	});
	app.route('/users')
		.get(adminAuth, function(req, res) {
			userController.allUsers().then(function(docs) {
				var users = docs;
				users.password = '';
				res.send(users);
			});
		})
		.post(adminAuth, function(req, res) {
			req.files.pic.mv(path + '/public/team_pics/' + req.body.username + '_' + req.files.pic.name, function(err) {
				if (err)
					return res.status(500).send(err);
				logger.info('User added by= ' + req.session.user + ' username= ' + req.body.username);
				userController.addUser(req.body, '/team_pics/' + req.body.username + '_' + req.files.pic.name);
				if (req.session.president)
					res.redirect('/president');
				else
					res.redirect('/admin');
			});
		});
	app.route('/user_del')
		.get(adminAuth, function(req, res) {
			logger.info('User deleted by= ' + req.session.user);
			userController.deleteUser(req.query.id);
			if (req.session.president)
				res.redirect('/president');
			else
				res.redirect('/admin');
		});
	app.route('/user')
		.get(auth, function(req, res) {
			res.render(path + '/public/user');
		});
	// app.route('/bank')
	// 	.post(adminAuth, function(req, res) {
	// 		bankController.updateAmount(req.body.amount);
	// 		if (req.session.president)
	// 			res.redirect('/president');
	// 		else
	// 			res.redirect('/admin');
	// 	})
	// 	.get(presidentAuth, function(req, res) {
	// 		logger.info('Withdraw request deleted');
	// 		withdrawController.deleteRequest(req.query.id);
	// 		res.redirect("/president");
	// 	});
	// app.route('/withdraw')
	// 	.post(adminAuth, function(req, res) {
	// 		logger.info('Withdrawal request added by: ' + req.session.user);
	// 		withdrawController.addWithdraw(req.body, req.session.user);
	// 		if (req.session.president)
	// 			res.redirect('/president');
	// 		else
	// 			res.redirect('/admin');
	// 	})
	// 	.get(adminAuth, function(req, res) {
	// 		withdrawController.allWithdraw().then(function(data) {
	// 			res.send(data);
	// 		});
	// 	});
	// app.route('/president')
	// 	.get(presidentAuth, function(req, res) {
	// 		bankController.getAmount().then(function(amt) {
	// 			res.render(path + '/public/president', { amount: amt });
	// 		});
	// 	})
	// 	.post(presidentAuth, function(req, res) {
	// 		logger.info('Withdraw request approved');
	// 		withdrawController.updateRequest(req.body.id);
	// 		res.redirect("/president");
	// 	});
	// app.route('/collected')
	// 	.get(adminAuth, function(req, res) {
	// 		collectedController.allCollected().then(function(data) {
	// 			res.send(data);
	// 		});
	// 	})
	// 	.post(adminAuth, function(req, res) {
	// 		logger.info('Money collected added by: ' + req.session.user);
	// 		collectedController.addCollected(req.body, req.session.user);
	// 		if (req.session.president)
	// 			res.redirect('/president');
	// 		else
	// 			res.redirect('/admin');
	// 	});
	app.route('/moveup')
		.get(adminAuth, function(req, res) {
			userController.moveUp(req.query.id);
			if (req.session.president)
				res.redirect('/president');
			else
				res.redirect('/admin');
		});
	app.route('/movedown')
		.get(adminAuth, function(req, res) {
			userController.moveDown(req.query.id);
			if (req.session.president)
				res.redirect('/president');
			else
				res.redirect('/admin');
		});
	app.route('/adduser')
	.post( async function(req,res, next){
		try {
			const user = new User(req.body);
			user.save()
			res.json(user);
		} catch (error) {
			console.log("error");
			res.json(error);
			
		}
		
	});
	app.route('addevent').
	post(adminAuth, async function(req,res){
		try {
			const event = new Event(req.body);
			user.save()
			res.json(event);
		} catch (error) {
			console.log("error");
			res.json(error);
			
		}
	})
	app.route('addteam').
	post(adminAuth, async function(req,res){
		try {
			const event = new User(req.body);
			user.save()
			res.json(event);
		} catch (error) {
			console.log("error");
			res.json(error);
			
		}
	})
};
