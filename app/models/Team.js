'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Team = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    year: {
        position: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
});

module.exports = mongoose.modesl('Team', Team);
