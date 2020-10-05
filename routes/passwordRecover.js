const express = require('express');
const User = require('../models/User');
const {sendEmail} = require('../util/sendEmail');
const {ensureAuth,ensureGuest} = require('../middleware/auth');
//const { send } = require('@sendgrid/mail');
const router = express.Router();

// @desc Password reset view
// @route GET /passwordrecover
router.get('/',ensureGuest,(req,res)=>{
    res.render('passwordRecover/index',{
        layout:'login',
    });
});


/*
// @desc Verify view
// @route GET /passwordrecover/verify
router.get('/verify',ensureGuest,(req,res)=>{
    res.render('passwordRecover/verify',{
        layout:'login'
    })
})
*/


// @desc Recover Password - Generates token and sends password reset email
// @route Post /passwordrecover
router.post('/',ensureGuest,async (req,res)=>{
    try {
        const {email} = req.body;
        const user =await User.findOne({email:email});

        if(!user){
            res.render('passwordRecover/index',{
                layout:'login',
                error_msg:"This email doesn't exist."
            });
        }
        
        //Generate and set password reset token
        user.generatePasswordReset();
        await user.save();

        //send email
        let subject = "Password change request";
        let to = user.email;
        let from = process.env.FROM_EMAIL;
        let link = "http://" + req.headers.host + "/passwordrecover/reset/"+user.resetPasswordToken;
        let html = `<p>Hi ${user.displayName}</p>
                    <p>Please click on the following <a href="${link}">link</a> to reset your password.</p>
                    <p>If you did not request this, please ignore this email and your password will remain the same</p>`
        await sendEmail({to,from,subject,html})
        //console.log('email has been sent to ',to);
        res.render('passwordRecover/index',{
            layout:'login',
            success_msg:"Check your email for instruction to recover password"
        });

    } catch (error) {
        console.log(error);
        res.render('error/500');
    }
})


// @route POST passwordrecover/reset/:token
// @desc Rest Password - Validate password reset token and shows the password reset view
router.get('/reset/:token',ensureGuest,async (req,res)=>{
    try {
        const token = req.params.token;

        const user = await User.findOne({resetPasswordToken:token,resetPasswordExpires:{$gt:Date.now()}});

        if(!user){
            res.render('error/404');
        }

        res.render('passwordRecover/reset',{
            layout:'login',
            token:token,
        });
    } catch (err) {
        console.error(err);
    }
})



// @route POST passwordrecover/reset/update
// @desc verify the password reset token and update the password
router.post('/reset/update',ensureGuest,async (req,res)=>{
    try {
        const {token} = req.body;
        const user = await User.findOne({resetPasswordToken:token,
                            resetPasswordExpires:{$gt:Date.now()}}); //expire time is > now.

        if(!user){
            console.log('user not found!');
            return res.render('error/404');
        }

        //Set the new passowrd
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.isVerified = true;

        await user.save();

        let subject = "Your password has been changed";
        let to = user.email;
        let from =  process.env.FROM_EMAIL;
        let html = `<p>Hi ${user.displayName}</p>
                    <p>This is a confirmation that the password for your account ${user.email} has just been changed.</p>`

        await sendEmail({to,from,subject,html});
        //console.log('Your password has been updated!');
        res.render('passwordRecover/resetSuccess');
    
    } catch (err) {
        console.error(err);
        res.render('error/500')
    }
})

module.exports = router;