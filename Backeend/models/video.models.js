import mongoose from "mongoose";

const videoSchema=new mongoose.Schema(
    {
    video:{
        publicId: {
            type: String,
            required: true,
        },
        url: {
            type: String, //cloudinary url
            required: true,
        }
    },
    thumbnail:{
        publicId: {
            type: String,
            required: true,
        },
        url: {
            type: String, //cloudinary url
            required: true,
        }
    },

    title:{
        type:String,
        required:true
    },

    description:{
        type:String,
        required:true
    },

    duration:{
        type:Number,
        required:true,
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

},
{ timestamps: true }
)


export const Video=mongoose.model("Video",videoSchema);