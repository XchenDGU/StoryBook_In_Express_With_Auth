const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;
const crypto = require('crypto');
const Token = require('./Token');


const UserSchema = new mongoose.Schema({
    thirdPartyId:{
        type:String,
        
    },
    email:{
        type:String,
        lowercase:true,
    },
    password:{
        type:String
    },
    displayName:{
        type:String,
        required:true,
    },
    firstName:{
        type:String,
        
    },
    lastName:{
        type:String,
    
    },
    image:{
        type:String
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    resetPasswordToken:{
        type:String,
        required:false,
    },
    resetPasswordExpires:{
        type:Date,
        required:false,
    }
});
UserSchema.pre('save',function(next){
    var user = this;
    //only hash the password if it has been modifited(or is new)
    if(!user.isModified('password') || user.password === '') return next();

    //generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR,function(err,salt){
        if(err) return next(err);

        //hash the password uusing our new salt
        bcrypt.hash(user.password,salt,function(err,hash){
            if(err) return next(err);

            //override the cleartext password with the hashed one
            user.password = hash;
            next();
        })
    })

});

UserSchema.methods.comparePassword = async function(candidatePassword){
    try {
        const match = await bcrypt.compare(candidatePassword,this.password);
        //console.log('match:',match);
        return match;
    } catch (err) {
        console.error(err);
    }
    
}

UserSchema.methods.generatePasswordReset = function(){
    this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordExpires = Date.now() + 3600000; //expires in an hour
}

UserSchema.methods.generateVerificationToken = function(){
    let payload = {
        token:crypto.randomBytes(20).toString('hex'),
        userId:this._id,
    };
    //console.log(payload);
    return new Token(payload);
}


module.exports = mongoose.model('User',UserSchema);