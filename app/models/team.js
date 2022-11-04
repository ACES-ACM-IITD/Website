'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Team = new Schema({
    year: { type: Number, required: true },
    positions: [{
        position_name: { type: String, required: true},
        people : [{ type: Schema.Types.ObjectId, ref: 'User' }]
    }]
});

module.exports = mongoose.model('Team', Team);
