var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

router.get('/:farmID', async function(req, res, next) {
    try {
        
        const allBatches = await sql.allBatches(req.params.farmID);
        if(allBatches.length === 0) {
            res.status(200).send({
                status: false,
                message: 'No batches Found for the selected farm'
            });
            return;
        }
        const transformed = [];
        const batchID = [];
        allBatches.forEach(element => {
           // console.log(element)
            
            const status = element.closedDate===null || element.closedDate === ''? 'Running': 'Closed'
            let obj= {
                title: element.batchName,
                batchID: element.batchID,
                body: {
                    startDate: moment(element.startDate).format('DD-MMM-YYYY'),
                    endDate: moment(element.endDate).format('DD-MMM-YYYY'),
                    closedDate: element.closedDate,
                    batchID: element.batchID,
                    status: status,
                    devices: [{
                        deviceName: element.deviceID,
                        location: element.installedLocation
                    }]
                    
                }
            }
            console.log(batchID.includes(element.batchID));
            if(batchID.includes(element.batchID)) {
                let filteredarr = transformed.filter((val)=>{
                    return val.batchID === element.batchID; 
                }) 
                
                filteredarr[0].body.devices = [...filteredarr[0].body.devices, ...obj.body.devices]
            } else {
                batchID.push(element.batchID);
                transformed.push(obj)
            }
            
        });
        console.log(transformed[0].body.devices)
        //console.log(result)
        res.status(200).send({
            status: true,
            data: transformed
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