var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')

router.post('/add', async function(req, res, next) {
    try {
        const createdBy = req.user.userID;
        const deviceCheck  = await sql.deviceCheck(req.body.ssid);
        
        if(deviceCheck > 0) {
            res.status(200).send({
                status: false,
                message: "Device is already assigned, please contact administrator"
            }) 
            return;
        }
        let assignedto = '';
        if(req.user.userType === 'Admin') {
            assignedto = req.body.farmerID;
        } else if (req.user.userType === 'Farmer') {
            assignedto = createdBy;
        }
        const addDevice_proc_values = [
            req.body.deviceName,
            req.body.firmWareVersion,
            req.body.deviceSSID,
            assignedto,
            'ACTIVE',
            createdBy,
            misc.today(),
            createdBy,
            misc.today()
        ];
        await sql.callProc('deviceMaster_proc', await sql.genArgs(9), addDevice_proc_values);
        res.status(200).send({
            status: true,
            message: "Successfully added device to your account"
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
  router.post('/edit', async function(req, res, next) {
    try {
        const createdBy = req.user.userID;
        const deviceCheck  = await sql.deviceCheck(req.body.ssid);
        
        if(deviceCheck > 0) {
            res.status(200).send({
                status: false,
                message: "Device is already assigned, please contact administrator"
            }) 
            return;
        }
        // Check if the device is already installed
        const deviceAllocation = await sql.deviceAllocation(req.body.deviceID);
        // if(deviceAllocation !== null) {
        //     res.status(200).send({
        //         status: false,
        //         message: "Device is already installed in the farm: "+deviceAllocation+" and can't be edited"
        //     }) 
        //     return;
        // }
        // Update
        const update = await sql.updateDevice(
            req.user.userID,
            misc.today(),
            req.body.deviceName,
            req.body.firmWareVersion,
            req.body.deviceSSID,
            req.body.deviceID
        )
        if(!update) {
            res.status(200).send({
                status: true,
                message: "Error in updating device. Contact Administrator"
            })  
        }
        res.status(200).send({
            status: true,
            message: "Successfully Updated Device"
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