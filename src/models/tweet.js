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
    replysTweet: [{
        user: {type: Schema.ObjectId, ref: 'user'},
        comment: String
    }],
    retweets: [{
        user: {type: Schema.ObjectId, res: 'user'}
    }],
    commentRetweet: String,
    infoTweetOrigin: {type: Schema.ObjectId, res: 'tweet'},
    numLikes: Number,
    numReplysTweet: Number,
    numRetweets: Number
})

module.exports = mongoose.model('tweet', TweetSchema)