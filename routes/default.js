const { ensureGuest } = require('../middleware/auth');

const router = require('express').Router();


router.get('/',(req,res)=>{
    if(req.isAuthenticated()){
        res.redirect('/dashboard');
    }else{
        res.redirect('/')
    }
})

module.exports = router;