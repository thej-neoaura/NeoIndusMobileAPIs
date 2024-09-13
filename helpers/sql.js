var db = require("./dbconfig");

//Procedure Call
const callProc = (procName, queryParamsLen, values) =>{
    return new Promise ((resolve, reject)=>{
        let queryString = 'CALL '+procName+ '('+queryParamsLen+')';
        console.log(queryString);
        db.query(queryString, [...values], (err, results)=>{
            if (err) {
                return reject('Error in executing procedure '+err)
            } else {
                return resolve(true); 
            }
        });
    })
};
//Generate ? for proc
const genArgs = (length) =>{
    
    return new Promise ((resolve, reject)=>{
        let array=[];
        for(let i=0; i<length; i++) {
            array.push('?');
        }
        return resolve(array);
    })
};
 const emailIDCheck = (emailID) =>{
     
    return new Promise ((resolve, reject)=>{
      console.log(emailID)
      let query="SELECT count(*) count FROM appUsers where status='ACTIVE' and email=?";
      db.query(query,[emailID],(err, results)=>{
        if (err) {
          return reject('SQL Error'+err)
        } else {
            console.log(results)
           return resolve (results[0].count)
        }
      });
    })
};
const phoneNumberCheck = (phoneNumber) =>{
    return new Promise ((resolve, reject)=>{
      
      let query="SELECT phoneNumber, userID FROM appUsers where status='ACTIVE' and phoneNumber=?";
      db.query(query,[phoneNumber],(err, results)=>{
        if (err) {
          return reject('SQL Error'+err)
        } else {
            return resolve (results)
        }
      });
    })
};

const deviceCheck = (ssid) =>{
    return new Promise ((resolve, reject)=>{
      
      let query="SELECT count(0) count FROM deviceMaster where status = 'ACTIVE' and ssid=?;";
      db.query(query,[ssid],(err, results)=>{
        if (err) {
          return reject('SQL Error'+err)
        } else {
            return resolve (results[0].count)
        }
      });
    })
};
const farmNameCheck = (farmName, farmOwnerID) =>{
    return new Promise ((resolve, reject)=>{
      let query="SELECT count(0) count FROM farmMaster where status = 'ACTIVE' and farmOwnerID=? and farmName=?;";
      db.query(query,[farmOwnerID, farmName],(err, results)=>{
        if (err) {
          return reject('SQL Error'+err)
        } else {
            return resolve (results[0].count)
        }
      });
    })
};
const getPWD = (userName) =>{
  return new Promise ((resolve, reject)=>{
    //let query="SELECT * FROM appUsers where email=?;";
    let query = "SELECT * FROM appUsers where email=?;"
    console.log(userName)
    db.query(query,[userName], (err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
          if(results.length===0) {
              return reject("Invalid Username")
          } else {
            return resolve(results);
          }
      }
    });
  })
};
const getFcmToken = (userID) =>{
  return new Promise ((resolve, reject)=>{
    //let query="SELECT * FROM appUsers where email=?;";
    let query = "SELECT fcmtoken FROM fcmtokens where userID=?;"
    
    db.query(query,[userID], (err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
        return resolve(results);
      }
    });
  })
};
const batchStatusCheck = (farmID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT count(*) FROM batchMaster where farmID=? and status='Active';";
    db.query(query,[farmID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
          return resolve (results[0].count)
      }
    });
  })
};
const listoffarms = (userID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT farmID, farmName, createdDate FROM farmMaster where farmOwnerID=? and status='Active' order by createdDate desc;";
    db.query(query,[userID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve (results)
      }
    });
  })
};
const listoffarms_admin = (userID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT f.farmName, f.farmID, f.farmOwnerID, u.name, f.createdDate AS farmCreatedDate, b.batchName, b.batchID, b.createdDate AS batchCreatedDate, b.status AS batchStatus FROM farmMaster f JOIN appUsers u ON f.farmOwnerID = u.userID AND u.userType = 'Farmer' LEFT JOIN batchMaster b ON f.farmID = b.farmID WHERE b.startDate =(SELECT MAX(startDate) FROM batchMaster WHERE farmID = f.farmID) order by f.createdDate desc; ";
    db.query(query,[userID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve (results)
      }
    });
  })
};
const listofDevicesByFarm = (farmID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT batchID, batchName, deviceUUID(deviceID) uuid, deviceName(deviceID) deviceName FROM batchMaster where farmID=? and status='ACTIVE';";
    db.query(query,[farmID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve (results)
      }
    });
  })
};
const listofBatches= (farmID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT batchID, batchName FROM batchMaster where farmID=? and status='Active';";
    db.query(query,[farmID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve (results)
      }
    });
  })
};
const listofAvailableDevices= (userID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT deviceID, deviceName FROM deviceMaster where assignedTo = ? and deviceID not in (SELECT deviceID FROM batchMaster where status='Active');";
    db.query(query,[userID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve (results)
      }
    });
  })
};
const listofAvailableDevicesForEdit= (batchID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT a.deviceID, a.deviceName from deviceMaster as a, batchMaster as b WHERE a.deviceID = b.deviceID and b.batchID =?;";
    db.query(query,[batchID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve (results)
      }
    });
  })
};
const allBatches= (farmID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT distinct batchID, batchName, farmID, startDate, endDate, closedDate, deviceName(deviceID) deviceID, installedLocation FROM batchMaster where farmID=? and status in('Active', 'Closed') ORDER BY startDate desc;";
    db.query(query,[farmID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve (results)
      }
    });
  })
};
const batchInfo= (batchID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT a.*, b.deviceName FROM batchMaster as a, deviceMaster as b where a.deviceID = b.deviceID and a.batchID = ?;";
    db.query(query,[batchID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve (results)
      }
    });
  })
};
const setSafeUpdate = (num)=>{
  return new Promise ((resolve, reject)=>{
     let query="SET SQL_SAFE_UPDATES = ?;";
     
     db.query(query, [num], (err, results)=>{
       
       if (err) {
         console.log(err)
         return resolve(false)
       } else {
               return resolve(true)
           }
     });
   })
}
const closeBatch = (closedDate, batchID, userID, date) =>{
  return new Promise ((resolve, reject)=>{
   console.log(closedDate, batchID, userID, date);
   setSafeUpdate(0);
    let query="UPDATE batchMaster SET closedDate = ?, status = ?, modifiedBy=?, modifiedDate=? WHERE batchID=?;";
    
    db.query(query, [closedDate, 'Closed', userID, date, batchID], (err, results)=>{
      
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
          }
    });
    setSafeUpdate(1);
  })
};
const deleteBatch = (batchID, userID, date) =>{
  return new Promise ((resolve, reject)=>{
   
    let query="UPDATE batchMaster SET status = ?, modifiedBy=?, modifiedDate=? WHERE batchID=?";
    
    db.query(query, ['Inactive', userID, date, batchID], (err, results)=>{
      console.log(query)
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
          }
    });
  })
};

