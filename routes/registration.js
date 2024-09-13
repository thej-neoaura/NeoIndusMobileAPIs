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
        
        const today = misc.today;
        const loginType= req.body.loginType;
        console.log(today)
        // Email Duplicate Check,
        let insert = true;
        let hashPassword = ''
        //Phone Number Duplicate Check
        if(loginType === 'APP') {
            const emailIDCheck  = await sql.emailIDCheck(req.body.email)
            console.log(emailIDCheck)
            if(emailIDCheck > 0) {
                console.log('error')
                res.status(200).send({
                    status: false,
                    message: "Email ID already exists"
                }) 
                return;
            }
            const phoneNumberCheck  = await sql.phoneNumberCheck(req.body.phoneNumber)
        
            if(phoneNumberCheck.length > 0) {
                res.status(200).send({
                    status: false,
                    message: "Phone Number already exists"
                }) 
                return;
            }
            hashPassword = await misc.hash(req.body.password);
        } else if(loginType === 'Google') {
            //check if the user exists
            const userCount = await sql.userExists(req.body.email);
            if(userCount > 0) {
                insert = false;
            }
        }
        if(!insert) { res.status(200).send({status: true}); return; } 
        const adduser_proc_values = [
            'Farmer',
            hashPassword,
            req.body.name,
            req.body.email,
            req.body.phoneNumber,
            req.body.city,
            req.body.state,
            req.body.country,
            'ACTIVE',
            req.body.email,
            misc.today(),
            req.body.emailID,
            misc.today(),
            req.body.loginType
        ];
       console.log(adduser_proc_values);
        await sql.callProc('appusers_proc', await sql.genArgs(14), adduser_proc_values);
        
        res.status(200).send({
            status: true,
            message: "Successfully Registered"
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