import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
    {
        comment:{
            type:String,
            required:true
        },

        video:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Video'
        },

        photo:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Photo'
        },

        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    }
)

export const Comment = mongoose.model("Comment",CommentSchema)