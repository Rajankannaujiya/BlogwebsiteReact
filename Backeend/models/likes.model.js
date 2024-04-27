import mongoose from "mongoose";


const likeSchema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },

    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },

    photo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photo"
    },

    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
}, {timestamps: true})


export const Like = mongoose.model("Like", likeSchema)