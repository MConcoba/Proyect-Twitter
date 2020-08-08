'use strict'

var User = require('../models/user');
var Tweet = require('../models/tweet')
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var tweetContoller = require('./tweetController');

function newUser(req, res) {
    var user = new User();
    var params = req.body

        if(params.command){
            user.userName = params.command.split(' ')[1]
            user.password = params.command.split(' ')[2]
            user.numTweets = 0
            user.numFollowers = 0
            user.numFollowing = 0
    
            User.find({$or: [
                {userName: user.userName}
            ]})
            .exec((err, userNew)=>{
                if(err) return res.status(500).send({menssage: 'Error en la red'})
                if(userNew && userNew.length >= 1){
                    return res.status(500).send({menssage: 'El usuario ya existe'})
                }else{
                    bcrypt.hash(params.command.split(' ')[2], null, null, (err, hash)=>{
                        user.password = hash;
    
                        user.save((err, userSaved)=>{
                            if(err) return res.status(500).send({menssage: 'Error al guardar el usuario'})
                            if(!userSaved){
                                return res.status(404).send({menssage: 'Error al crear el usario'})
                            }else{
                                console.log(userSaved._id)
                                User.findOne({_id: userSaved._id}, {_id: 0, password: 0, tweets: 0, followers: 0, followings: 0}, (err, userCreated)=>{
                                    if(userCreated){
                                        return res.status(202).send({user: userCreated})
                                    }
                                })
                            }
                        })
                    })
                }
            })
        }else{
            res.status(200).send({menssage: 'La palabra clave es command'})
        }
}

function login(req, res) {

    var params = req.body
    var nameUser = params.command.split(' ')[1]
    var contraseña = params.command.split(' ')[2]
    var getToken = params.command.split(' ')[3]
    
    User.findOne({userName: nameUser},{tweets: 0, followers: 0, followings: 0, numTweets: 0, numFollowers: 0, numFollowing: 0},(err, usuario)=>{
        if(err) return res.status(500).send({menssage: 'Error en la red'})
        if(usuario){
            bcrypt.compare(contraseña, usuario.password, (err, check)=>{
              if(check){
                  if(getToken == 'true'){
                      return res.status(200).send({
                          userLog: usuario, 
                          token: jwt.createToken(usuario)
                      })
                  }else{
                      usuario.password = undefined
                      return res.status(200).send({user: usuario, token: jwt.tokenFalse(usuario)})
                  }
              }else{
                  return res.status(404).send({menssage: 'El usuario no se logró identificar'})
              }  
            })
        }else{
            return res.status(404).send({menssage: 'El usuario no se logró logear'})
        }
    }) 
}

