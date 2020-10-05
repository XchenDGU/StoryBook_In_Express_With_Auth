const express = require('express');
const router = express.Router();
const {ensureAuth} = require('../middleware/auth');

const Comment = require('../models/Comment');

// @desc Add Comment
// @route Post /comments
router.post('/:storyId',ensureAuth,(req,res)=>{
    try {
        req.body.user = req.user.id;
        req.body.story = req.params.storyId;
        await Comment.create(req.body);
        
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
})

