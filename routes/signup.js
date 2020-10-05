const express = require('express');
const router = express.Router();
const {ensureGuest} = require('../middleware/auth');
const Token = require('../models/Token');
const User = require('../models/User');
const {sendEmail} = require('../util/sendEmail');

const {body,validationResult} = require('express-validator/check') 
const { sanitizeBody } = require('express-validator/filter');

function renderView(res,path,options,layout='login'){
    return res.render(path,{
        ...options,
        layout,
    })
}

// @desc Render email verification view
// @route GET /signup/verify
router.get('/verifyemail/:userId',async (req,res)=>{
    const user = await User.findById(req.params.userId);
    if(!user || user.isVerified){
        return res.render('error/404');
    }

    return renderView(res,'register/verifyEmail',{
        userId:req.params.userId,
    })
    
});

/*
// @desc Render verification success view
// @route GET /signup/success
router.get('/success',ensureGuest,(req,res)=>{
    res.render('register/verifySuccess',{
        layout:'login',
    });
});
*/

// @desc Sign up
// @route POST /signup
router.post('/',ensureGuest,[
    body('email').isEmail().withMessage('Email format invalid.'),
    body('password').isLength({min:8,max:16}).withMessage('Password format invalid'),
    body('name').isLength({min:1}).trim().withMessage('Name empty.')
],async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return renderView(res,'register/signup',{
            error_msg:'Form invalid'
        });
    }

    try {
        findUser = await User.findOne({email:req.body.email});
        if(findUser){
            return renderView(res,'register/signup',{
                error_msg:'This email exists already.'
            })
        }
        const newUser = new User({
            email:req.body.email,
            displayName:req.body.name,
            password:req.body.password,
            thirdPartyId:'',
            firstName:'',
            lastName:'',
            image:'',
        });

        const user_ = await newUser.save();

        await sendVerificationEmail(user_,req,res);
        return res.redirect('/signup/verifyemail/'+ user_._id);

    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
}  
)

// @desc Verify token (confirm the email)
// @route GET /signup/verify/:token
router.get('/verify/:token',ensureGuest,async (req,res)=>{
    
    if(!req.params.token){
        //console.log('url does not have a token');
        res.render('error/404');
    } 
    try {
        const token = await Token.findOne({token:req.params.token});
        if(!token){
            //console.log('Unable to find a valid token');
            return res.render('error/404');
        } 
        
        await User.findOne({_id:token.userId},(err,user)=>{
            if(err) throw err;
            if(!user || user.isVerified){
                //console.log('Unable to find a valid user for this token')
                return res.render('error/404');
            }

            //verify and save the user
            user.isVerified = true;
            user.save(function(err){
                if(err){
                    console.log('internal error')
                }
                //console.log('account has been verified.');
                res.render('register/verifySuccess');
            })

        })

    } catch (err) {
        console.log(err);
        res.render('error/500');
    }
})


// @desc Resend Verification Token
// @route POST /signup/resend
router.post('/resend',ensureGuest,async (req,res)=>{
    try {
        const {userId} = req.body;
        if(!userId){
            return res.render('error/404');
        }

        const user = await User.findById(userId);

        if(!user){
            //console.log("user doesn't exist")
            return res.render('error/404')
        } 

        if(user.isVerified) {
            //console.log("user's email is confirmed already")
            return renderView(res,'register/verifyEmail',{
                error_msg:"This account has already been verified"
            })
        }

        await sendVerificationEmail(user,req,res);
        return renderView(res,'register/verifyEmail',{
            success_msg:"Email re-sent!"
        });
    } catch (err) {
        console.log(err);
        return res.render('error/500')
    }


}
)


// @desc send verification email to the just-registered user
async function sendVerificationEmail(user,req,res){
    try {
        const token = user.generateVerificationToken();
        
        //Save the verification token
        //console.log(token);
        await token.save();

        let subject = "Account Verification";
        let to = user.email;
        let from = process.env.FROM_EMAIL;
        let link = "http://"+req.headers.host+"/signup/verify/"+token.token;
        //console.log(link);
        let html = `<p>Hi ${user.displayName}</p>
                    <br>
                    <p>Please click on the following <a href="${link}">link</a> to verify your account.</p> 
                    <br>
                    <p>If you did not request this, please ignore this email.</p>`;
        console.log(html);
        await sendEmail({to,from,subject,html});
    

        }catch (err) {
            console.error(err);
            res.render('error/500');
    }
}

module.exports = router;