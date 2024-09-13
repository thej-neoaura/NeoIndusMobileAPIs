var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const { v4: uuidv4 } = require('uuid');

router.post('/', async function(req, res, next) {
    try {
       
        const userID = req.user.userID;
        const fcmTokenStatus = await sql.fcmTokenStatus(userID, req.body.fcmtoken);

        console.log('Body', req.body)
        const token = req.body.fcmtoken;

        if(fcmTokenStatus == 0) {
            const proc_values = [
                userID,
                token,
                misc.today(),
                misc.today()
            ];
            console.log('Proc', proc_values);
            await sql.callProc('fcmtokens', await sql.genArgs(4), proc_values);
        }
        // } else {
        //     console.log("token", token)
        //     const updateToken = await sql.updateFcmToken(token, misc.today(), userID);
        //     if(!updateToken) {
        //         console.log('Could not update token');
        //         res.status(200).send({
        //             status: true,
        //             message: "Could not update token"
        //         }) 
        //         return;
        //     }
        // }
        res.status(200).send({
            status: true,
            message: "Successfully added token:"
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