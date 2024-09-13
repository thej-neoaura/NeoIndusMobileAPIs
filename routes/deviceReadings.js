var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const moment = require('moment-timezone');
require('dotenv').config();
router.get('/readings/:startDateTime/:endDateTime', async function(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            res.status(401).send('Unauthorized');
            return;
        }
        const base64Credentials = authHeader.slice('Basic '.length);
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        const validUsername = process.env.BASIC_AUTH_USERNAME;
        const validPassword = process.env.BASIC_AUTH_KEY;

        console.log(username, '', validUsername);
        console.log(password, '', validPassword);

        if (username === validUsername && password === validPassword) {
            const startDateTime  = moment(req.params.startDateTime).format('YYYY-MM-DD HH:mm');
            const endDateTime  = moment(req.params.endDateTime).format('YYYY-MM-DD HH:mm');
            const data = await sql.readings(startDateTime, endDateTime);
            res.status(200).send({
                status: true,
                data: data
            });
        } else {
            res.status(401).send('Unauthorized Access');
            return;
        }
        
    } catch (error) {
        console.log(error);
        let msg= error;
        if(typeof msg === 'object') {
            msg = error.message; 
          }
        res.status(500).send({
            status: false,
            message: msg
        })
    }
  });

module.exports = router;