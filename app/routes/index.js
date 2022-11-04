"use strict";
const util = require('util');
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;
var path = process.cwd();
var contactFormMailer = require('../controllers/contactFormMailer.js');
var galleryController = require('../controllers/galleryController.js');
var userController = require('../controllers/userController.js');
var unzip = require('unzip');
var logger = require('../../logger');
var User = require('../models/users.js');
var Event = require('../models/events.js');
var Team = require('../models/team.js');
const formidable=require("formidable")
const path1=require("path");
const { events } = require('../models/users.js');
const { stringify } = require('querystring');
module.exports = function(app, fs) {

  
function isLoggedIn(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}
		else {
			res.redirect('/login');
		}
	}
function renameFile(oldPath, newPath){
	var rawData = fs.readFileSync(oldPath)
        fs.writeFile(newPath, rawData, function(err){
            if(err){return res.json({err: true})}
            
        })
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

	app.route('/user_del')
		.get(adminAuth, function(req, res) {
			logger.info('User deleted by= ' + req.session.user);
			userController.deleteUser(req.query.id);
			if (req.session.president)
				res.redirect('/president');
			else
				res.redirect('/admin');
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
	app.route('/adduser').post(async function(req,res){
		try {
			const form = new formidable.IncomingForm();

    	form.parse(req, async function(err, fields, files){
		const user = new User(fields);
        var oldPath = files.profile_pic.filepath;
		const extension=files.profile_pic.mimetype.split('/')
		const fname=fields.username+'.'+extension[1]
        var newPath = path1.join(__dirname, '/../../upload', fname)
        renameFile(oldPath,newPath)
		user.profile_pic=newPath;
		const check_for_duplicates = await User.findOne({username : fields.username})
		if(check_for_duplicates==null){
			await user.save().catch
			res.json({err: false, msg: "Successfully uploaded user"})
		}
		else{
			res.json({err: true, msg: "User already in database"})
		}
		
  })
		} catch (error) {
			res.json({err: true});
			
		}
		
	});
	app.route('/adduser').get(adminAuth, async function(req,res){
		const users=await User.find()
		res.json(users)
	})
	app.route('/addevent').post(async function(req,res){
		try {
			const form = new formidable.IncomingForm({
				multiples: true,
			  });
    		form.parse(req, async function(err, fields, files){
			const event = new Event(fields)
			var idstr=event._id.toString()
			event.gallery=[]
			// event.date=Date.parse(fields.date)
			const arr=files.gallery
			let sz= files.gallery.length
			const dir = path1.resolve(path1.join(__dirname, `/../../upload/${idstr}`))
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir);
			  }
			arr.forEach((element, index)=>{
				var newobj={}
				var oldPath=element.filepath
				const fname=index.toString()+'.'+ element.mimetype.split('/')[1]
				var newPath = path1.join(__dirname, `/../../upload/${idstr}`, fname)
				renameFile(oldPath,newPath)
				newobj.imageUrl=newPath
				event.gallery.push(newobj)
			})
			await event.save()
			res.json({err: false, msg: "Successfully uploaded event"})
		
  })
		} catch (error) {
			res.json(error);
			
		}
	})
	app.route('/addevent').get(async function (req,res){
		const eventobj=await Event.find();
		res.json(eventobj)
	})
	app.route(adminAuth, '/addteam').
	post(async function(req,res){
		try {
			const yearobj = await Team.findOne({ year: req.body.year});
			const curr_user=await User.findOne({email : req.body.email});
			if(curr_user==null)
			{
				res.json({err: false, msg : "current user not registered: error"})
			}
			if(yearobj==null)
			{
				const obj=new Team({year : req.body.year, positions : [{position_name: req.body.position_name, people : [curr_user]}]});
				await obj.save()
				res.json({err : false, msg: "Data saved successfully"})
			}
			else
			{
				const porobj = await Team.findOne({$and:[{year : req.body.year},{positions: {$elemMatch: {position_name: req.body.position_name}}}]})
				if(porobj!=null)
				{
					const item = porobj.positions.find(item=>item.position_name, req.body.position_name);
					item.people.push(curr_user)
					await porobj.save()
					res.json({err : false, msg: "Data saved successfully"})
				}
				else
				{
					yearobj.positions.push({position_name: req.body.position_name, people : [curr_user]});
					await yearobj.save()
					res.json({err : false, msg: "Data saved successfully"})
				}
					
			}
		} catch (error) {
			res.json({err: true});
			
		}
	})
	app.route("/addteam").get(adminAuth, async function(req,res){
		const teamobj=await Team.find()
		const sz=teamobj.length
		const cleanedobj = []
		for(let i=0;i<sz;i++)
		{
			const newobj={}
			newobj.year=teamobj[i].year
			newobj.positions=[]
			let j= teamobj[i].positions.length
			for(let k =0;k<j;k++)
			{
				const secnewobj={}
				secnewobj.position_name=teamobj[i].positions[k].position_name;
				secnewobj.people=[]
				let l = teamobj[i].positions[k].people.length;
				console.log("iterating over ", teamobj[i].year, " and " , teamobj[i].positions[k].position_name, " with strength ", l)
				for(let p=0;p<l;p++)
				{
					console.log("searching for ", teamobj[i].positions[k].people[p])
					const user = await User.findOne({_id: teamobj[i].positions[k].people[p]})
					if(user!=null)
					{
						secnewobj.people.push(user.name)
					}
					
				}
				newobj.positions.push(secnewobj)
			}
			cleanedobj.push(newobj)
		}
		res.json(cleanedobj)
	})
};
