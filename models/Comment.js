const { text } = require('express');
const mongoose = require('mongoose');

const CommentSchema = mongoose.Schema({
    content:{
        type:String,
        required:true,
    },
    story:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Story'
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    meta:{
        likes:Number,
        dislike:Number,
    }
})

module.exports = mongoose.model('Comment',CommentSchema);