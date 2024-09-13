var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const { v4: uuidv4 } = require('uuid');

router.post('/', async function(req, res, next) {
    try {
        
        const createdBy = req.user.userID;
        
        const notify = misc.pushNotification('');
        
       console.log(notify)
       
        res.status(200).send({
            status: true,
            message: "Successfully added batch: "
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