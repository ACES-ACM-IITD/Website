'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    username: String,
    password: String,
    email: String,
    profile_pic: String,
    contact: Number,
    profiles: {
        fb_profile: String,
        linkedin_profile: String

    }
});

module.exports = mongoose.model('User', User);