var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const moment = require('moment-timezone')
router.post('/addFarm', async function(req, res, next) {
    try {
        const createdBy = req.user.userID;
        const farmNameCheck  = await sql.farmNameCheck(req.body.farmName, req.body.farmOwnerID)
        let assignedto = '';
        if(req.user.userType === 'Admin') {
            assignedto = req.body.farmerID;
        } else if (req.user.userType === 'Farmer') {
            assignedto = createdBy;
        }
        if(farmNameCheck > 0) {
            console.log('error')
            res.status(200).send({
                status: false,
                message: "Farm Name Already exists"
            }) 
            return;
        }
        const proc_values = [
            req.body.farmName,
            assignedto,
            'ACTIVE',
            assignedto,
            misc.today(),
            assignedto,
            misc.today()
        ];
        await sql.callProc('farmMaster_proc', await sql.genArgs(7), proc_values);
        res.status(200).send({
            status: true,
            message: "Successfully added Farm: "+req.body.farmName
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
  router.post('/addBatch', async function(req, res, next) {
    try {
        
        const createdBy = req.user.userID;
        const batchStatus = await sql.batchStatusCheck(req.body.farmID);
        if(batchStatus > 0) {
            res.status(200).send({
                status: false,
                message: "Farm already has a running batch"
            }) 
            return;
        }
        let assignedto = '';
        
        if(req.user.userType === 'Admin') {
            assignedto = req.body.farmerID;
        } else if (req.user.userType === 'Farmer') {
            assignedto = createdBy;
        }
        const proc_values = [
            req.body.batchName,
            req.body.farmID,
            req.body.deviceID,
            req.body.startDate,
            req.body.endDate,
            'ACTIVE',
            assignedto,
            misc.today(),
            assignedto,
            misc.today()
        ];
        await sql.callProc('batchMaster_proc', await sql.genArgs(10), proc_values);
        res.status(200).send({
            status: true,
            message: "Successfully added batch: "+req.body.batchName
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
  router.get('/listoffarms', async function(req, res, next) {
    try {
        const userID = req.user.userID;
        const farms = await sql.listoffarms(userID); 
        res.status(200).send({
            status: true,
            data: farms
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
  router.get('/listoffarmsAdmin/:farmerID', async function(req, res, next) {
    try {
        const userID = req.params.farmerID;
        const farms = await sql.listoffarms(userID); 
        res.status(200).send({
            status: true,
            data: farms
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
  router.get('/listoffarms_all', async function(req, res, next) {
    try {
       
        const farms = await sql.listoffarms_admin();
        const farmsData = farms.map((item, index) => {
            return {
                sno: index + 1,
                ...item
            };
        });
        res.status(200).send({
            status: true,
            data: farmsData
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
  router.get('/listofbatches', async function(req, res, next) {
    try {
        
        const batches = await sql.listofBatches(req.params.farmID); 
        res.status(200).send({
            status: true,
            data: batches
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
  router.get('/listofdevices', async function(req, res, next) {
    try {
        
        const devices = await sql.assignedDevices(req.user.userID); 
        for(let device of  devices) {
            const installedLocation = await sql.installedLocation(device.deviceID);
            device.installedLocation = installedLocation;
        }
        res.status(200).send({
            status: true,
            data: devices
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
  router.get('/listofavailabledevices/:batchID', async function(req, res, next) {
    try {
        console.log('&&&', req.params.batchID)
        const batchID = req.params.batchID;
        let forEdit = [];
        let data = [];
        

        if(batchID !== undefined) {
            console.log('Batch Exists')
            forEdit = await sql.listofAvailableDevicesForEdit(batchID);
        }
        console.log('forEdit: ', forEdit)
        const devices = await sql.listofAvailableDevices(req.user.userID, req.params.batchID); 
        data = [...devices, ...forEdit];
        res.status(200).send({
            status: true,
            data: data
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
  router.get('/notifications', async function(req, res, next) {
    try {
        const data = await sql.notifications(req.user.userID, moment().format('YYYY-MM-DD') ); 
        res.status(200).send({
            status: true,
            data: data
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
  router.get('/closedBatches/:farmID', async function(req, res, next) {
    try {
        const batchInfo = await sql.getClosedBatches(req.params.farmID);
        
        if(batchInfo.length == 0) {
            res.status(200).send({
                status: true,
                message: 'There are no closed batches found for this farm'
            })    
            return;
        } 
        const data = batchInfo.filter((thing, index, self) =>
        index === self.findIndex((t) => (
          JSON.stringify(t) === JSON.stringify(thing)
        ))
      )
        res.status(200).send({
            status: false,
            data: data
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
  router.get('/activeFarmersList', async function(req, res, next) {
    try {
        const data = await sql.activeFarmownersList();
        res.status(200).send({
            status: false,
            data: data
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
  router.get('/listofDevicesByFarm/:farmID', async function(req, res, next) {
    try {
        const data = await sql.listofDevicesByFarm(req.params.farmID);
        console.log('data '+data)
        res.status(200).send({
            status: false,
            data: data
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
  router.post('/updateNotifications', async function(req, res, next) {
    try {
        console.log('Hello Notifications')
        const data = await sql.updateNotications(req.user.userID, moment().format('YYYY-MM-DD') ); 
        res.status(200).send({
            status: true,
            data: data
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
  router.get('/paramReadings/:param/:deviceID/:date', async function(req, res, next) {
    try {
       
        const data = await sql.avgParamReadings(req.params.param, req.params.deviceID, req.params.date);
        const xdata = [];
        const ydata = [];
        data.forEach((item)=>{
            xdata.push(item.hr);
            ydata.push(item.val);
        })
        res.status(200).send({
            status: true,
            data: { xdata, ydata }
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
  router.get('/historyReadings/:deviceID/:date/', async function(req, res, next) {
    try {
        const getBatchID = await sql.getBatchIDBydevice(req.params.deviceID);
        if(getBatchID.length ==0) {
            res.status(500).send({
                status: false,
                message: 'Could not get batch details'
            });
            return;
        }
        const latest = await sql.getLatestDeviceReadings(getBatchID[0].batchID, req.params.date);
        const dayMinMax = await sql.getDayMinMaxDeviceReadings(req.params.deviceID, req.params.date);
       
        res.status(200).send({
            status: true,
            data: { latest, dayMinMax }
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
  router.get('/deviceReadings/:deviceID/:date/', async function(req, res, next) {
    try {
        const data = await sql.getDayReadings(req.params.deviceID, req.params.date)
        res.status(200).send({
            status: true,
            data: data
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
  router.get('/getAbnormalThresholds/', async function(req, res, next) {
    try {
        const data = await sql.abnormalThresholds();
        
        res.status(200).send({
            status: true,
            data: data
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