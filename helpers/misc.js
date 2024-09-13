const bcrypt = require('bcrypt');;
const saltRounds = 10;
require('dotenv').config();
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const moment = require('moment-timezone');
const sql = require('./sql');
const axios = require('axios').default;

const hash = (plainText) => {
  return new Promise(async (resolve, reject) => {
    await bcrypt.genSalt(saltRounds, function (err, salt) {
      bcrypt.hash(plainText, salt, function (err, hash) {
        if (err) {
          return reject('Error in generating hash');
        }
        else {
          return resolve(hash);
        }

      });
    });
  })
};
const comparehash = (plainText, hash) => {
  return new Promise(async (resolve, reject) => {
    bcrypt.compare(plainText, hash, function (err, result) {
      if (err) {
        return reject('Incorrect Password');
      }
      else {
        return resolve(result);
      }
    });
  })
};
const authenticateToken = (req, res, next) => {
  // Gather the jwt access token from the request header
  // console.log(req.headers.authorization)
  const authHeader = req.headers.authorization;

  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.status(401).send({
    status: false,
    message: "Unautorized Access"
  }) // if there isn't any token

  jwt.verify(token, process.env.JWT_PWD, (err, user) => {
    console.log(err)
    if (err) return res.status(403).send({
      status: false,
      message: "Forbidden"
    })
    req.user = user.userDetails;

    next();
  })
}
const email = (toAddresses, subject, body) => {
  return new Promise(async (resolve, reject) => {
    console.log("----" + toAddresses);

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'thej.bitta@neoaura.com',
        pass: 'yojx levt fszp zkeo',
      },
    });

    let info = await transporter.sendMail({
      from: '"Neo Indus" <thej.bitta@neoaura.com>', // sender address
      to: toAddresses.join(", "), // list of receivers
      subject: subject, // Subject line
      html: body, // html body
    });


    console.log("Message sent: %s", info.messageId);
    if (info.messageId) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      return resolve(true);
    } else {
      return reject(false);
    }
  });
};


const pushNotification = (title, body, _tokens) => {
  return new Promise(async (resolve, reject) => {

    const tokens = [..._tokens];
    let data = {
      notification: {
        title: title,
        body: body,
        click_action: "notifications",
        bigPictureUrl: "https://digiterrain.live/dist/img/AdminLTELogo.png"
      },
      registration_ids: tokens
    }
    axios.post('https://fcm.googleapis.com/fcm/send', data, {
      headers: {
        Authorization: 'key=AAAAUKj_NKc:APA91bGIC_832vpGVy_5f6b6K3CeALTzMd8D2fUc4wDteovlXTxfeb8zmAJcAvQKaOSpT3EpRCzQEyw5iDkyS242DigFLMh8mUJLtKcFU7YFm55472H8StVJjvxW_WsCPBcrqtTsrcnR'
      }
    })
      .then(function (response) {
        //console.log(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
    resolve(true);
  })
};
const currentTime = () => {
  return moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:s")
}
module.exports = {
  hash,
  comparehash,
  authenticateToken,
  email,
  //notifications,
  //insertNotifications,
  //sendEmailAlert,
  pushNotification,
  today: currentTime
}