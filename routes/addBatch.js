var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const { v4: uuidv4 } = require('uuid');

router.post('/', async function(req, res, next) {
    try {
        
        const createdBy = req.user.userID;
        const batchStatus = await sql.batchStatusCheck(req.body.farmName);
        
        if(batchStatus > 0) {
            res.status(200).send({
                status: false,
                message: "Farm already has a running batch"
            }) 
            return;
        }
       
        const devices = req.body.devices;
        if(devices.length ===0 ) {
            res.status(200).send({
                status: false,
                message: "Please Add Devices and Installation Locations"
            }) 
            return;
        }
        const batchID = uuidv4();
        console.log(batchID)
        for(let device of devices) {
            const proc_values = [
                batchID,
                req.body.batchName,
                req.body.farmName,
                device.deviceID,
                device.location,
                req.body.startDate,
                req.body.endDate,
                null,
                'ACTIVE',
                createdBy,
                misc.today(),
                createdBy,
                misc.today()
             ];
            await sql.callProc('batchMaster_proc', await sql.genArgs(13), proc_values);
        }
        
        res.status(200).send({
            status: true,
            message: "Successfully added batch: "+req.body.batchName
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