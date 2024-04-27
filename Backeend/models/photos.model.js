import mongoose, { mongo } from 'mongoose';


const photoSchema=new mongoose.Schema(
    {
        photo:{
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

        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
        }
    },{timestamps:true}
)

export const Photo = mongoose.model("Photo", photoSchema)