function follow(req, res) {
    var params = req.body
    var userLogin = req.user.sub
    var follower = params.command.split(' ')[1]

    User.findOne({userName: follower}, (err, userFind)=>{
        if(err) return res.status(500).send({menssage: 'Error en la peticion ' + err})
        if(!userFind){
            return res.status(202).send({menssage: 'Error'})
        }else{
           User.findOne({_id: userLogin}, (err, userPrincial)=>{
               if(userPrincial.userName == follower){
                   return res.status(400).send({menssage: 'Usted no se puede seguir a sí mísmo'})
               }else{
                    for (let x = 0; x < userFind.followers.length; x++) {
                        if(userFind.followers[x].user == userLogin){
                            return res.status(202).send({menssage: 'Usted ya sigue a este usuario'})
                        }
                    }
                    User.findOneAndUpdate({_id: userFind._id}, {$push: {followers: {user: userLogin}}, $inc: {numFollowers: 1}},  {new: true}, (err, addFollower)=>{
                        if(err) return res.status(500).send({menssage: 'Error en la peticion ' + err})
                        if(!addFollower){
                            return res.status(202).send({menssage: 'Error al seguir a este usuario ' + err})
                        }else{
                            User.findOneAndUpdate({_id: userLogin},  {$push: {followings: {user: addFollower._id}}, $inc: {numFollowing: 1}}, (err, addFollowing)=>{
                                if(err) return res.status(500).send({menssage: 'Error en la peticion'})
                                if(!addFollowing){
                                    return res.status(202).send({menssage: 'Error al seguir a este usuario ' + err})
                                }else{
                                    User.findOne({_id: userLogin}, {tweets: 0, followers: 0,  password: 0}, ).populate({path: 'followings.user', select: {userName: 1, _id: 0}}).exec((err, usuario)=>{
                                        if(usuario){
                                            return res.status(200).send({User_Following: usuario})
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

function unfollow(req, res) {
    var params = req.body
    var userLogin = req.user.sub
    var unfollower = params.command.split(' ')[1]

    
    User.findOne({userName: unfollower, }, (err, userFind)=>{
        if(err) return res.status(202).send({menssage: 'Error en la peticion'})
        if(!userFind){
            return res.status(404).send({menssage: 'Error al encontar el usario'})
        }else{
            User.find({_id: userLogin, followings: {user: userFind._id}}, (err, userExisted) => {
                if(!userExisted){
                    console.log(userExisted)
                    return res.status(404).send({menssage: 'Usted no sigue a este usuario'})
                }else{
                    console.log(userFind.userName + "asdf")
                    for (let x = 0; x < userFind.followers.length; x++) {
                        if(userFind.followers[x].user == userLogin){
                            var userUnfollower = userFind.followers[x].user
    
                            User.findOneAndUpdate({_id: userFind._id}, {$pull: {followers: {user: userLogin}}, $inc: {numFollowers: -1}}, {new: true}, (err, userUnfollowed)=>{
                                if(err) return res.status(202).send({menssage: 'Error en la peticion'})
                                if(!userUnfollowed){
                                    return res.status(202).send({menssage: 'Error al encontar el usario'})
                                }else{
                                    User.findOneAndUpdate({_id: userLogin}, {$pull: {followings: {user: userFind._id}}, $inc: {numFollowing: -1}}, {new: true}, (err, unfollowerUser)=>{
                                        if(err) return res.status(202).send({menssage: 'Error en la peticion'})
                                        if(!userUnfollowed){
                                            return res.status(202).send({menssage: 'Error al encontar el usario'})
                                        }else{
    
                                            User.findOne({_id: userLogin}, {tweets: 0, followers: 0,  password: 0}, ).populate({path: 'followings.user', select: {userName: 1, _id: 0}}).exec(
                                                (err, usuario)=>{
                                            
                                                if(usuario){
                                                    return res.status(200).send({User_Followings: usuario})
                                                }
                                            })
                                           
                                        }
                                    })
                                }
                            })
                        }
                    
                }
                }
            })

            
        }
    })
    
}

function profile(req, res) {
    var params = req.body
    var userLogin = req.user.sub
    var name = params.command.split(' ')[1]

    User.findOne({userName: name}, {password: 0}).populate({path: 'followers.user', select:{userName: 1, _id: 0}}).populate({path: 'following.user', select: {userName: 1, _id: 0}}).exec((err, userFind)=>{
        if(err) return res.status(500).send({menssage: 'Error en la peticion'})
        if(!userFind){
            return res.status(404).send({menssage: 'Error al encontar el usario'})
        }else{
            Tweet.find({user: userLogin}, (err, tweetsUser) => {
                if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                if(tweetsUser){
                    User.findOne({_id: userLogin}, (err, userLog)=>{
                        if(err) return res.status(500).send({menssage: 'Error en la petición de usuario'})
                        if(!userLog){
                            return res.status(404).send({menssage: 'Error al identificar el usuario'})
                        }else{
                            if(userLog.userName == name){
                                var todo = userFind + tweetsUser
                                return res.status(202).send({User_Selected: {userFind, tweetsUser}})
                            }else{
                                for (let x = 0; x < userLog.followings.length; x++) {
                                    if(userLog.followings[x].user == userFind.id){
                                        return res.status(202).send({User_Selected: userFind})
                                    }
                                }
                                return res.status(202).send({menssage: 'Usted no sigue a este usuario'})
                            }
                        }
                    })
                }
            })
            
            
        }
    })
}

function deleteUser(req, res) {
    var params = req.body;
    var userLogin = req.user.sub;
    var name = params.command.split(' ')[1]

    User.findOne({_id: userLogin}, (err, userLog) =>{
        if(err) return res.status(500).send({menssage: 'Error en la peticion'})
        if(!userLog){
            return res.status(404).send({menssage: 'Error al eliminar el usuario'})
        }else{
            var nombreUser = userLog.userName;
            User.updateMany({"followers.user": userLogin},  {$pull: {followers: {user: userLogin}}, $inc: {numFollowers: -1}}, {new: true}, (err, userUpdate)=>{
                if(err) return res.status(500).send({menssage: 'Error en la peticion ' + err})
                if(!userUpdate){
                    return res.status(404).send({menssage: 'Error al eliminar el usuario'})
                }else{
                    User.updateMany({"followings.user": userLogin}, {$pull: {followings: {user: userLogin}}, $inc: {numFollowing: -1}}, {new: true}, (err, userUpdate)=>{
                        if(err) return res.status(500).send({menssage: 'Error en la peticion'})
                        if(!userUpdate){
                            return res.status(404).send({menssage: 'Error al eliminar el usuario'})
                        }else{
                            Tweet.deleteMany({user: userLogin}, (err, tweetDeleted) => {
                                if(err) return res.status(500).send({menssage: 'Error en el servidor'})
                                if(tweetDeleted || !tweetDeleted){
                                    User.findOneAndDelete({_id: userLogin}, (err, userDeleted) =>{
                                        if(err) return res.status(500).send({menssage: 'Error en la peticion'})
                                        if(!userDeleted){
                                            return res.status(404).send({menssage: 'Error al eliminar el usuario'})
                                        }else{
                                            return res.status(202).send({menssage: 'El usuario ' + nombreUser + ' eliminó correcatamente'})
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

function commands(req, res) {
    var params = req.body
    var comando = params.command.split(' ')[0];
        
    if(String(comando.toLowerCase()) == 'register'.toLowerCase()){

        newUser(req, res)
        
    } else if(String(comando.toLowerCase()) == "login".toLowerCase()){

        login(req, res)
        
    } else if(String(comando.toLowerCase()) == 'add_tweet'.toLowerCase()){

        tweetContoller.newTweet(req, res)

    } else if(String(comando.toLowerCase()) == 'delete_tweet'.toLowerCase()){

        tweetContoller.deleteTweet(req, res)

    } else if(String(comando.toLowerCase()) == 'edit_tweet'.toLowerCase()){
        
        tweetContoller.updateTweet(req, res)

    } else if(String(comando.toLowerCase()) == 'view_tweets'.toLowerCase()){
       
        tweetContoller.getTweets(req, res)

    } else if(String(comando.toLowerCase()) == 'follow'.toLowerCase()){

        follow(req, res)
    
    } else if(String(comando.toLowerCase()) == 'unfollow'.toLowerCase()){

       unfollow(req, res)
    
    } else if(String(comando.toLowerCase()) == 'profile'.toLowerCase()){

        profile(req, res)
    
    } else if(String(comando.toLowerCase()) == 'delete_user'.toLowerCase()){

        deleteUser(req, res)
    
    } else if(String(comando.toLowerCase()) == 'like_tweet'.toLowerCase()){

        tweetContoller.likeTweet(req, res)

    } else if(String(comando.toLowerCase()) == 'dislike_tweet'.toLowerCase()){

        tweetContoller.dislikeTweet(req, res)
    
    } else if(String(comando.toLowerCase()) == 'reply_tweet'.toLowerCase()){

        tweetContoller.replyTweet(req, res)
    
    }else if(String(comando.toLowerCase()) == 'retweet'.toLowerCase()){

        tweetContoller.reTweet(req, res)
        
    } else{

        res.status(200).send({menssage: `El comando ` +  "\'" + comando + "\'" +` no existe `})

    }
    
}

module.exports = {
    commands
}
