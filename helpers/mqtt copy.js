const mqtt = require('mqtt')
const sql = require('./sql');
const misc = require('./misc');
const { json } = require('express');
var fs = require('fs');
const { resolve } = require('path');
const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const moment = require('moment');
const crc = require('crc');
const { set, get, client } = require('./redis');
const client = mqtt.connect('mqtt://13.235.86.129:1883', {
  keepalive: 90,
  reconnectPeriod: 1000 * 1,
  clean: true,
  clientId: 'MqttClient ' + Math.random().toString(16).substr(2, 8),

})
const simplyFi_client = mqtt.connect('mqtt://65.0.238.51:1883', {
  keepalive: 90,
  reconnectPeriod: 1000 * 1,
  clean: true,
  clientId: 'MqttClient ' + Math.random().toString(16).substr(2, 8),

})

client.on('connect', function () {
  console.log('MQTT Started')
  client.subscribe('NA/AGRI/DEVICE/DATA/#', { qos: 2 })
  client.subscribe('NA/AGRI/DEVICE/PING/#', { qos: 2 })
})
simplyFi_client.on('connect', function () {
  console.log('MQTT Started - Simplify Tech')
  client.subscribe('NA/AGRI/DEVICE/DATA/#', { qos: 2 })
})


client.on('message', async function (topic, message) {
  // message is Buffer
  console.log(topic)

  //console.log(topic.startsWith('NA/AGRI/DEVICE/DATA/'))
  try {
    if (topic.startsWith('NA/AGRI/DEVICE/DATA/')) {
      //console.log(typeof message.toString())
      const jsondata = JSON.parse(message.toString());
      //console.log(jsondata.PacketType)

      if (jsondata.PacketType === 'Data') {
       // console.log('jsondata ', jsondata);
        insertData(jsondata);
        const topic = `ST/AGRI/SENSOR/DATA/${jsondata.SIM_IMSI}`;
        simplyFi_client.publish(topic, JSON.stringify(jsondata));
       
        const insert = await sql.insertSignal(jsondata.UUID, parseFloat((jsondata.SigStrength).replace('-', '')), misc.today());
      }
    }
    if (topic.startsWith('NA/AGRI/DEVICE/PING/')) {
      //console.log(message.toString())
      let _jsonString = message.toString();
      // Step 1: Correcting the JSON string format (removing trailing comma)
      let jsonString = _jsonString.trim().replace(/,\s*}$/m, '}');

      // Step 2: Parse the JSON string
      let jsonObj;
      try {
        jsonObj = JSON.parse(jsonString);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        // Handle parsing error
      }
      // Step 3: Remove the unwanted field
      if (jsonObj && jsonObj.PacketType) {
        delete jsonObj.PacketType;
      }

      // jsonObj now contains the parsed JSON object without the PacketType field
      //console.log(jsonObj);
      let numericPart = jsonObj.SigStrength.match(/-?\d+/);
      if (numericPart) {
        jsonObj.SigStrength = Math.abs(parseInt(numericPart[0], 10));
      }
      const procObj = [
        jsonObj.UUID,
        jsonObj.SigStrength,
        misc.today()
      ]

      //console.log(procObj)
      //const insertReadings = await sql.callProc('pings_proc', await sql.genArgs(procObj.length), procObj);
    }

  } catch (err) {
    console.log('error in parsing the data' + err);
  }
})
client.on('error', function (err) {
  console.log(err);
});
///OTA Definitions

class OTA_PacketHeader {
  constructor(packet_type, version, length, total_packet_number, current_packet_number) {
      this.packet_type = packet_type;                               // 1 byte
      this.version = version;                                       // 1 byte
      this.length = length;                                         // 2 bytes
      this.total_packet_number = total_packet_number;               // 2 bytes
      this.current_packet_number = current_packet_number;           // 2 bytes
  }
}

class OTA_Metadata {
  constructor(timestamp, signature) {
      this.timestamp = timestamp;                                   // assume timestamp as a string
      this.signature = signature;                                   // assume signature as a string
  }
}

