'use strict';


var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Events = new Schema({

    year: {
        date: Date,
        name: String,
        description: String,
        gallery: [{ imageurl: String }],

    }


});

module.exports = mongoose.model('Events', Events);