const removeBatches = (batchID) =>{
  return new Promise ((resolve, reject)=>{
   
    let query="DELETE FROM batchMaster where batchID=?";
    
    db.query(query, [batchID], (err, results)=>{
      console.log(query)
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
          }
    });
  })
};
const assignedDevices= (userID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT deviceID, deviceName, firmwareVersion, ssid FROM deviceMaster where assignedTo=? and status='Active';";
    db.query(query,[userID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve (results)
      }
    });
  })
};
const installedLocation= (deviceID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT  b.installedLocation FROM deviceMaster as a, batchMaster as b where a.deviceID = b.deviceID and b.status = 'Active' and a.deviceID =?;";
    db.query(query,[deviceID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
          if(results.length > 0) {
            return resolve (results[0].installedLocation)
          } else {
            return resolve(null)
          }
      }
    });
  })
};
const deviceAllocation= (deviceID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT b.farmName FROM batchMaster as a, farmMaster as b where a.farmID = b.farmID and a.deviceID=? and a.status='Active';";
    db.query(query,[deviceID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
          if(results.length > 0) {
            return resolve (results[0].farmName)
          } else {
            return resolve(null)
          }
      }
    });
  })
};
const updateDevice = (userID, data, deviceName, version, ssid, deviceID) =>{
  return new Promise ((resolve, reject)=>{
   
    let query="UPDATE deviceMaster SET modifiedBy=?, modifiedDate=?, deviceName=?, firmwareVersion=?, ssid=?  WHERE deviceID=?";
    
    db.query(query, [userID, data, deviceName, version, ssid, deviceID], (err, results)=>{
      console.log(query)
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
          }
    });
  })
};

