'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var UserSchema = Schema({
    userName: String,
    password: String,
    tweets: [{
        tweet: String
    }],
    followers : [{
        user: {type: Schema.ObjectId, ref: 'user'}
    }],
    following: [{
        user: {type: Schema.ObjectId, ref: 'user'}
    }],
    numFollowers: Number,
    numFollowing: Number 
})

module.exports = mongoose.model('user', UserSchema)