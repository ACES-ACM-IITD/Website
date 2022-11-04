'use strict';


var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Events = new Schema({

        date: Date,
        name: String,
        description: String,
        gallery: [ {imageUrl: { type: String }}],


});

module.exports = mongoose.model('Events', Events);