const getUserThresholds= (userID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT soilMoistureMin, soilMoistureMax, soilTempMin, soilTempMax, soilNitrogenMin, soilNitrogenMax,soilPhosporousMin, soilPhosporousMax, soilPotassiumMin, soilPotassiumMax, soilPHMin, soilPHMax, soilECMin, soilECMax, airTemperatureMin, airTemperatureMax, windSpeedMin, windSpeedMax, batteryVoltageMin, batteryVoltageMax, humidityMin, humidityMax, co2Min, co2Max FROM userThresholds where userID=?";
    db.query(query,[userID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const deleteUserThresholds = (userID) =>{
  return new Promise ((resolve, reject)=>{
   
    let query="DELETE FROM userThresholds where userID=?";
    
    db.query(query, [userID], (err, results)=>{
      console.log(query)
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
          }
    });
  })
};
const updateUser = (name, phone, city, state, country, modifiedBy, modifiedDate, userID) =>{
  return new Promise ((resolve, reject)=>{
   setSafeUpdate(0);
    let query="UPDATE appUsers SET name=?, phoneNumber=?, city =?, state=?, country=?, modifiedBy=?, modifiedDate=? WHERE userID=?;";
    
    db.query(query, [name, phone, city, state, country, modifiedBy, modifiedDate, userID], (err, results)=>{
      
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
          }
    });
    setSafeUpdate(1);
  })
};
const listofbatchesByFarm= (farmID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT distinct batchID, batchName, createdDate  FROM batchMaster where farmID =? order by createdDate desc;";
    db.query(query,[farmID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getBatchID= (ssid) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT DISTINCT batchID FROM batchMaster as a, deviceMaster as b where a.deviceID = b.deviceID and b.ssid=? and a.status = 'Active';";
    db.query(query,[ssid],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getlatestReading= (uuid, userID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT b.deviceName, a.* FROM deviceReadings as a, deviceMaster as b where a.UUID=? and b.assignedTo=? and a.uuid=b.ssid order by a.createdDate desc limit 1;";
    db.query(query,[uuid, userID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getBatchReadings= (uuid) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT b.deviceName, a.* FROM deviceReadings as a, deviceMaster as b where a.UUID=? and a.uuid=b.ssid order by a.createdDate desc limit 1;";
    db.query(query,[uuid],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getBatchDetails= (userID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT a.batchID, a.installedLocation, b.ssid, farmName(a.farmID) farmName  FROM batchMaster as a, deviceMaster as b, farmMaster as c where a.deviceID = b.deviceID and a.status = 'Active' and a.farmID=c.farmID and c.farmOwnerID=?;";
    db.query(query,[userID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getBatchDetailsByID= (batchID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT a.startDate, a.closedDate, a.batchID, a.installedLocation, b.ssid, farmName(a.farmID) farmName FROM batchMaster as a, deviceMaster as b, farmMaster as c where a.deviceID = b.deviceID and a.status = 'Active' and a.farmID=c.farmID and a.batchID=?;";
    db.query(query,[batchID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const userThresholds= (userID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT soilMoistureMin, soilMoistureMax, soilTempMin, soilTempMax, soilNitrogenMin, soilNitrogenMax,soilPhosporousMin, soilPhosporousMax, soilPotassiumMin, soilPotassiumMax, soilPHMin, soilPHMax, soilECMin, soilECMax, airTemperatureMin, airTemperatureMax, windSpeedMin, windSpeedMax, batteryVoltageMin, batteryVoltageMax, humidityMin, humidityMax, co2Min, co2Max FROM userThresholds where userID=?;";
    db.query(query,[userID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const defaultThresholds= () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT * FROM thresholds";
    db.query(query,[],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const batchDetailsHistory= (deviceID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT DATE(a.startDate) startDate, DATE(a.endDate) endDate, IFNULL(DATE(a.closedDate), null) closedDate, b.ssid  FROM batchMaster as a, deviceMaster as b WHERE a.deviceID=b.deviceID and b.ssid=? and a.status='Active';";
    db.query(query,[deviceID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const avgReadings= (deviceID, batchID, startDate, endDate) =>{
  console.log(deviceID, batchID, startDate, endDate)
  return new Promise ((resolve, reject)=>{
    let query="SELECT round(avg(temp), 2) temp, round(avg(humidity), 2) humidity, round(avg(co2), 2) co2, round(avg(ammonia), 2) ammonia, Date(createdDate) createdDate FROM deviceReadings where uuid=? and batchID=? and Date(createdDate)  between ? and ? group by Date(createdDate);";
    db.query(query,[deviceID, batchID, startDate, endDate],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
//
const getBatchIDBydevice= (deviceID) =>{
  
  return new Promise ((resolve, reject)=>{
    let query="SELECT b.batchID FROM agripal.deviceMaster as a, batchMaster as b where ssid=? and a.deviceID=b.deviceID;";
    db.query(query,[deviceID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getDayReadings= (deviceID, date) =>{
  
  return new Promise ((resolve, reject)=>{
    let query="SELECT * FROM deviceReadings where uuid=? and Date(createdDate)=? order by createdDate Desc;";
    db.query(query,[deviceID, date],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getLatestDeviceReadings= (batchID, date) =>{
  
  return new Promise ((resolve, reject)=>{
    let query="SELECT createdDate, ifnull(round(soilMoisture, 2), 0) soilMoisture, ifnull(round(soilTemperature, 2), 0) soilTemperature, ifnull(round(soilNitrogen, 2), 0) soilNitrogen, ifnull(round(soilPhosphorous, 2), 0) soilPhosphorous, ifnull(round(soilPotassium, 2), 0) soilPotassium, ifnull(round(soilPH, 2), 0) soilPH, ifnull(round(soilEC, 2), 0) soilEC, ifnull(round(co2, 2), 0) co2 FROM deviceReadings where batchID=? and Date(createdDate) = ? order by createdDate desc limit 1;";
    db.query(query,[batchID, date],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getDayMinMaxDeviceReadings= (deviceID, date) =>{
  
  return new Promise ((resolve, reject)=>{
    let query="SELECT ifnull(round(min(soilMoisture), 2),0) soilMoisture_min, ifnull(round(max(soilMoisture), 2),0) soilMoisture_max, ifnull(round(min(soilTemperature), 2),0) soilTemperature_min, ifnull(round(max(soilTemperature), 2),0) soilTemperature_max, ifnull(round(min(soilNitrogen), 2),0) soilNitrogen_min, ifnull(round(max(soilNitrogen), 2),0) soilNitrogen_max, ifnull(round(min(soilPhosphorous), 2),0) soilPhosphorous_min, ifnull(round(max(soilPhosphorous), 2),0) soilPhosphorous_max, ifnull(round(min(soilPotassium), 2),0) soilPotassium_min, ifnull(round(max(soilPotassium), 2),0) soilPotassium_max, ifnull(round(min(soilPH), 2),0) soilPH_min, ifnull(round(max(soilPH), 2),0) soilPH_max, ifnull(round(min(soilEC), 2),0) soilEC_min, ifnull(round(max(soilEC), 2),0) soilEC_max, ifnull(round(min(co2), 2),0) co2_min, ifnull(round(max(co2), 2),0) co2_max FROM deviceReadings where uuid=? and Date(createdDate) = ?;";
    db.query(query,[deviceID, date],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const maxDate= (batchID, deviceID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT max(createdDate) maxDate FROM deviceReadings where batchID=? and uuid=?;";
    db.query(query,[batchID, deviceID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results[0].maxDate)
      }
    });
  })
};
const fcmTokenStatus= (userID, fcmtoken) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT count(0) count FROM fcmtokens where userID=? and fcmtoken = ?;";
    db.query(query,[userID, fcmtoken],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results[0].count)
      }
    });
  })
};
const getBatchDetailsNotifications= (batchID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT a.batchID, a.farmID, farmName(a.farmID) farmname, a.batchName, a.deviceID, deviceName(a.deviceID) deviceName, a.installedLocation, b.farmOwnerID, c.fcmtoken FROM batchMaster as a, farmMaster as b, fcmtokens as c  where batchID=? and a.farmID = b.farmID;";
    db.query(query,[batchID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const notifications= (userID, date) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT DATE_FORMAT(createdDate, '%d-%m-%Y %T %p') createdDate, message, status FROM notifications where userID=? and Date(createdDate) = ? order by createdDate desc";
    
    db.query(query,[userID, date],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getActiveBatch= (farmID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT b.batchID, b.startDate, b.endDate FROM farmMaster as a, batchMaster as b where a.farmID=b.farmID and b.status='Active' and a.farmID=?;";
    db.query(query,[farmID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getEntryDetails= (batchID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT mortality, weight, Date_Format(createdDate,  '%Y-%m-%d') createdDate FROM batchOperations where batchID=?;";
    db.query(query,[batchID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getClosedBatches= (farmID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT batchID, batchName, date_format(closedDate, '%Y-%m-%d') closedDate from batchMaster as a where a.status='Closed' and a.farmID=? and id=(select Max(id) from batchMaster where batchID = a.batchID); ";
    db.query(query,[farmID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const activeFarmownersList= () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT userID, name FROM appUsers where userType='Farmer' and status='Active' order by createdDate desc;";
    db.query(query,(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const batchReadings= (batchID, deviceID, date) =>{
  return new Promise ((resolve, reject)=>{
    let query="select * from deviceReadings where batchID=? and uuid = deviceUUID(?) and Date(createdDate)=? order by createdDate asc;";
    db.query(query,[batchID, deviceID, date],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const batchReadingsSummary= (batchID, deviceID, date) =>{
  return new Promise ((resolve, reject)=>{
    let query="select IFNULL(ROUND(max(temp), 2),0) tempMax, IFNULL(ROUND(min(temp), 2),0) tempMin, IFNULL(ROUND(max(humidity), 2),0) humidityMax, IFNULL(ROUND(min(humidity), 2),0) humidityMin, IFNULL(ROUND(max(ammonia), 2),0) ammoniaMax, IFNULL(ROUND(min(ammonia), 2),0) ammoniaMin, IFNULL(ROUND(max(co2), 2),0) coMax, IFNULL(ROUND(min(co2), 2),0) coMin from deviceReadings where batchID=? and uuid = deviceUUID(?) and Date(createdDate)=? order by createdDate asc;";
    db.query(query,[batchID, deviceID, date],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const avgParamReadings= (param,deviceID, date) =>{
  return new Promise ((resolve, reject)=>{
    console.log(param,deviceID, date)
    let query = '';
    if(param === 'soilMoisture') {
      query="SELECT hour(createdDate) hr, IFNULL(round(avg(soilMoisture), 2),0) val FROM deviceReadings where uuid=? and Date(createdDate)=? group by hr; ";
    } else if(param === 'soilTemperature') {
      query="SELECT hour(createdDate) hr, IFNULL(round(avg(soilTemperature), 2),0) val FROM deviceReadings where uuid=? and Date(createdDate)=? group by hr; ";
    } else if(param === 'soilNitrogen') {
      query="SELECT hour(createdDate) hr, IFNULL(round(avg(soilNitrogen), 2),0) val FROM deviceReadings where uuid=? and Date(createdDate)=? group by hr; ";
    }else if(param === 'soilPhosphorous') {
      query="SELECT hour(createdDate) hr, IFNULL(round(avg(soilPhosphorous), 2),0) val FROM deviceReadings where uuid=? and Date(createdDate)=? group by hr; ";
    }else if(param === 'soilPotassium') {
      query="SELECT hour(createdDate) hr, IFNULL(round(avg(soilPotassium), 2),0) val FROM deviceReadings where uuid=? and Date(createdDate)=? group by hr; ";
    }else if(param === 'soilPH') {
      query="SELECT hour(createdDate) hr, IFNULL(round(avg(soilPH), 2),0) val FROM deviceReadings where uuid=? and Date(createdDate)=? group by hr; ";
    }else if(param === 'soilEC') {
      query="SELECT hour(createdDate) hr, IFNULL(round(avg(soilEC), 2),0) val FROM deviceReadings where uuid=? and Date(createdDate)=? group by hr; ";
    }else if(param === 'co2') {
      query="SELECT hour(createdDate) hr, IFNULL(round(avg(co2), 2),0) val FROM deviceReadings where uuid=? and Date(createdDate)=? group by hr; ";
    } else if (param === 'soilTemperature') {
      query="SELECT hour(createdDate) hr, IFNULL(round(avg(soilTemperature), 2),0) val FROM deviceReadings where uuid=? and Date(createdDate)=? group by hr; ";
    }
    
    db.query(query,[deviceID, date],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const getEntryCount= (batchID, entryDate) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT count(0) count FROM batchOperations where batchID=? and Date(createdDate) = ?;";
    db.query(query,[batchID, entryDate],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results[0].count)
      }
    });
  })
};
const updateBatchVals = (batchID, date, mortality, weight, modifiedDate, modifiedBy) =>{
  return new Promise ((resolve, reject)=>{
   
    let query="UPDATE batchOperations SET mortality=?, weight=?, modifiedDate=?, modifiedBy=? WHERE batchID = ? and Date(createdDate)=?";
    
    db.query(query, [mortality, weight, modifiedDate, modifiedBy, batchID, date], (err, results)=>{
      
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
          }
    });
  })
};
const userExists= (userName) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT count(0) count FROM appUsers where email=?;";
    db.query(query,[userName],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results[0].count)
      }
    });
  })
};
const updateFcmToken = (fcmtoken, date, userID) =>{
  return new Promise ((resolve, reject)=>{
   
    let query="UPDATE fcmtokens SET fcmtoken = ?, modifiedDate=? WHERE userID=?";
    
    db.query(query, [fcmtoken, date, userID], (err, results)=>{
      console.log(query)
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
          }
    });
  })
};
const updateNotications= (userID, date) =>{
  
  return new Promise ((resolve, reject)=>{
    setSafeUpdate(0);
    let query="Update notifications set status = 'read' where userID=? and Date(createdDate)=?;";
    
    db.query(query, [userID, date], (err, results)=>{
      
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true);
              
          }
    });
    setSafeUpdate(1);
  })
 
};
const paramReadings= (date, batchID, deviceID, flag) =>{
 
  return new Promise ((resolve, reject)=>{
    let query='';
    if(flag === 'co2') {
      query="SELECT round(co2) param, createdDate FROM deviceReadings where Date(createdDate)=? and batchID=? and uuid =? order by  createdDate ASC;";
    } else if(flag === 'nh3') {
      query="SELECT round(ammonia) param, createdDate FROM deviceReadings where Date(createdDate)=? and batchID=? and uuid =? order by  createdDate ASC;";
    }else if(flag === 'temp') {
      query="SELECT round(temp) param, createdDate FROM deviceReadings where Date(createdDate)=? and batchID=? and uuid =? order by  createdDate ASC;";
    }else if(flag === 'humidity') {
      query="SELECT round(humidity) param, createdDate FROM deviceReadings where Date(createdDate)=? and batchID=? and uuid =? order by  createdDate ASC;";
    } else {
      return resolve([])
    }
    db.query(query,[date, batchID, deviceID],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const listOfusers= () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT name, email, phoneNumber, city, state,country, createdDate, status, createdBy FROM agripal.appUsers order by createdDate desc;";
    db.query(query,(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
//For Batch Procesing
const readings= (startDateTime, endDatetime) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT * FROM deviceReadings where createdDate between ? and ?;";
    db.query(query,[startDateTime, endDatetime],(err, results)=>{
      if (err) {
        return reject('SQL Error'+err)
      } else {
         return resolve(results)
      }
    });
  })
};
const checkImeiNumber = (imeiNumber) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT count(0) count FROM signals where imeinumber=?;";
    db.query(query, [imeiNumber], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(0);
      } else {
        return resolve(results[0].count);
      }
    });
  })
}
const deviceConnections = () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT a.deviceid, a.deviceName, a.ssid, GetConnectionStatus(a.ssid) connectionStatus,(SELECT name FROM agripal.appUsers where userID=a.assignedTo) as assignedTo, modifiedDate as assignedDate, (SELECT installedLocation FROM agripal.batchMaster where deviceID=a.deviceid and status='ACTIVE' limit 1) currentLocation FROM agripal.deviceMaster as a;";
    db.query(query, [], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(0);
      } else {
        return resolve(results);
      }
    });
  })
}
const deviceStatus = (type) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT a.id, b.ssid as deviceID, deviceName (a.deviceID) as deviceName, farmName(a.farmID) as farmName, a.farmID, a.batchID, a.installedLocation, GetConnectionStatus(b.ssid) as connectionStatus FROM agripal.batchMaster as a, deviceMaster as b where a.deviceID=b.deviceID and b.status='ACTIVE' and a.status=? order by a.createdBy desc";
    db.query(query, [type], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve([]);
      } else {
        return resolve(results);
      }
    });
  })
}
//SELECT COUNT(DISTINCT CASE WHEN status = 'ACTIVE' THEN deviceID END) AS commissioned, COUNT(DISTINCT CASE WHEN status = 'CLOSED' THEN deviceID END) AS decommissioned, COUNT(DISTINCT CASE WHEN status = 'HIBERNATION' THEN deviceID END) AS hibernated FROM agripal.batchMaster;

const deviceStatusCounts = () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT COUNT(DISTINCT CASE WHEN status = 'ACTIVE' THEN deviceID END) AS commissioned, COUNT(DISTINCT CASE WHEN status = 'CLOSED' THEN deviceID END) AS decommissioned, COUNT(DISTINCT CASE WHEN status = 'HIBERNATION' THEN deviceID END) AS hibernated FROM agripal.batchMaster;";
    db.query(query, [], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve({
          commissioned:0,
          decommissioned:0,
          hibernated:0,
        });
      } else {
        if(results.length>0) {
          return resolve({
            commissioned:results[0].commissioned,
            decommissioned:results[0].decommissioned,
            hibernated:results[0].hibernated,
          });
        }
      
      }
    });
  })
}
//SELECT installedLocation, startDate as installedDate, batchName, status FROM agripal.batchMaster where deviceID='2';
const installedLocations = (deviceID) =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT installedLocation, startDate as installedDate, batchName, status FROM agripal.batchMaster where deviceID=?";
    db.query(query, [deviceID], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(0);
      } else {
        return resolve(results);
      }
    });
  })
}
//SELECT soilNitrogen FROM deviceReadings WHERE soilNitrogen > 0 and uuid='860203066132530' limit 10;
//SELECT soilPhosphorous FROM deviceReadings WHERE soilNitrogen > 0 and uuid='860203066132530' limit 10;
//SELECT soilPotassium FROM deviceReadings WHERE soilNitrogen > 0 and uuid='860203066132530' limit 10;
//Manipulated NPK
const  manNitrogen= () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT soilNitrogen FROM deviceReadings WHERE soilNitrogen > 0 and uuid='860203066132530' limit 10";
    db.query(query, [], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(0);
      } else {
        console.log(results)
        return resolve(results.map((item)=>item.soilNitrogen));
      }
    });
  })
}
const  manPhosphorous= () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT soilPhosphorous FROM deviceReadings WHERE soilNitrogen > 0 and uuid='860203066132530' limit 10;";
    db.query(query, [], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(0);
      } else {
        return resolve(results.map((item)=>item.soilPhosphorous));
      }
    });
  })
}
const  manPotassium= () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT soilPotassium FROM deviceReadings WHERE soilNitrogen > 0 and uuid='860203066132530' limit 10;";
    db.query(query, [], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(0);
      } else {
        return resolve(results.map((item)=>item.soilPotassium));
      }
    });
  })
}
const  abnormalThresholdsCount= () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT count(0) as count FROM agripal.abnormalThresholds;";
    db.query(query, [], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(results[0].count);
      } else {
      }return resolve(results[0].count);
       
    });
  })
}
const  abnormalThresholds= () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT * FROM agripal.abnormalThresholds;";
    db.query(query, [], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(results);
      } else {
      }return resolve(results);
       
    });
  })
}
const updatAbnormalThresholds = (array) =>{
  return new Promise ((resolve, reject)=>{
    let query="UPDATE abnormalThresholds SET userID = ?, soilMoistureMin = ?, soilMoistureMax = ?, soilTempMin = ?, soilTempMax = ?, soilNitrogenMin = ?, soilNitrogenMax = ?, soilPhosporousMin = ?, soilPhosporousMax = ?, soilPotassiumMin = ?, soilPotassiumMax = ?, soilPHMin = ?, soilPHMax = ?, soilECMin = ?, soilECMax = ?, airTemperatureMin = ?, airTemperatureMax = ?, windSpeedMin = ?, windSpeedMax = ?, batteryVoltageMin = ?, batteryVoltageMax = ?, humidityMin = ?, humidityMax = ?, co2Min = ?, co2Max = ?, modifiedBy = ?, modifiedDate = ? WHERE id = '1'; ";
    db.query(query, [...array], (err, results)=>{
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
        }
    });
  })
};
const deviceAssignments = (type, userID) =>{
  return new Promise ((resolve, reject)=>{
    let query="";
    if(type=='all') {
      query="SELECT deviceID, deviceName, ssid as imeinumber, status, assignedTo,(SELECT name FROM agripal.appUsers where userID=assignedTo) as farmerName, createdDate as assignedDate FROM agripal.deviceMaster;";
    } else {
      query="SELECT deviceID, deviceName, ssid as imeinumber, status, assignedTo,(SELECT name FROM agripal.appUsers where userID=assignedTo) as farmerName, createdDate as assignedDate FROM agripal.deviceMaster where assignedTo=?;"
    }
    db.query(query, [userID], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(0);
      } else {
        return resolve(results);
      }
    });
  })
}
//list of farmers
const listOfFarmers = () =>{
  return new Promise ((resolve, reject)=>{
    let query="SELECT name, userID FROM agripal.appUsers where userType='Farmer';";
    db.query(query, [], (err, results)=>{
      if (err) {
        console.log(err);
        return resolve(0);
      } else {
        return resolve(results);
      }
    });
  })
}
const updateBatchStatus = (type, dateTime, batchID, userID) =>{
  return new Promise ((resolve, reject)=>{
   let query=''
   let params=[];
    if(type == 'Comissioned') {
      query =  "UPDATE batchMaster SET status='COMISSIONED', modifiedDate=?, modifiedBy=? WHERE batchID=?"
      params = [dateTime, userID, batchID]
    } else if(type == 'Hibernation') {
      query =  "UPDATE batchMaster SET status='HIBERNATION', modifiedDate=?, modifiedBy=? WHERE batchID=?"
      params = [dateTime, userID, batchID]
    }
    else if(type == 'Decommisioned') {
      query =  "UPDATE batchMaster SET status='DECOMISSIONED', modifiedDate=?, modifiedBy=?, closedDate=? WHERE batchID=?"
      params = [dateTime, userID, dateTime, batchID]
    }
    db.query(query, params, (err, results)=>{
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
        }
    });
  })
};
const updateSignal = (imei, signalStrength, dateTime) =>{
  return new Promise ((resolve, reject)=>{
    let query="UPDATE signals set imeinumber=?, signalstrength=?, createdDate=? where imeinumber=?;";
    db.query(query, [imei, signalStrength, dateTime, imei], (err, results)=>{
      if (err) {
        console.log(err)
        return resolve(false)
      } else {
              return resolve(true)
        }
    });
  })
};
const insertSignal = async (imei, signalStrength, dateTime)=>{
  const imeiNumberExists = await checkImeiNumber(imei);
  let status = false;
  if(imeiNumberExists>0) {
    await updateSignal(imei, signalStrength, dateTime);
    status = true;
  } else {
    const insert = await callProc('signalstength', await genArgs(3), [imei, signalStrength, dateTime]);
    status = true;
  }
  return status;
}

