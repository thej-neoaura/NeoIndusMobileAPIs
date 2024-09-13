var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc');
const moment = require('moment-timezone');

router.get('/:farmID', async function (req, res, next) {
    try {
        console.log(req.params)
        const activeBatch = await sql.getActiveBatch(req.params.farmID);
        if(activeBatch.length === 0) {
            res.status(200).send({
                status: true,
                message: 'There are no active batches in this farm'
            });
            return;
        }
        
        const batchID = activeBatch[0].batchID;
        const batchInfo = await sql.batchInfo(batchID);
        const endDate = moment(batchInfo[0].endDate).format('YYYY-MM-DD');
        const startDate = moment(batchInfo[0].startDate).format('YYYY-MM-DD');
        const difference = moment(endDate).diff(startDate, 'days');
        const devices = [];
        let entries = [];
        const entryDetails = await sql.getEntryDetails(batchID);
   
        
        for(let i=0; i<difference; i++) {
            let date = moment(startDate).add(i, 'days').format('YYYY-MM-DD');
            
            let filter = entryDetails.filter((a)=> a.createdDate == date);
            let mortality = 'Not Entered';
            let weight = 'Not Entered';
            
            if(filter.length > 0) {
                if(filter[0].mortality !== null || filter[0].mortality !== '') {
                    mortality = filter[0].mortality;
                }
                if(filter[0].weight !== null || filter[0].weight !== '') {
                    weight = filter[0].weight;
                }
            }
            let obj = {
                day: i+1,
                date: date,
                mortality,
                weight
            }
            entries.push(obj);
        }
        let batchObj = {
            batchID,
            devices: devices,
            batchName: batchInfo[0].batchName,
            farmName: parseInt(batchInfo[0].farmID),
            endDate: endDate,
            farmName: batchInfo[0].farmID,
            startDate: startDate,
            difference: difference,
            entries
        }
        batchInfo.forEach(batch => {
            let deviceObj = {
                deviceID: parseInt(batch.deviceID),
                deviceName: batch.deviceName,
                location: batch.installedLocation
            }
            devices.push(deviceObj);
            
        });
        res.status(200).send({
            status: false,
            data: batchObj
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