'use strict'

var express = require('express')
var UserController = require('../controllers/userController')
var md_auth = require('../middleware/autentificated');


var api = express.Router();

api.post('/commands', md_auth.ensureAuth, UserController.commands)


module.exports = api;