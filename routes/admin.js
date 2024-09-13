var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const { v4: uuidv4 } = require('uuid');
const moment = require('moment')
const mqtt = require('../helpers/mqtt');

const { set, get } = require('../helpers/redis');
//Device Connections
router.get('/deviceConnections', async function(req, res, next) {
    try {
        const deviceConnections = await sql.deviceConnections();
        const list = [];
        
        deviceConnections.forEach(element => {
            let connectionStatus = '';
            let signalStrength = 0;
            let lastUpdatedDate = '';
            let colorCode = '';
            let connectionString = element.connectionStatus+'';
            console.log(connectionString);
            
            if(connectionString !==null || connectionString !=='') {
                let connectionSplit = connectionString.split(',')
                connectionStatus = connectionSplit[0];
                signalStrength = connectionSplit[1];
                lastUpdatedDate = connectionSplit[2]
            } 
            if (connectionStatus =='null') {
                connectionStatus = "Not connected yet";
                lastUpdatedDate = '';
                signalStrength = 0
            }
            if(signalStrength == 0) {
                colorCode= 'red'
            } else if(signalStrength >0 && signalStrength <=85) {
                colorCode = 'green'
            } else if(signalStrength >85) {
                colorCode = 'orange'
            } 
            let redObj = {
                deviceID: element.deviceid,
                deviceName: element.deviceName,
                imeiNumber: element.ssid,
                connectionStatus: connectionStatus,
                signalStrength: `-${signalStrength} dBM`,
                colorCode: colorCode,
                lastUpdatedDate: lastUpdatedDate,
                assignedTo: element.assignedTo,
                assginedDate: (element.assginedDate!=='' || element.assginedDate !=null)?moment(element.assginedDate).format('DD-MMM-YYYY'):'',
                currentLocation: element.currentLocation
            }
            list.push(redObj);
        });
        res.status(200).send({
            status: true,
            list: list
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
router.get('/moreDetails/:deviceID', async function(req, res, next) {
    try {
        const installedLocations = await sql.installedLocations(req.params.deviceID);
        res.status(200).send({
            status: true,
            list: installedLocations
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
  router.get('/farmersList/', async function(req, res, next) {
    try {
        const list = await sql.listOfFarmers(req.params.deviceID);
        res.status(200).send({
            status: true,
            list: list
        });      
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
  router.get('/farmersList/', async function(req, res, next) {
    try {
        const list = await sql.listOfFarmers();
        res.status(200).send({
            status: true,
            list: list
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
  router.get('/deviceAssignments/:type/:userID', async function(req, res, next) {
    try {
        const list = await sql.deviceAssignments(req.params.type, req.params.userID);
        res.status(200).send({
            status: true,
            list: list
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
  router.post('/otaupdate', async function(req, res, next) {
    try {
        const deviceID = req.body.deviceID;
        const update = await mqtt.otaUpdate(deviceID);
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
  router.get('/deviceStatus/:type', async function(req, res, next) {
    try {
        const deviceConnections = await sql.deviceStatus(req.params.type);
        const list = [];
        
        deviceConnections.forEach(element => {
            let connectionStatus = '';
            let signalStrength = 0;
            let lastUpdatedDate = '';
            let colorCode = '';
            let connectionString = element.connectionStatus+'';
            console.log(connectionString);
            
            if(connectionString !==null || connectionString !=='') {
                let connectionSplit = connectionString.split(',')
                connectionStatus = connectionSplit[0];
                signalStrength = connectionSplit[1];
                lastUpdatedDate = connectionSplit[2]
            } 
            if (connectionStatus =='null') {
                connectionStatus = "Not connected yet";
                lastUpdatedDate = '';
                signalStrength = 0
            }
            if(signalStrength == 0) {
                colorCode= 'red'
            } else if(signalStrength >0 && signalStrength <=85) {
                colorCode = 'green'
            } else if(signalStrength >85) {
                colorCode = 'orange'
            } 
            let redObj = {
                deviceName: element.deviceName,
                imeiNumber: element.deviceID,
                connectionStatus: connectionStatus,
                signalStrength: `-${signalStrength} dBM`,
                colorCode: colorCode,
                lastUpdatedDate: lastUpdatedDate,
                farmName: element.farmName,
                farmID: element.farmID,
                batchID: element.batchID,
                // assignedTo: element.assignedTo,
                // assginedDate: (element.assginedDate!=='' || element.assginedDate !=null)?moment(element.assginedDate).format('DD-MMM-YYYY'):'',
                currentLocation: element.installedLocation
            }
            list.push(redObj);
        });
        res.status(200).send({
            status: true,
            list: list
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
  router.post('/abnormalThresholds/', async function(req, res, next) {
    try {
        const getThresholdsCount = await sql.abnormalThresholdsCount();
        const today = misc.today();
        let userID = 'Admin';
        let message = '';
        if(getThresholdsCount == 0) {
            //Insert
            const procValues = [
                userID,
                req.body.soilMoistureMin,
                req.body.soilMoistureMax,
                req.body.soilTempMin,
                req.body.soilTempMax,
                req.body.soilNitrogenMin,
                req.body.soilNitrogenMax,
                req.body.soilPhosporousMin,
                req.body.soilPhosporousMax,
                req.body.soilPotassiumMin,
                req.body.soilPotassiumMax,
                req.body.soilPHMin,
                req.body.soilPHMax,
                req.body.soilECMin,
                req.body.soilECMax,
                req.body.airTemperatureMin,
                req.body.airTemperatureMax,
                req.body.windSpeedMin,
                req.body.windSpeedMax,
                req.body.batteryVoltageMin,
                req.body.batteryVoltageMax,
                req.body.humidityMin,
                req.body.humidityMax,
                req.body.co2Min,
                req.body.co2Max,
                userID,
                today,
                userID,
                today
            ];
            console.log(procValues.length)
            await sql.callProc('abnormalThresholds_proc', await sql.genArgs(procValues.length), procValues);
            message = 'Succesfuly Inserted';
        } else {
            //Update
            const updateValues = [
                userID,
                req.body.soilMoistureMin,
                req.body.soilMoistureMax,
                req.body.soilTempMin,
                req.body.soilTempMax,
                req.body.soilNitrogenMin,
                req.body.soilNitrogenMax,
                req.body.soilPhosporousMin,
                req.body.soilPhosporousMax,
                req.body.soilPotassiumMin,
                req.body.soilPotassiumMax,
                req.body.soilPHMin,
                req.body.soilPHMax,
                req.body.soilECMin,
                req.body.soilECMax,
                req.body.airTemperatureMin,
                req.body.airTemperatureMax,
                req.body.windSpeedMin,
                req.body.windSpeedMax,
                req.body.batteryVoltageMin,
                req.body.batteryVoltageMax,
                req.body.humidityMin,
                req.body.humidityMax,
                req.body.co2Min,
                req.body.co2Max,
                userID,
                today
            ];
             message = 'Succesfuly Updated Thresholds';
            const update = await sql.updatAbnormalThresholds(updateValues);
        }
        const thresholds = await sql.abnormalThresholds();
        set('thresholds', thresholds, (err, reply) => {
            if (err) {
              console.error('Error setting value:', err);
            } else {
              console.log('SET:', reply);
            //   // Example: Get the value
            //   get('key', (err, reply) => {
            //     if (err) {
            //       console.error('Error getting value:', err);
            //     } else {
            //       console.log('GET:', reply);
            //     }
          
            //   });
            }
          });
        res.status(200).send({
            status: true,
            message
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