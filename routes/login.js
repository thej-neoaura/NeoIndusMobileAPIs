var express = require('express');
var router = express.Router();
const moment = require("moment-timezone");
const { body, validationResult } = require('express-validator');
const sql = require('../helpers/sql');
const misc = require('../helpers/misc');
require('dotenv').config();
var jwt = require('jsonwebtoken');

const validationRules = () => {
    return [
        body('userName').not().isEmpty().isLength({ min: 3 }).withMessage('Name is required and should be min of 3 chars length'),
        body('password').not().isEmpty().isLength({ min: 5 }).withMessage('Password is required and should be min of 5 chars length'),
    ]
  }
router.post('/',[validationRules()] ,async function(req, res, next) {
  try {
    //userName and password check
    
    const userDetails = await sql.getPWD(req.body.username);
    if(req.body.loginType === 'APP') {
        const compare = await misc.comparehash(req.body.password, userDetails[0].password);
        if(!compare) {
            res.send({
                status: false,
                message: "Incorrect Username or Password",
            })
            return;
        }
        if(userDetails[0].status==="INACTIVE") {
            res.send({
                status: false,
                message: "Your Account is inactive, please contact your administrator",
            })
            return;
        }
        delete userDetails[0].password;
    }
    
    const token = jwt.sign({userDetails: userDetails[0]}, process.env.JWT_PWD, { expiresIn: '500h' });
    
    const fcmtoken = await sql.getFcmToken(userDetails[0].userID);
    
    res.status(200).send({
        status: true,
        message: "Successfully loggedin",
        token: token,
        userDetails,
        fcmtoken
        // browserDetails
    })
  } catch (error) {
      console.log(error);
      let msg= error;
      if(typeof msg === 'object') {
          msg = error.message; 
        }
      res.send({
          status: false,
          message: msg,
      })
  }
});

module.exports = router;