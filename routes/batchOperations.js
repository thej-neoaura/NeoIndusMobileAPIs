var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc');
const moment = require('moment-timezone');

router.post('/updateBatch', async function (req, res, next) {
    try {
        const modifiedBy = req.user.userID;
        const batchID = req.body.batchID;
        const flag = req.body.flag;
        const date = misc.today();
        let update = false;
        let message = '';
        if (flag === 'closeBatch') {
            console.log(flag)
            update = await sql.closeBatch(date, batchID, modifiedBy, date);
            message = 'Successfully closed batch'
        } else if (flag === 'deleteBatch') {
            update = await sql.deleteBatch(batchID, modifiedBy, date);
            message = 'Successfully deleted batch'
        }
        if (update) {
            res.status(200).send({
                status: true,
                message: message
            })
        } else {
            res.status(200).send({
                status: false,
                message: "Error in updating batch"
            })
        }

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
router.post('/dailyEntries', async function (req, res, next) {
    try {
        const modifiedBy = req.user.userID;
        const batchID = req.body.batchID;
        const date = req.body.date;
        const mortality = req.body.mortality === 'Not Entered'? null : req.body.mortality;
        const weight = req.body.weight === 'Not Entered'? null : req.body.weight;
        let today = misc.today();
        
        // Check if the entry exsist
        const entryCount = await sql.getEntryCount(batchID, date);
        if(entryCount > 0) {
            // update
            const updateBatch = await sql.updateBatchVals(batchID, date, mortality, weight, today, modifiedBy)
            if(!updateBatch) {
                res.status(200).send({
                    status: true,
                    message: "Error in updating Batch Values, contact administrator"
                })
                return;
            }
        } else {
            // insert
            const proc_values = [
                batchID,
                mortality,
                weight,
                modifiedBy,
                date,
                modifiedBy,
                misc.today()
            ];
            await sql.callProc('operations_proc', await sql.genArgs(7), proc_values);
            
        }
        res.status(200).send({
            status: false,
            message: "Updated Batch Values"
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
router.get('/batchInfo/:batchID', async function (req, res, next) {
    try {
        const batchID = req.params.batchID;
        const batchInfo = await sql.batchInfo(batchID);
        const devices = [];
        let batchObj = {
            devices: devices,
            batchName: batchInfo[0].batchName,
            farmName: parseInt(batchInfo[0].farmID),
            endDate: moment(batchInfo[0].endDate).format('YYYY-MM-DD'),
            farmName: batchInfo[0].farmID,
            startDate:  moment(batchInfo[0].startDate).format('YYYY-MM-DD')
        }
        batchInfo.forEach(batch => {
            let deviceObj = {
                deviceID: parseInt(batch.deviceID),
                location: batch.installedLocation
            }
            devices.push(deviceObj);

        });
        res.status(200).send({
            status: true,
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
router.post('/editBatch', async function (req, res, next) {
    try {
        const modifiedBy = req.user.userID;
        const batchID = req.body.batchID;

        // delete  bactch records
        const removeBatch = await sql.removeBatches(batchID);
        if (!removeBatch) {
            res.status(200).send({
                status: false,
                message: "Couldn't update Batch"
            })
            return;
        }
        //insert new records
        const devices = req.body.devices;
        if (devices.length === 0) {
            res.status(200).send({
                status: false,
                message: "Please Add Devices and Installation Locations"
            })
            return;
        }
       // const batchID = uuidv4();
        console.log(batchID)
        for (let device of devices) {
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
                modifiedBy,
                misc.today(),
                modifiedBy,
                misc.today()
            ];
            await sql.callProc('batchMaster_proc', await sql.genArgs(13), proc_values);
        }

        res.status(200).send({
            status: true,
            message: "Successfully updated batch"
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