import mongoose from "mongoose";
import passportLocalMongoose from 'passport-local-mongoose'


const userSchema=new mongoose.Schema(
    {
    avatar:{
        publicId: {
            type: String,
            required: true,
        },
        url: {
            type: String, //cloudinary url
            required: true,
        }
    },
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase: true,
        trim: true, 
        index: true
    },

    email:{
        type:String,
        required:true,
        unique:true,
        lowecase: true,
        trim: true,
    },

    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],

    photoView:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Photo"
        }
    ],

    password:{
        type:String,
    }
}
,{ timestamps: true }
)

userSchema.plugin(passportLocalMongoose);

export const User =mongoose.model("User",userSchema);