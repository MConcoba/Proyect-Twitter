'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var UserSchema = Schema({
    userName: String,
    password: String,
    followers : [{
        user: {type: Schema.ObjectId, ref: 'user'}
    }],
    followings: [{
        user: {type: Schema.ObjectId, ref: 'user'}
    }],
    numTweets: Number,
    numFollowers: Number,
    numFollowing: Number 
})

module.exports = mongoose.model('user', UserSchema)