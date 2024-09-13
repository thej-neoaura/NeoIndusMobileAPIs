var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc');
const moment = require('moment-timezone');

router.get('/:batchID/:deviceID/:date/:farmerID', async function (req, res, next) {
    try {
        const batchID = req.params.batchID;
        const deviceID = req.params.deviceID;
        const date = req.params.date;
        const farmerID = req.params.farmerID;
        
        const readings = await sql.batchReadings(batchID, deviceID, date);
        const readingsSummary = await sql.batchReadingsSummary(batchID, deviceID, date);
        if(readingsSummary.length ===0) {
            res.status(200).send({
                errStatus: true,
                message: 'No devices and reading found for this batch'
            })
            return;
        }
        const userThresholds = await sql.getUserThresholds(farmerID);
        const currentDataArray = readings.sort((a,b)=> b.createdDate > a.createdDate);
        if(currentDataArray.length === 0) {
            res.status(200).send({
                errStatus: true,
                message: 'No readings found for the day'
            })
            return;
        }
        const currentTemp = currentDataArray[0].temp;
        const currentAmmonia = currentDataArray[0].ammonia;
        const currentCO2 = currentDataArray[0].co2;
        const currentHumidity = currentDataArray[0].humidity;
        
        const tempReadings = readings.map((a)=> a.temp.toFixed(2));
        const ammoniaReadings = readings.map((a)=> a.ammonia.toFixed(2));
        const coReadings = readings.map((a)=> a.ammonia.toFixed(2));
        const humidityReadings = readings.map((a)=> a.ammonia.toFixed(2));
        const timings = readings.map((a)=> moment(a.createdDate).format('HH:mm'));
       
        
        let resultObj = {
            timings: timings,
            userThresholds,
            temp: {
                max: readingsSummary[0].tempMax,
                min: readingsSummary[0].tempMin,
                current: currentTemp.toFixed(2),
                tempReadings
            },
            ammonia: {
                max: readingsSummary[0].ammoniaMax,
                min: readingsSummary[0].ammoniaMin,
                current: currentAmmonia.toFixed(2),
                ammoniaReadings
            },
            co2: {
                max: readingsSummary[0].coMax,
                min: readingsSummary[0].coMin,
                current: currentCO2.toFixed(2),
                coReadings
            },
            humidity: {
                max: readingsSummary[0].humidityMax,
                min: readingsSummary[0].humidityMin,
                current: currentHumidity.toFixed(2),
                humidityReadings
            }
        }
        res.status(200).send({
            errStatus: false,
            data: resultObj
        })

    } catch (error) {
        console.log(error);
        let msg = error;
        if (typeof msg === 'object') {
            msg = error.message;
        }
        res.status(500).send({
            errStatus: false,
            message: msg
        })
    }
});

module.exports = router;