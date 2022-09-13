'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var routes = require('./app/routes/index.js');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var nodemailer = require('nodemailer');
var fs = require('fs');
var morgan = require('morgan');
var User = require('./app/models/users.js');
var path = require('path');
var fs = require('fs');
var app = express();
require('dotenv').load();
var busboy_dep = require('connect-busboy')
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser: true, useUnifiedTopology: true }
).then(() => {
    console.log("Connected to Database");
    }).catch((err) => {
        console.log("Not Connected to Database ERROR! ", err);
    });;
mongoose.Promise = global.Promise;
//...                               
//     // request.files will contain the uploaded file(s),                                          
//     // keyed by the input name (in this case, "file")                                            

//     // show the uploaded file name                                                               
//     console.log("file name", request.files.file.name);                                           
//     console.log("file path", request.files.file.path);                                           

//     response.end("upload complete");                                                             
// });                                                                                              

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use('/', express.static(process.cwd() + '/public'));
app.use('.', express.static(process.cwd())); app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/common', express.static(process.cwd() + '/app/common'));
app.use(session({
	secret: '2C44-4D44-WppQ38S',
	resave: false, // change to true
	saveUninitialized: true
}));         

app.use(morgan('dev', {
    skip: function (req, res) {
        return res.statusCode < 400;
    }, stream: process.stderr
}));
app.use(morgan('dev', {
    skip: function (req, res) {
        return res.statusCode >= 400;
    }, stream: process.stdout
}));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
bodyParser.json([]);

routes(app, fs);

var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log('Node.js listening on port ' + port + '...');
});