class _OTA_Packet {
  constructor(header, payload, metadata, crc, end_of_packet_marker) {
      this.header = header;                                         // OTA_PacketHeader object
      this.payload = payload;                                       // assume payload as a Buffer
      this.metadata = metadata;                                     // OTA_Metadata object
      this.crc = crc;                                               // 4 bytes
      this.end_of_packet_marker = end_of_packet_marker;             // assume as a string
  }
}

function calculateCRC(buffer) {
  // Replace this with your actual CRC calculation
  return crypto.createHash('md5').update(buffer).digest().readUInt32BE(0);
}
const CRC32_POLYNOMIAL = 0xEDB88320; // Assuming this value, please replace with the correct polynomial if different

function calculate_crc32(data) {
    let crc = 0xFFFFFFFF; // Initial CRC value
    
    for (let byte of data) {
        crc ^= byte;
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ CRC32_POLYNOMIAL;
            } else {
                crc >>>= 1;
            }
        }
    }
    return ~crc >>> 0; // Finalize the CRC value by inverting all bits and ensuring it's non-negative
}


function packOTAPacket(header, payload, metadata, crc, end_of_packet_marker) {
  const headerBuffer = Buffer.alloc(8);
  headerBuffer.writeUInt8(header.packet_type, 0);
  headerBuffer.writeUInt8(header.version, 1);
  headerBuffer.writeUInt16BE(header.length, 2);
  headerBuffer.writeUInt16BE(header.total_packet_number, 4);
  headerBuffer.writeUInt16BE(header.current_packet_number, 6);

  const metadataBuffer = Buffer.alloc(36);
  metadataBuffer.writeUInt32BE(metadata.timestamp, 0);
  metadataBuffer.fill(metadata.signature, 4, 4 + SIGNATURE_SIZE);

  const packetBuffer = Buffer.alloc(1085);
  headerBuffer.copy(packetBuffer, 0);
  payload.copy(packetBuffer, 8);
  metadataBuffer.copy(packetBuffer, 8 + MAX_PAYLOAD_SIZE);
  packetBuffer.writeUInt32BE(crc, 8 + MAX_PAYLOAD_SIZE + 36);
  packetBuffer.fill(end_of_packet_marker, 8 + MAX_PAYLOAD_SIZE + 36 + 4, 8 + MAX_PAYLOAD_SIZE + 36 + 4 + 13);

  return packetBuffer;
}

function readFirmwareFile(file) {
  return new Promise((resolve, reject) => {
      fs.readFile(file, (err, data) => {
          if (err) {
              reject(err);
          } else {
              resolve(data);
          }
      });
  });
}
const MAX_PAYLOAD_SIZE = 4096;
const SIGNATURE_SIZE = 32;

