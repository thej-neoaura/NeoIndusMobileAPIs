var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const moment = require('moment-timezone');

router.get('/batchReadings/:batchID', async function(req, res, next) {
    try {
        
        const result = [];
        const batchDetails = await sql.getBatchDetailsByID(req.params.batchID);
        console.log(batchDetails);
        for (let batch of batchDetails) {
            const readings = await sql.getBatchReadings(batch.ssid)
            console.log('readings', readings)
            if(readings.length > 0) {
                const reading = readings[0];
                let obj = {
                    deviceName: reading.deviceName,
                    deviceID: batch.ssid,
                    batchID: batch.batchID,
                    farmName: batch.farmName,
                    deviceInstalledLoc: batch.installedLocation,
                    
                    co2: reading.co2,
                    nh3: reading.ammonia,
                    hi: reading.heatIndex.toFixed(2),
                    temp: reading.temp.toFixed(2),
                    humidity: reading.humidity.toFixed(2),
                    lastUpdatedat: moment(reading.createdDate).format('DD-MMM-YYYY hh:mm A')
                }
                result.push(obj);
            }
        }
       
       if(result.length ===0) {
            res.status(200).send({
                status: false,
                message: 'No Device Readings found for this Batch'
            });
            return;   
        }
       
        res.status(200).send({
            status: true,
            data: result
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
router.get('/latestreadings/', async function(req, res, next) {
    try {
        
        const result = [];
        
        const batchDetails = await sql.getBatchDetails(req.user.userID);
        console.log(batchDetails)
        for (let batch of batchDetails) {
            console.log(batch)
            const readings = await sql.getlatestReading(batch.ssid, req.user.userID);
            console.log(readings)
            if(readings.length > 0) {
                const reading = readings[0];
                let obj = {
                    deviceName: reading.deviceName,
                    deviceID: batch.ssid,
                    batchID: batch.batchID,
                    farmName: batch.farmName,
                    deviceInstalledLoc: batch.installedLocation,
                    co2: reading.co2,
                    nh3: reading.ammonia,
                    hi: reading.heatIndex.toFixed(2),
                    temp: reading.temp.toFixed(2),
                    humidity: reading.humidity.toFixed(2),
                    lastUpdatedat: moment(reading.createdDate).format('DD-MMM-YYYY hh:mm A')
                }
                result.push(obj);
            }
        }
        res.status(200).send({
            status: true,
            data: result
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
router.get('/userThresholds/', async function(req, res, next) {
    try {
        let userThresholds = await sql.userThresholds(req.user.userID);
        if(userThresholds.length === 0) {
            userThresholds = await sql.defaultThresholds();
        }
        console.log('userThresholds ', userThresholds);
        res.status(200).send({
            status: true,
            data: userThresholds
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