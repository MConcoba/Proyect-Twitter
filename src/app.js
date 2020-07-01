'use strict'


const express = require("express")
const app = express()
const bodyparser = require("body-parser")


var route = require(".//routers/route")


app.use(bodyparser.urlencoded({extended: false}))
app.use(bodyparser.json())



app.use((req,res,next)=>{
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Authoruzation, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method')
    res.header('Access-Control-Allow-Methods', 'SET, POST, OPTIONS, PUT, DELETE')
    res.header('Allow', 'SET, POST, OPTIONS, PUT, DELETE')

    next();
})


app.use('/api', route)


module.exports = app;