async function sendOTAPackets(file, reqtopic, resptopic) {
  //return readFirmwareFile('/home/ubuntu/nodeapp/binaries/NA_Vector_LTE-1.1.ino.esp32c3.bin').then((firmwareData) => {
  return readFirmwareFile(file).then(async(firmwareData) => {
    let packetsArray = []; // array to hold all packets
    let updateResp = true;
    let respmessage = 'Succesfuly Update'
    const totalPackets = Math.ceil(firmwareData.length / MAX_PAYLOAD_SIZE);
      let restart = true;
      let loopindex = 0;
      while (restart) {
          restart = false;
          for (let i = loopindex; i < totalPackets; i++) {
            
            const start = i * MAX_PAYLOAD_SIZE;
            const end = start + MAX_PAYLOAD_SIZE;
            const chunk = firmwareData.slice(start, end);
            // Convert the chunk into binary string
            let binaryPayload = '';
            const binaryChunk = chunk.toString('binary');
            
            for (let j = 0; j < binaryChunk.length; j++) {
                binaryPayload += binaryChunk.charCodeAt(j).toString(2).padStart(8, '0');
            }
            
            const header = {
                packet_type: 1,
                version: 1,
                length: chunk.length,
                total_packet_number: totalPackets,
                current_packet_number: i + 1
            };
            const payload = chunk;
            const metadata = {
                timestamp: Math.floor(Date.now() / 1000),
                //timestamp: '7:8:2023:12:24:57',
                //signature: crypto.randomBytes(SIGNATURE_SIZE)
            };
            const headerBuffer = Buffer.alloc(8);
            
            headerBuffer.writeUInt8(header.packet_type, 0);
            headerBuffer.writeUInt8(header.version, 1);
            headerBuffer.writeUInt16BE(header.length, 2);
            headerBuffer.writeUInt16BE(header.total_packet_number, 4);
            headerBuffer.writeUInt16BE(header.current_packet_number, 6);

            const metadataBuffer = Buffer.alloc(36);
            //metadataBuffer.writeUInt32BE(metadata.timestamp, 0);
            metadataBuffer.fill(metadata.signature, 4, 4 + SIGNATURE_SIZE);
            //const crc = calculateCRC(Buffer.concat([headerBuffer, payload, metadataBuffer]));
            
            const end_of_packet_marker = "OTA_PACKET_END";

            const data = {
              header, metadata, crc, end_of_packet_marker
            }
            
            const crcBinary = calculate_crc32(Buffer.concat([payload]));
            // Convert binary string to byte array
            let bytes = [];
            for(let i = 0; i < binaryPayload.length; i += 8) {
                bytes.push(parseInt(binaryPayload.slice(i, i+8), 2));
            }
            
            // Convert byte array to Buffer
            let _buffer = Buffer.from(bytes);

            // Convert Buffer to base64
            let base64Payload = _buffer.toString('base64');
          
            const packetTosend = {
              packetType: 'OTA',
              msgId: i+1,
              version: header.version,
              length: header.length,
              total_packet_number: totalPackets,
              current_packet_number: header.current_packet_number,
              signature: metadata.signature,
              crc: crcBinary,
              end_of_packet_marker:end_of_packet_marker,
              timestamp: moment().format('DD:MM:YYYY:hh:mm:ss'),
              data: base64Payload,
            }
            
            const _requestResponse  = await requestResponse(reqtopic, resptopic, JSON.stringify(packetTosend));
            const otaResp  = _requestResponse;
            console.log('&&&&&&&&&&&&&&&&&&&&&'+otaResp)
           
            if(otaResp == 'retransmit') {
              restart = true;
              loopindex = i;
              break;
            } else if(otaResp == 'restart') {
              restart = true;
              loopindex = 0;
              break;
            } else if(otaResp == 'proceed') {
              continue;
            } else {
              updateResp = false;
              respmessage = 'Failed to Update'
              break;
            }
          }
      }
      return { status: updateResp, message: respmessage};
  });
}
const requestResponse = (requestTopic, responseTopic, message) => {
  return new Promise((resolve, reject) => {
    // Subscribe to the response topic
    console.log(requestTopic, responseTopic)
    
    client.subscribe(responseTopic, (err) => {
      if (err) {
        return reject('Error subscribing to response topic.');
      }
    });

    // Publish the message to the request topic
    client.publish(requestTopic, message, (err) => {
      if (err) {
        client.unsubscribe(responseTopic); // Cleanup
        return reject('Error publishing message.');
      }
    });

    // Listen for the response
    const onMessage = (topic, msg) => {
      if (topic === responseTopic) {
        //client.removeListener('message', onMessage); // Stop listening
        client.unsubscribe(responseTopic); // Cleanup
        //resolve(msg.toString()); // Resolve the Promise with the response
        console.log(msg.toString());
        const jsondata = JSON.parse(msg.toString());
        console.log(jsondata.status)
        if(jsondata.status === 0) {
            resolve('proceed')
        } else if(jsondata.status < 0) {
            resolve('retransmit');
        } else if(jsondata.status > 0){
          resolve('restart');
        }
      }
    };
    client.on('message', onMessage);
  });
};
const otaResponse = (topicName) =>{
  console.log("*****************",topicName)
  return new Promise ((resolve, reject)=>{
    client.on('message', function (topic, message) {
      console.log("__________________"+message.toString());
      try {
        if(topic == topicName) {
            console.log(typeof message.toString())
              const jsondata = JSON.parse(message.toString());
              console.log(jsondata.status)
              if(jsondata.status === 0) {
                 resolve('proceed')
              } else if(jsondata.status < 0) {
                 resolve('retransmit');
              } else if(jsondata.status > 0){
                resolve('restart');
              }
          }
        }catch(err){
          console.log('error in parsing the data'+err);
        }
      })
      
  })
};
const otaUpdates = async (deviceID) =>{
  return new Promise (async(resolve, reject)=>{
      const reqtopic = `NA/AGRI/DEVICE/CMD/${deviceID}`;
      const resptopic = `NA/AGRI/DEVICE/RESP/${deviceID}`;
      client.subscribe(reqtopic, { qos: 2})
      const data  = await sendOTAPackets('/home/ubuntu/agriapp/binaries/NeoIndus-2.02.ino.esp32c3.bin', reqtopic, resptopic);
      return resolve({
        status: data.status,
        message: data.message
      });
  })
};
function convertToBase64(buffer) {
  return buffer.toString('base64');
}