module.exports = {
    callProc,
    genArgs,
    emailIDCheck,
    phoneNumberCheck,
    deviceCheck,
    farmNameCheck,
    getPWD,
    batchStatusCheck,
    listoffarms,
    listofBatches,
    listofAvailableDevices,
    allBatches,
    closeBatch,
    deleteBatch,
    removeBatches,
    batchInfo,
    listofAvailableDevicesForEdit,
    assignedDevices,
    installedLocation,
    deviceAllocation,
    updateDevice,
    defaultThresholds,
    getUserThresholds,
    deleteUserThresholds,
    updateUser,
    listofbatchesByFarm,
    getBatchID,
    getlatestReading,
    getBatchDetails,
    userThresholds,
    batchDetailsHistory,
    avgReadings,
    maxDate,
    paramReadings,
    fcmTokenStatus,
    updateFcmToken,
    getFcmToken,
    getBatchDetailsNotifications,
    notifications,
    userExists,
    getBatchReadings,
    getBatchDetailsByID,
    getActiveBatch,
    getEntryDetails,
    getEntryCount,
    updateBatchVals,
    updateNotications,
    getClosedBatches,
    activeFarmownersList,
    listofDevicesByFarm,
    batchReadings,
    batchReadingsSummary,
    avgParamReadings,
    getLatestDeviceReadings,
    getDayMinMaxDeviceReadings,
    getDayReadings,
    listOfusers,
    readings,
    getBatchIDBydevice,
    insertSignal,
    deviceConnections,
    installedLocations,
    deviceAssignments,
    listOfFarmers,
    manNitrogen,
    manPhosphorous,
    manPotassium,
    deviceStatus,
    updateBatchStatus,
    deviceStatusCounts,
    listoffarms_admin,
    abnormalThresholdsCount,
    updatAbnormalThresholds,
    abnormalThresholds
}

