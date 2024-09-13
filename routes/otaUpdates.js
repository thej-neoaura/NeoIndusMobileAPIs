var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc');
const mqtt = require('../helpers/mqtt');

router.post('/update', async function(req, res, next) {
    try {
        const deviceID = req.body.deviceID;
        const update = await mqtt.otaUpdate();
        if(!update.status) {
            res.status(200).send({
                status: update.status,
                message: update.message
            });
            return;
        }
        // Update the details of the OTA against the device ID
        res.status(200).send({
            status: true,
            message: "Successfully Updated"
        })    
      
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