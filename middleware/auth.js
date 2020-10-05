module.exports = {
    //Not login, redirect to homepage/login page
    ensureAuth:function(req,res,next){
        if(req.isAuthenticated()){
            return next();
        }else{
            res.redirect('/');
        }
    },
    //If is already login, redirect to dashboard.
    ensureGuest:function(req,res,next){
        if(req.isAuthenticated()){
            res.redirect('/dashboard');
        }else{
            return next();
        }
    }
}