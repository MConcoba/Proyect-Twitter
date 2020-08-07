'use strict'

var jwt = require('jwt-simple')
var momonet = require('moment')
var secret = 'encryt_password'


exports.ensureAuth = function(req, res, next){

    var params = req.body
    

    if(params.command){
        
        var comando = params.command.split(' ')[0];

        if(String(comando.toLowerCase()) == "login".toLowerCase()  || String(comando.toLowerCase())  == "register".toLowerCase()){
            next();
        }
        else if(!req.headers.authorization){
           
            return res.status(403).send({menssage: 'La peticion no tiene Autentificacion'})
    
        }else if(String(comando.toLowerCase()) == "add_tweet".toLowerCase() || String(comando.toLowerCase()) == "delete_tweet".toLowerCase() || 
                 String(comando.toLowerCase()) == "edit_tweet".toLowerCase() || String(comando.toLowerCase()) == "view_tweets".toLowerCase() || 
                 String(comando.toLowerCase()) == "follow".toLowerCase() || String(comando.toLowerCase()) == "unfollow".toLowerCase() || 
                 String(comando.toLowerCase()) == "profile".toLowerCase() || String(comando.toLowerCase()) == "delete_user".toLowerCase() || 
                 String(comando.toLowerCase()) == "like_tweet".toLowerCase() || String(comando.toLowerCase()) == "dislike_tweet".toLowerCase() ){
    
            var token = req.headers.authorization.replace(/['"']+/g, '')
    
            try {
                var playload = jwt.decode(token, secret)
                if(playload.exp <= momonet().unix()){
                    return res.status(401).send({menssage: 'El token ha expirado'})
                }
            } catch (ex) {
                return res.status(404).send({menssage: 'El token no es valido'})
            }
        
            req.user = playload
            next();
        }else{
           return res.status(200).send({menssage: `El comando ` +  "\'" + comando + "\'" +` no existes `})
        }
    }else{
        res.status(200).send({menssage: 'El nombre del atributo debe ser: ' + "\'command" + "\'"})
    }



    
}