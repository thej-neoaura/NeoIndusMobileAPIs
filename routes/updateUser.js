  
var express = require('express');
var router = express.Router();
const sql = require('../helpers/sql');
const misc = require('../helpers/misc')
const validationRules = () => {
    return [
        // body('name').not().isEmpty().isLength({ min: 3 }).withMessage('Name is required and should be min of 3 chars length'),
        // body('password').not().isEmpty().isLength({ min: 5 }).withMessage('Password is required and should be min of 5 chars length'),
        // body('phoneNumber').not().isEmpty().isNumeric().withMessage('Phone Number is required and should be a number'),
        // body('emailID').not().isEmpty().isEmail().withMessage('Email is required'),
        // body('city').not().isEmpty().withMessage('City is required'),
        // body('state').not().isEmpty().withMessage('State is required'),
        // body('country').not().isEmpty().withMessage('Country is required'),
    ]
  }

  router.post('/',[validationRules()], async function(req, res, next) {
    try {
        
        const today = misc.today();
        console.log(today)
        
        const phoneNumberCheck  = await sql.phoneNumberCheck(req.body.phoneNumber)
       
        if(phoneNumberCheck.length > 0) {
            
            if(phoneNumberCheck[0].userID  !== req.user.userID) {
                res.status(200).send({
                    status: false,
                    message: "Phone Number already exists"
                }) 
                return;
            }
        }
        // Update Query
        const update = await sql.updateUser(
            req.body.name,
            req.body.phoneNumber,
            req.body.city,
            req.body.state,
            req.body.country,
            req.user.email,
            misc.today(),
            req.user.userID
        )
        if(update) {
            res.status(200).send({
                status: true,
                message: "Successfully updated user profile"
            })   
        } else {
            res.status(200).send({
                status: false,
                message: "Failed to Update"
            })   
        }
         
      
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