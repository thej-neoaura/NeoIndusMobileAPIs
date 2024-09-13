var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc');
const moment = require('moment-timezone');
router.get('/:batchID', async function (req, res, next) {
    try {
        
        const batchID = req.params.batchID;
        const batchInfo = await sql.batchInfo(batchID);
        if(batchInfo.length ==0) {
            res.status(200).send({
                status: true,
                message: 'Batch information not found'
            })
            return;
    
        }
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
        let avgWeight = 0, mortality = 0;
        entries.forEach((element)=>{
            let _mortality = 0, _weight = 0;
            if(typeof element.mortality === 'number') {
                _mortality = element.mortality
            }
            if(typeof element.weight === 'number') {
                _weight = element.weight
            }
            avgWeight += _weight;
            mortality += _mortality;
        })
        if(entries.length > 0) {
            avgWeight = avgWeight / entries.length;
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
            entries,
            avgWeight: avgWeight.toFixed(2),
            mortality: mortality
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