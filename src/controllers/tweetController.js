'use strict'

var User = require('../models/user');
var Tweet = require('../models/tweet');
const { compareSync } = require('bcrypt-nodejs');


function newTweet(req, res) {
    var tweetNew = new Tweet();
    var params = req.body 
    var userLogin = req.user.sub
    var comando = params.command.slice(10);
    var date = new Date();

    if(comando == "" || params.command.split(' ')[2] == false){
        return res.status(202).send({menssage: 'Debe de escribir un Tweet'})
    }else{
        User.findOne({_id: userLogin}, (err, userLogo) => {
            if(err) return res.status(500).send({menssage: 'Error en el servidor'})
            if(!userLogo){
                return res.status(404).send({menssage: 'Error al idenificar el usuario'})
            }else{
                tweetNew.tweet = comando
                tweetNew.user = userLogin
                tweetNew.date = date
                tweetNew.numLikes = 0
                tweetNew.numReplysTweet = 0
                tweetNew.numRetweets = 0

                Tweet.find({$or: [
                    {tweet: tweetNew.tweet},
                    {user: tweetNew.user}
                ]})
                .exec((err, tweetSave) => {
                    if(err)  return res.status(500).send({menssage: 'Error en el servidor'})
                    if(tweetSave && tweetSave.length >= 1){
                        return res.status(404).send({menssage: 'El tweet ya existe'})
                    }else{
                        tweetNew.save((err, tweetSaved) => {
                            if(err) return res.status(500).send({menssage: 'Error al guardar el usuario'})
                            if(!tweetSaved){
                                return res.status(404).send({menssage: 'Error al crear el usario'})
                            }else{
                                console.log(tweetSaved.user)
                                User.findOneAndUpdate({_id: tweetSaved.user}, {$inc: {numTweets: 1}}, {new: true}, (err, userUpdate) => {
                                    if(err) return res.status(500).send({menssage: 'Error en el servdor'})
                                    if(!userUpdate){
                                        return res.status(404).send({menssage: 'Error al actualizar el usuario ' + err})
                                    }else{
                                        Tweet.findOne({_id: tweetSaved._id}).populate({path: 'user', select: {userName: 1, _id: 0}}).exec((err, tweetCreated)=>{
                                            if(tweetCreated){
                                                console.log(tweetCreated)
                                                return res.status(200).send({tweet: tweetCreated})
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    }
}

function deleteTweet(req, res) {
    var params = req.body
    var userLogin = req.user.sub
    var idTweet = params.command.split(' ')[1];
    var comando = params.command.slice(13);

    if(comando == "" || params.command.split(' ')[1] == false){
        return res.status(202).send({menssage: 'Debe de escribir el id del Tweet que desea eliminar'})
    }else{
        Tweet.findOne({_id: idTweet}, (err, userLog) => {
            console.log(userLog)
            
            if(err) return res.status(500).send({menssage: 'Error en la peticion de tweet'})
            if(!userLog) {
                return res.status(404).send({menssage: 'Error en la busqueda de tweet'})
            }else{
                var tweetEscrito = userLog.tweet
                Tweet.findOneAndDelete({_id: idTweet}, (err, tweetDelete) => {
                    if(err) return res.status(500).send({menssage: 'Error en la peticion'})
                    if(!tweetDelete){
                        return res.status(404).send({menssage: 'No se logró elminar el tweet ' + err })
                    }else{
                        User.findOneAndUpdate({_id: userLogin}, {$inc: {numTweets: -1}}, (err, tweetDeleted) => {
                            if(tweetDeleted){
                                return res.status(202).send({menssage: 'El tweet ' + "\'" + tweetEscrito + "\'" +  ' se eliminó correctamente'})
                            }
                        })
                    }
                })
            }
        })
    }
}

function updateTweet(req, res) {
    var params = req.body
    var userLogin = req.user.sub
    var idTweet = params.command.split(' ')[1]
    var comando = params.command.slice(11)
    var tweetNuevo = params.command.slice(36)

    if(comando == "" || idTweet == false){
        return res.status(500).send({menssage: 'Debe de agregar el id del Tweet a editar'})
    }else{
        Tweet.find({_id: idTweet, tweet: tweetNuevo}, (err, tweetFind)=>{
            if(err) return res.status(500).send({menssage: 'Error en la peticion de usuario'})
            if(!tweetFind){
                return res.status(404).send({menssage: 'Error en la busqueda de usuario'})
            } if(!tweetFind && tweetFind.length >= 1){
                    return res.status(202).send({menssage: 'Este Tweet ya existe'})
            }else{
                Tweet.findOneAndUpdate({_id: idTweet},  {tweet: tweetNuevo}, {new: true}, (err, tweetUpdated)=>{
                    console.log(idTweet)
                    if(err) return res.status(500).send({menssage: 'Error en la peticion de Tweet'})
                    if(!tweetUpdated){
                        return res.status(404).send({menssage: 'Error al actualizar el tweet ' + err})
                    }else{
                        Tweet.findOne({_id: tweetUpdated._id}).populate({path: 'user', select: {userName: 1, _id: 0}}).exec((err, tweetCreated)=>{
                            if(tweetCreated){
                                console.log(tweetCreated)
                                return res.status(200).send({tweet: tweetCreated})
                            }
                        })
                    }
                })
            } 
        })
    }
}

function getTweets(req, res) {
    
    var params = req.body
    var userLogin = req.user.sub
    var name = params.command.split(' ')[1]

    if(name == "" || name == false){
        return res.status(202).send({menssage: 'Debe escribir el nombre de usuario'})
    }else{
        User.findOne({userName: name}, (err, userFind)=>{
            if(err)  return res.status(500).send({menssage: 'Error en la peticion'})
            if(!userFind){
                return res.status(404).send({menssage: 'Error en la busqueda del usuario'})
            }else{
                User.findOne({_id: userLogin}, {password: 0}, {followings: {$elemMatch: {user: {userName: name}}}}, (err, userLog)=>{
                    if(err) return res.status(500).send({menssage: 'Error en la peticion de usuario ' + err})
                    if(!userLog){
                        return res.status(404).send({menssage: 'Error al identificar al usuario logeado'})
                    }
                    if(userLog.userName == name){
                        Tweet.find({user: userLogin}).populate({path: 'user', select: {userName: 1, _id: 0}}).populate({path: 'replysTweet.user', select: {userName: 1, _id: 0}}).populate({path: 'retweets.user', select: {userName: 1, _id: 0}}).exec((err, userLoginTweets) => {
                            if(err)  return res.status(500).send({menssage: 'Error en la peticion ' + err})
                            if(userLoginTweets){
                                return res.status(202).send({Tweets_User: userLoginTweets})
                            }else{
                                return res.status(404).send({menssage: 'Error ' + err})
                            }
                        })
                    }
                    if(userLog.followings == 0){
                        console.log(userLog.userName)
                        return res.status(404).send({menssage: 'Usted no sigue a este usuario+'})
                    }else{
                        Tweet.find({user: userFind._id}).populate({path: 'user', select: {userName: 1, _id: 0}}).populate({path: 'replysTweet.user', select: {userName: 1, _id: 0}}).populate({path: 'retweets.user', select: {userName: 1, _id: 0}}).exec((err, userView)=>{
                            if(err)  return res.status(500).send({menssage: 'Error en la peticion'})
                            if(userView){
                                return res.status(202).send({Tweets_User: userView})
                            }else{
                                return res.status(404).send({menssage: 'Error' + err})
                            }
                        })                              
                    }               
                })
            }
        })
    }
}

function likeTweet(req, res){
    var params = req.body
    var userLogin = req.user.sub
    var idTweet = params.command.split(' ')[1];
    var comando = params.command.slice(13);

    if(comando == "" || params.command.split(' ')[1] == false){
        return res.status(202).send({menssage: 'Debe de escribir el id del Tweet que desea darle su Like'})
    }else{
        User.findOne({_id: userLogin}, (err, userSelected) => {
            if(err) return res.status(500).send({menssage: 'Error en el servidor'})
            if(!userSelected) {
                return res.status(404).send({menssage: 'Error en la busqueda de usuario'})
            }else{
                Tweet.findOne({_id: idTweet}, (err, tweetSelected) => {
                    if(err) return res.status(500).send({menssage: 'Error en la peticion de tweet'})
                    if(!tweetSelected) {
                        return res.status(404).send({menssage: 'Error en la busqueda de tweet'})
                    }else{
                        for (let x = 0; x < tweetSelected.usersLike.length; x++) {
                            if(tweetSelected.usersLike[x].user == userLogin){
                                return res.status(200).send({menssage: 'Este tweet ya tiene su like'})
                            }
                        }
                        if(userSelected._id == tweetSelected.user){
                            console.log("adf")
                            Tweet.findOneAndUpdate({_id: idTweet}, {usersLikes: {user: userLogin}, $inc: {numLikes: 1}}, {new: true}, (err, tweetUpdated) => {
                                if(err) return res.status(500).send({menssage: 'Error en la peticion de tweet'})
                                if(tweetUpdated) {
                                    return res.status(200).send({TweetLikes: tweetUpdated})
                                }
                            })
                        }else{
                            User.findOne({_id: tweetSelected.user}, {followers: {$elemMatch: {user: userLogin}}}, (err, userTweet) => {
                                console.log(userTweet.followers)
                                if(userTweet.followers == 0){
                                    return res.status(200).send({menssage: 'Usted no sigue al dueño de este tweet'}) 
                                }
                                Tweet.findOneAndUpdate({_id: idTweet}, {$push: {usersLike: {user: userLogin}}, $inc: {numLikes: 1}}, {new: true}, (err, tweetUpdated) => {
                                    if(err) return res.status(500).send({menssage: 'Error en la peticion de tweet'})
                                    if(tweetUpdated){
                                        Tweet.findOne({_id: idTweet}).populate({path: 'usersLike.user', select: {userName: 1, _id: 0}}).exec((err, tweetCreated)=>{
                                            if(tweetCreated){
                                                    return res.status(202).send({TweetLikes: tweetCreated})
                                            }
                                        })
                                    }
                                })
                            })
                        }
                    }
                })
            }
        })
    }
}

function dislikeTweet(req, res) {
    var params = req.body
    var userLogin = req.user.sub
    var idTweet = params.command.split(' ')[1];
    var comando = params.command.slice(13);

    if(comando == "" || params.command.split(' ')[1] == false){
        return res.status(202).send({menssage: 'Debe de escribir el id del Tweet que desea quitarle tu Like'})
    }else{
        Tweet.findOne({_id:  idTweet}, (err, tweetSelected) => {
            if(err)  return res.status(500).send({menssage: 'Error en el servidor'})
            if(!tweetSelected){
                return res.status(404).send({menssage: 'Error en la busqueda de tweet'})
            }else{
                User.findOne({_id: userLogin}, {followings: {$elemMatch: {user: tweetSelected.user}}}, (err, userSelected) => {
                    if(userSelected.followings == 0){
                        return res.status(200).send({menssage: 'Usted no sigue al dueño de este tweet'})
                    }else{
                        Tweet.findOne({_id: idTweet}, {usersLike: {$elemMatch: {user: userLogin}}}, (err, tweetFind) => {
                            if(err)  return res.status(500).send({menssage: 'Error en el servidor'})
                            if(!tweetFind){
                                return res.status(404).send({menssage: 'Error en la busqueda de tweet'})
                            }
                            console.log(tweetFind)
                            if(tweetFind.usersLike == 0){
                                return res.status(200).send({menssage: 'Este tweet no tiene su like'})
                            }else{
                                Tweet.findOneAndUpdate({_id: idTweet}, {$pull: {usersLike: {user: userLogin}}, $inc: {numLikes: -1}}, {new: true}, (err, tweetUpdated) => {
                                    if(err)  return res.status(500).send({menssage: 'Error en el servidor'})
                                    if(tweetUpdated){
                                        return res.status(202).send({TweetLikes: tweetUpdated})
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    }
}

function replyTweet(req, res) {
    var params = req.body
    var userLogin = req.user.sub
    var idTweet = params.command.split(' ')[1];
    var comando = params.command.slice(13);
    var comentario = params.command.slice(37)

    if(comando == "" || params.command.split(' ')[1] == false){
        return res.status(202).send({menssage: 'Debe de escribir el id del Tweet que desea comentar'})
    }else{
        User.findOne({_id: userLogin}, (err, userLog) => {
            if(err) return res.status(500).send({menssage: 'Error en el servidor'})
            if(!userLog){
                return res.status(404).send({menssage: 'Error en la busqueda del usuario logeado'})
            }else{
                Tweet.findOne({_id: idTweet}, (err, tweetFind) => {
                    if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                    if(!tweetFind){
                        return res.status(404).send({menssage: 'Error en la busqueda del Tweet'})
                    }else{
                        User.findOne({_id: userLogin}, {followings: {$elemMatch: {user: tweetFind.user}}}, (err, userFollowing) => {
                            if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                            if(userFollowing.followings == 0){
                                return res.status(200).send({menssage: 'Usted no sigue al dueño de este tweet'})
                            }else{
                                Tweet.findOneAndUpdate({_id: idTweet}, {$push: {replysTweet: {comment: comentario, user: userLogin}}, $inc: {numReplysTweet: 1}}, {new: true}, (err, tweetUpdated) => {
                                    if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                                    if(!tweetUpdated){
                                        return res.status(404).send({menssage: 'Error al agregar el comentario al Tweet'})
                                    }else{
                                        Tweet.findOne({_id: tweetUpdated._id}, {_id: 0, usersLike: 0, retweets: 0}).populate({path: 'user', select: {userName: 1, _id: 0}}).populate({path: 'replysTweet.user', select: {userName: 1, _id: 0}}).exec((err, tweetView) => {
                                            if(tweetView){
                                                console.log((comentario))
                                                return res.status(202).send({Replay_Tweet: tweetView})
                                            }
                                        })
                                        
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    }
}

function reTweet(req, res) {
    var retweetNew = new Tweet();
    var date = new Date();
    var params = req.body
    var userLogin = req.user.sub
    var idTweet = params.command.split(' ')[1];
    var comando = params.command.slice(13);
    var comentario = params.command.slice(33)

    
    if(comando == "" || params.command.split(' ')[1] == false){
        return res.status(202).send({menssage: 'Debe de escribir el id del Tweet que desea retweet'})
    }else{
        User.findOne({_id: userLogin}, (err, userLog) => {
            if(err) return res.status(500).send({menssage: 'Error en el servidor'})
            if(!userLog){
                return res.status(404).send({menssage: 'Error en la busqueda del usuario logeado'})
            }else{
                Tweet.findOne({_id: idTweet}, (err, tweetFind) => {
                    if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                    if(!tweetFind){
                        return res.status(404).send({menssage: 'Error en la busqueda del Tweet'})
                    }else{
                        User.findOne({_id: userLogin}, {followings: {$elemMatch: {user: tweetFind.user}}}, (err, userFollowing) => {
                            if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                            if(userFollowing.followings == 0){
                                return res.status(200).send({menssage: 'Usted no sigue al dueño de este tweet'})
                            }else{
                                Tweet.findOneAndUpdate({_id: idTweet}, {$push: {retweets: {user: userLogin}}, $inc: {numRetweets: 1}}, {new: true}, (err, tweetUpdated) => {
                                    if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                                    if(!tweetUpdated){
                                        return res.status(404).send({menssage: 'Error al agregar el comentario al Tweet'})
                                    }else{
                                        retweetNew.commentRetweet = comentario
                                        retweetNew.user = userLogin
                                        retweetNew.date = date
                                        retweetNew.numLikes = 0
                                        retweetNew.numReplysTweet = 0
                                        retweetNew.numRetweets = 0
                                        retweetNew.infoTweetOrigin = tweetUpdated._id
                                        console.log((comentario))

                                        Tweet.find({$or: [
                                            {infoTweetOrigin: retweetNew.infoTweetOrigin},
                                            {user: retweetNew.user}
                                        ]})
                                        .exec((err, tweetSave) => {
                                            if(err)  return res.status(500).send({menssage: 'Error en el servidor'})
                                            if(tweetSave && tweetSave.length >= 1){
                                                Tweet.findOne({infoTweetOrigin: retweetNew.infoTweetOrigin, user: retweetNew.user}, (err, tweetDuplicated) => {
                                                    if(tweetDuplicated){
                                                        Tweet.findOneAndDelete({_id: tweetDuplicated._id}, (err, tweetDuplicatedDeleted) => {
                                                            if(tweetDuplicatedDeleted){
                                                                retweetNew.save((err, retweetSaved) => {
                                                                    if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                                                                    if(!retweetSaved){
                                                                        return res.status(404).send({menssage: 'Error al crear el retweet'})
                                                                    }else{
                                                                        Tweet.findOne({_id: retweetSaved._id}, {usersLike: 0, replysTweet: 0, retweets: 0}).populate({path: 'infoTweetOrigin', select: {tweet: 1, date: 1, user: 1, numLikes: 1, numReplysTweet: 1, numRetweets: 1}}).exec((err, tweetView) => {
                                                                            if(tweetView){
                                                                                return res.status(202).send({ReTweet: tweetView})
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            }else{
                                                retweetNew.save((err, retweetSaved) => {
                                                    if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                                                    if(!retweetSaved){
                                                        return res.status(404).send({menssage: 'Error al crear el retweet'})
                                                    }else{
                                                        Tweet.findOne({_id: retweetSaved._id}, {usersLike: 0, replysTweet: 0, retweets: 0}).populate({path: 'infoTweetOrigin', select: {tweet: 1, date: 1, user: 1, numLikes: 1, numReplysTweet: 1, numRetweets: 1}}).exec((err, tweetView) => {
                                                            if(tweetView){
                                                                return res.status(202).send({ReTweet: tweetView})
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    }
}

module.exports= {
    newTweet,
    deleteTweet,
    updateTweet,
    getTweets,
    likeTweet,
    dislikeTweet,
    replyTweet,
    reTweet
}
