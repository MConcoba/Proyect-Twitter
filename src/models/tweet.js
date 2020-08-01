'use strictic'

var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var TweetSchema = Schema({
    tweet: String,
    date: Date,
    user: {type: Schema.ObjectId, ref: 'user'},
    usersLike: [{
        user: {type: Schema.ObjectId, ref: 'user'}
    }],
    numLikes: Number
})

module.exports = mongoose.model('tweet', TweetSchema)