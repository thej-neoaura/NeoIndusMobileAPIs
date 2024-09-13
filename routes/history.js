var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const moment = require('moment-timezone');
router.get('/:batchID/:deviceID', async function(req, res, next) {
    try {
        const userID = req.user.userID;
        const batchID = req.params.batchID;
        const deviceID = req.params.deviceID;
        // Get UserThresholds
        let userThresholds = await sql.userThresholds(userID);
        if(userThresholds.length === 0) {
            userThresholds = await sql.defaultThresholds();
        }
        const thresholds = userThresholds[0];
        // Get Batch details from batchMaster
        const batchDetails = await sql.batchDetailsHistory(deviceID);

        //Get Max date from readings
        
        let batchStartDate = moment(batchDetails[0].startDate).format('YYYY-MM-DD');
        
        let maxDate = moment(await sql.maxDate(batchID, deviceID)).format('YYYY-MM-DD');
        if(maxDate === null) {
            res.status(200).send({
                status: false,
                message: 'No Data Found'
            });
            return; 
        }
        // Get Device Readings
        const result = [];
        let readings = await sql.avgReadings(deviceID, batchID, batchStartDate, maxDate);
        readings.forEach(reading => {
            const createdDate = moment(reading.createdDate).format('YYYY-MM-DD');
            let obj = {}
            obj[createdDate] = {};
            obj[createdDate].selected = true
            obj[createdDate].customStyles = {
                container: {
                    backgroundColor: '#7ACE52',
                    width: '100%',
                    borderRadius: 0
                }
            }
            let color = '#7ACE52';
            
            if(reading.co2 > parseFloat(thresholds.co2Max) 
               || reading.co2 < parseFloat(thresholds.co2Min)
               || reading.temp < parseFloat(thresholds.tempMin)
               || reading.temp > parseFloat(thresholds.tempMax)
               || reading.ammonia > parseFloat(thresholds.nh3MaX)
               || reading.ammonia < parseFloat(thresholds.nh3Min)
               || reading.humidity < parseFloat(thresholds.humidityMin) 
               || reading.humidity > parseFloat(thresholds.humidityMax) 
                                ){
                color = '#EE7403';
            } else if(reading.co2 > parseFloat(thresholds.co2Max)-300 
                    || reading.temp > parseFloat(thresholds.tempMax)-3
                    || reading.ammonia > parseFloat(thresholds.nh3MaX)-3
                    || reading.humidity > parseFloat(thresholds.humidityMax)-5
                                ){
                color = '#F0C777';
            }
            obj[createdDate].customStyles.container.backgroundColor = color;
            result.push(obj)
        });
        
        
        res.status(200).send({
            status: true,
            data: Object.assign({}, ...result),
            dates: {
                startDate: batchStartDate, endDate: maxDate, 
                currentDate: moment().format('YYYY-MM-DD')
            }
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
router.get('/chart/:batchID/:deviceID/:flag/:date', async function(req, res, next) {
    try {
        const userID = req.user.userID;
        const batchID = req.params.batchID;
        const deviceID = req.params.deviceID;
        const flag = req.params.flag;
        const date = req.params.date;
        let readings = await sql.paramReadings(date, batchID, deviceID, flag)
        const params = readings.map((val)=>val.param);
        const time = readings.map((val)=>moment(val.createdDate).format('HH:mm'));
        console.log(time)
        let userThresholds = await sql.userThresholds(userID);
        if(userThresholds.length === 0) {
            userThresholds = await sql.defaultThresholds();
        }
        let attributes = {
            xName: "Time",
            yName: "",
            yMax: "",
            minVal: "",
            maxVal: "",
            interval: ""
        }
        if(flag === 'temp') {
            attributes.yMax = 50;
            attributes.interval = 5;
            attributes.yName = 'Temeperature';
            attributes.minVal = userThresholds[0].tempMin
            attributes.maxVal = userThresholds[0].tempMax
        } else if(flag==='co2') {
            attributes.yMax = 3500;
            attributes.interval = 500;
            attributes.yName = '';
            attributes.minVal = userThresholds[0].co2Min
            attributes.maxVal = userThresholds[0].co2Max
        }
        else if(flag==='nh3') {
            attributes.yMax = 40;
            attributes.interval = 5;
            attributes.yName = 'Ammonia Levels';
            attributes.minVal = userThresholds[0].nh3Min
            attributes.maxVal = userThresholds[0].nh3Max
        }
        else if(flag==='humidity') {
            attributes.yMax = 110;
            attributes.interval = 10;
            attributes.yName = 'Humidity';
            attributes.minVal = userThresholds[0].humidityMin
            attributes.maxVal = userThresholds[0].humidityMax
        }
        res.status(200).send({
            status: true,
            data: {
                params, time
            },
            attributes
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