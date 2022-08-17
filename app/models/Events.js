'use strict';


var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Events = new Schema({

    year: {
        date: Date,
        event_name: String,
        description: String,
        gallery: [{ imageurl: String }],

    }


});

module.exports = mongoose.modesl('Events', Events);