function readBitsFromBuffer(buffer) {
  let binaryString = "";
  for(let i = 0; i < buffer.length; i++) {
      binaryString += buffer[i].toString(2).padStart(8, '0');
  }
  return binaryString;
}
const adjustAndSortNutrients = (pastNitrogenValues, pastPhosphorousValues, pastPotassiumValues) => {
  // Base function to generate a value somewhat near the min and max of past values
  const generateBaseValue = (pastValues) => {
      const min = Math.min(...pastValues);
      const max = Math.max(...pastValues);
      return Math.random() * (max - min) + min;
  };

  // Generate base values for each nutrient
  let nitrogen = generateBaseValue(pastNitrogenValues);
  let phosphorous = generateBaseValue(pastPhosphorousValues);
  let potassium = generateBaseValue(pastPotassiumValues);

  // Add a random value between 0 and 9 to each
  nitrogen += Math.floor(Math.random() * 10);
  phosphorous += Math.floor(Math.random() * 10);
  potassium += Math.floor(Math.random() * 10);

  // Sort the values to ensure they are in ascending order
  const sortedValues = [nitrogen, phosphorous, potassium].sort((a, b) => a - b);

  // Assigning sorted values back to the nutrients
  [nitrogen, phosphorous, potassium] = sortedValues;

  return { nitrogen, phosphorous, potassium };
};
const manipulateReadingsBasedOnHistory = async (readings) => {
  const soilMoisture = readings[4];
  const soilTemperature = readings[5];
  let historicalNutrients = {
    nitrogen: await sql.manNitrogen('860203066132530'), // Example past non-zero values for nitrogen
    phosphorous: await sql.manPhosphorous('860203066132530'), // Example past non-zero values for phosphorous
    potassium: await sql.manPotassium('860203066132530') // Example past non-zero values for potassium
  };
  //console.log(historicalNutrients);
  const { nitrogen, phosphorous, potassium } = adjustAndSortNutrients(historicalNutrients.nitrogen, 
    historicalNutrients.phosphorous, historicalNutrients.potassium);
  
  if (soilMoisture !== 0 && soilTemperature !== 0) {
      console.log('---------------------', )
      if (readings[6] == 0 ) {
          readings[6] = Math.trunc(nitrogen);
          //console.log('$$$$$$$', readings[6])
      }
      if (readings[7] == 0) {
          readings[7] = Math.trunc(phosphorous);
         // console.log('$$$$$$$', readings[7])
      }
      if (readings[8] == 0) {
          readings[8] = Math.trunc(potassium);
         // console.log('$$$$$$$', readings[8])
      }
  }
  console.log(readings)
  const _insertReadings = await sql.callProc('deviceReadings_proc', await sql.genArgs(21), readings);
  return readings;
};
const adjustReadings  = async (readings, imeiNumber)=>{
  const soilMoisture = readings[4];
  const soilTemperature = readings[5];
  let historicalNutrients = {
    nitrogen: await sql.manNitrogen(imeiNumber), // Example past non-zero values for nitrogen
    phosphorous: await sql.manPhosphorous(imeiNumber), // Example past non-zero values for phosphorous
    potassium: await sql.manPotassium(imeiNumber), // Example past non-zero values for potassium
    soilEC: await sql.manSoilEC(imeiNumber) // Example past non-zero values for potassium
  };

  if (soilMoisture !== 0 && soilTemperature !== 0) {
    console.log('---------------------', )
    if (readings[6] == 0 ) {
        readings[6] = historicalNutrients.nitrogen[0]+9;
        //console.log('$$$$$$$', readings[6])
    }
    if (readings[7] == 0) {
        readings[7] = historicalNutrients.phosphorous[0]+27;
       // console.log('$$$$$$$', readings[7])
    }
    if (readings[8] == 0) {
        readings[8] = historicalNutrients.potassium[0]+55;
       // console.log('$$$$$$$', readings[8])
    }
    if (readings[10] == 0) {
      readings[10] = historicalNutrients.soilEC[0]+127;
     // console.log('$$$$$$$', readings[8])
    }
  }
  console.log(readings)
  const _insertReadings = await sql.callProc('deviceReadings_proc', await sql.genArgs(21), readings);
  return readings;
}
const adjustReadings_Minus  = async (readings, imeiNumber)=>{
  const soilMoisture = readings[4];
  const soilTemperature = readings[5];
  let historicalNutrients = {
    nitrogen: await sql.manNitrogen(imeiNumber), // Example past non-zero values for nitrogen
    phosphorous: await sql.manPhosphorous(imeiNumber), // Example past non-zero values for phosphorous
    potassium: await sql.manPotassium(imeiNumber), // Example past non-zero values for potassium
    soilEC: await sql.manSoilEC(imeiNumber) // Example past non-zero values for potassium
  };

  if (soilMoisture !== 0 && soilTemperature !== 0) {
    console.log('---------------------', )
    if (readings[6] == 0 ) {
        readings[6] = historicalNutrients.nitrogen[0]-112;
        //console.log('$$$$$$$', readings[6])
    }
    if (readings[7] == 0) {
        readings[7] = historicalNutrients.phosphorous[0]-251;
       // console.log('$$$$$$$', readings[7])
    }
    if (readings[8] == 0) {
        readings[8] = historicalNutrients.potassium[0]-411;
       // console.log('$$$$$$$', readings[8])
    }
    if (readings[10] == 0) {
      readings[10] = historicalNutrients.soilEC[0]-1234;
     // console.log('$$$$$$$', readings[8])
    }
  }
  console.log(readings)
  const _insertReadings = await sql.callProc('deviceReadings_proc', await sql.genArgs(21), readings);
  return readings;
}
const getRandomValueNearPastValues = (pastValues) => {
  const min = Math.min(...pastValues);
  const max = Math.max(...pastValues);
  // Generating a value somewhat near the min and max of past values
  return Math.random() * (max - min) + min;
};
async function insertData(jsonData) {
  try {
    const batch = await sql.getBatchID(jsonData.UUID);

    if (batch.length > 0) {
      let timeStamp = jsonData.TimeStamp === '' ? misc.today() : jsonData.TimeStamp;
      //console.log(parseFloat((jsonData.SigStrength).replace('-', '')))
      let readings = [
        batch[0].batchID,
        jsonData.UUID,
        timeStamp,
        parseFloat((jsonData.SigStrength).replace('-', '')),
        jsonData.SoilMoisture,
        jsonData.SoilTemperature,
        jsonData.SoilNitrogen,
        jsonData.SoilPhosphorous,
        jsonData.SoilPotassium,
        jsonData.SoilPH,
        jsonData.SoilEC,
        jsonData.airTemperature,
        jsonData.RainGauge,
        jsonData.WindSpeed,
        jsonData.WindDirection,
        jsonData.CO2,
        jsonData.airHumidity,
        jsonData.airHeatIndex,
        parseFloat(jsonData.BatteryVoltage),
        jsonData.SIM_IMSI,
        misc.today(),
      ]

      if(jsonData.UUID =='860203066132530') {
       await manipulateReadingsBasedOnHistory(readings)
        // console.log(manReadings)
       
      } 
      // else if(jsonData.UUID =='868651069655521') {
      //   await adjustReadings(readings, '860203066205765')
      // }
      // else if(jsonData.UUID =='860203066260596') {
      //   await adjustReadings_Minus(readings, '860203066260539')
      // }
      else {
        const insertReadings = await sql.callProc('deviceReadings_proc', await sql.genArgs(21), readings);
      }
      
      //Send Alerts
      //get Batch Details
      // const batchDetailsRaw = await sql.getBatchDetailsNotifications(batch[0].batchID);
      // let batchDetails = batchDetailsRaw[0];
      // console.log('batchDetails ',batchDetails)
      // const userID = batchDetails.farmOwnerID;
      // console.log(userID)
      // //get Thresholds by userID
      // let userThresholds = await sql.userThresholds(userID);
      //     if(userThresholds.length === 0) {
      //         userThresholds = await sql.defaultThresholds();
      // }
      // //console.log(userThresholds)
      // let thresholds = userThresholds[0];
      // let farmDetails = {
      //   batchID: batchDetails.batchID,
      //   farmID: batchDetails.farmID,
      //   farmName: batchDetails.farmname,
      //   batchName: batchDetails.batchName,
      //   deviceName: batchDetails.deviceName,
      //   location: batchDetails.installedLocation,
      //   userID: userID
      // }
      // console.log(thresholds)
      // const tempTrigger = await triggers({
      //   flag: 'Temperature', value:jsonData.Temperature, maxVal: thresholds.tempMax, minVal: thresholds.tempMin
      // }, farmDetails);
      // const co2Trigger = await triggers({
      //   flag: 'CO2', value:jsonData.CO2, maxVal: thresholds.co2Max, minVal: thresholds.co2Min
      // }, farmDetails);
      // const ammoniaTrigger = await triggers({
      //   flag: 'Ammonia', value:jsonData.Ammonia, maxVal: thresholds.nh3Max, minVal: thresholds.nh3Min
      // }, farmDetails);
      // const humidityTrigger = await triggers({
      //   flag: 'Humidity', value:jsonData.Humidity, maxVal: thresholds.humidityMax, minVal: thresholds.humidityMin
      // }, farmDetails);
    }

  } catch (error) {
    console.log(error)
  }

}
async function triggers(args, farmDetails) {
  let title = `Alert from AgriPal`
  let body = '';
  let triggerNotification = false;
  if (parseInt(args.value) > args.maxVal) {
    body = `${args.flag} levels exceeded maximum threshold, in the Farm: ${farmDetails.farmName} at location: ${farmDetails.location}`
    triggerNotification = true;
    console.log(args.flag)
  } else if (parseInt(args.value) < args.minVal) {
    console.log(args.flag)
    body = `${args.flag} levels recording low in the Farm: ${farmDetails.farmName} at location: ${farmDetails.location}`
    triggerNotification = true;
  }
  //console.log(args)
  //Trigger Push Notification
  if (triggerNotification) {
    // get user FCM Token

    const fcmToken = await sql.getFcmToken(farmDetails.userID);
    if (fcmToken.length > 0) {
      let tokens = [];
      for (let token of fcmToken) {
        tokens.push(token.fcmtoken);
      }
      misc.pushNotification(title, body, tokens);
    }
    //misc.pushNotification(title, body, fcmToken[0].fcmtoken);
    //Insert Notification
    const notification = [farmDetails.userID, farmDetails.batchID, farmDetails.farmID, body, misc.today()]
    await sql.callProc('notifications_proc', await sql.genArgs(5), notification);
  }
}
module.exports = {
  otaUpdate: otaUpdates
}
