'use estrict'

const mongoose = require("mongoose")
const app = require("./app")

mongoose.Promise = global.Promise

mongoose.connect('mongodb://localhost:27017/DBTwitter-2018551', {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>{
    console.log("Conexion DataBase seccussfull");

    app.set('port', process.env.PORT || 3000)
    app.listen(app.get('port'), ()=>{
        console.log(`The server is runing in the port: ${app.get('port')}`);
    })

}).catch(err =>  console.log(err))