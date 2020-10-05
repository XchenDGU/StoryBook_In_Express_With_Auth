const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport){
    passport.use(new GoogleStrategy({
        clientID:process.env.GOOGLE_CLIENT_ID,
        clientSecret:process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:'/auth/google/callback'
    },
    async(accessToken,refreshToken,profile,done)=>{
        console.log(profile);
        
        const newUser = {
            thirdPartyId:profile.id,
            displayName:profile.displayName,
            firstName:profile.name.givenName,
            lastName:profile.name.familyName,
            image:profile.photos[0].value,
            email:'',
            password:'',
        };
        try {
            let user = await User.findOne({thirdPartyId:profile.id});
            if(user){
                done(null,user);
            }else{
                user = await User.create(newUser);
                done(null,user);
            }
        } catch (err) {
            console.error(err);
        }
    }))

    passport.serializeUser((user, done)=> {
        done(null, user.id);
      });
      
    passport.deserializeUser((id, done) =>{
        User.findById(id, (err, user)=>done(err, user))
    });


    passport.use(new FacebookStrategy({
        clientID:process.env.FACEBOOK_CLIENT_ID,
        clientSecret:process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL:'/auth/facebook/callback'
    },
    async(accessToken,refreshToken,profile,done)=>{
        
        const newUser = {
            thirdPartyId:profile.id,
            displayName:profile.displayName,
            firstName:'',
            lastName:'',
            image:'',
            email:'',
            password:'',
        };
        try {
            let user = await User.findOne({thirdPartyId:profile.id});
            if(user){
                done(null,user);
            }else{
                user = await User.create(newUser);
                done(null,user);
            }
        } catch (err) {
            console.error(err);
        }
    }
    )),

    passport.use('local',new LocalStrategy(
        async(username,password,done)=>{
            await User.findOne({email:username.toLocaleLowerCase()},async (err,user)=>{
                if(err){
                    console.log(err);
                    return done(err);
                }
                if(!user){
                    return done(null,false)
                }
                if(! await user.comparePassword(password) || !user.isVerified){
                    return done(null,false);
                }
                return done(null,user);
            })
        }
    ))

}