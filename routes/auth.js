const express = require('express');
const passport = require('passport');

const router = express.Router();

// @desc Auth with Google
// @route GET /auth/google
router.get('/google',passport.authenticate('google',{scope:['profile']}));

// @desc Google auth callback
// @route GET /auth/google/callback
router.get('/google/callback',
    passport.authenticate('google',{failureRedirect:'/'}),
    (req,res)=>{
        res.redirect('/dashboard');
    }
)

// @desc Auth with Facebook
// @route GET /auth/facebook
router.get('/facebook',passport.authenticate('facebook',{scope:['public_profile','email']}));


// @desc Facebook auth callback
// &route GET /auth/facebook/callback
router.get('/facebook/callback',
    passport.authenticate('facebook',{failureRedirect:'/'}),
    (req,res)=>{
        //Successful authentication, redirect to dashboard
        res.redirect('/dashboard');
    }
)

// @desc Login with username & passport
// @route POST /auth/login
router.post('/login',
    passport.authenticate('local',{failureRedirect:'/'}),
    (req,res)=>{
        res.redirect('/dashboard');
    }
)


// @desc Logout user
// @route /auth/logout
router.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/');
})

module.exports = router;