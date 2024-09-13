var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')

router.get('/defaults/', async function (req, res, next) {
    try {
        let userThresholds = await sql.getUserThresholds(req.user.userID);
        let data = [];
        if(userThresholds.length>0) {
            data = userThresholds;
        } else {
            data =  await sql.defaultThresholds();
        }
        res.status(200).send({
            status: true,
            data: data
        })

    } catch (error) {
        console.log(error);
        let msg = error;
        if (typeof msg === 'object') {
            msg = error.message;
        }
        res.status(500).send({
            status: false,
            message: msg
        })
    }
});
router.post('/update/', async function (req, res, next) {
    
    try {
        console.log('Body ', req.body);
        const title = req.body[0].title;
        const user = req.user;
        // Check if the threshold record exists
        let userThresholds = await sql.getUserThresholds(user.userID);
        let insert = false;
        console.log(userThresholds.length);
        if(userThresholds.length === 0) {
            insert = true
        }
        let defaultThresholds = req.body;
        if(!insert) {
            const _delete = await sql.deleteUserThresholds(user.userID);
            // defaultThresholds = await sql.defaultThresholds();
            // if(title === 'CO2') {
            //     defaultThresholds[0].co2Min = req.body.minVal;
            //     defaultThresholds[0].co2Max = req.body.maxVal;
            // } else if(title === 'Ammonia') {
            //     defaultThresholds[0].nh3Min = req.body.minVal;
            //     defaultThresholds[0].nh3Max = req.body.maxVal;
            // } else if(title === 'Heat Index') {
            //     defaultThresholds[0].hiMin = req.body.minVal;
            //     defaultThresholds[0].hi3Max = req.body.maxVal;
            // } else if(title === 'Temperature') {
            //     defaultThresholds[0].tempMin = req.body.minVal;
            //     defaultThresholds[0].tempMax = req.body.maxVal;
            // } else if(title === 'Humidity') {
            //     defaultThresholds[0].humidityMin = req.body.minVal;
            //     defaultThresholds[0].humidityMax = req.body.maxVal;
            // }

        } 
        // else {
        //     //update
        //     defaultThresholds = req.body;
        //     const _delete = await sql.deleteUserThresholds(user.userID);
        // }
        console.log(title);
       
       //console.log( [...defaultThresholds])
        // Insert Procedure call
        const insert_Vals = [
            user.userID,
            defaultThresholds[0].soilMoistureMin,
            defaultThresholds[0].soilMoistureMax,
            defaultThresholds[0].soilTempMin,
            defaultThresholds[0].soilTempMax,
            defaultThresholds[0].soilNitrogenMin,
            defaultThresholds[0].soilNitrogenMax,

            defaultThresholds[0].soilPhosporousMin,
            defaultThresholds[0].soilPhosporousMax,
            
            defaultThresholds[0].soilPotassiumMin,
            defaultThresholds[0].soilPotassiumMax,
            defaultThresholds[0].soilPHMin,
            defaultThresholds[0].soilPHMax,
            defaultThresholds[0].soilECMin,
            defaultThresholds[0].soilECMax,
            defaultThresholds[0].airTemperatureMin,
            defaultThresholds[0].airTemperatureMax,
            defaultThresholds[0].windSpeedMin,
            defaultThresholds[0].windSpeedMax,
            defaultThresholds[0].batteryVoltageMin,
            defaultThresholds[0].batteryVoltageMax,
            defaultThresholds[0].humidityMin,
            defaultThresholds[0].humidityMax,
            defaultThresholds[0].co2Min,
            defaultThresholds[0].co2Max,
            user.userID,
            misc.today(),
            user.userID,
            misc.today(),
        ]
        console.log(insert_Vals)
        await sql.callProc('userThresholds', await sql.genArgs(28), insert_Vals);
        res.status(200).send({
            status: true,
            message: `Successfully updated ${title} threshold levels`
        })

    } catch (error) {
        console.log(error);
        let msg = error;
        if (typeof msg === 'object') {
            msg = error.message;
        }
        res.status(500).send({
            status: false,
            message: msg
        })
    }
});
  
  module.exports = router;