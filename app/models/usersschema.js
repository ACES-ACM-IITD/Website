'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    name: String,
    username: String,
    password: String,
    email: String,
    picpath: String,
    contact: Number,
    profiles: {
        fb_profile: String,
        linkedin_profile: String

    }
});

module.exports = mongoose.modesl('User', User);