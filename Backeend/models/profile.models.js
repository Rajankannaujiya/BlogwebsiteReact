import mongoose from "mongoose";
import { User } from "./user.models";

const userProfileInfo=new mongoose.model(
    {
        photoUrl:{
            type:String,
        },

        uploadedBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },

        NumberOfVideos:{
            type:Number,
            required:true
        }
    }
)

export const Profile=mongoose.model("Profile",userProfileInfo);