
import asyncHandlerr from "express-async-handler";
import { User } from "../models/user.models.js";
import {Photo} from "../models/photos.model.js";
import { Comment } from "../models/comment.models.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utilits/cloudinary.js";
import mongoose from "mongoose";
import { Like } from "../models/likes.modeel.js";



const uploadPhoto = asyncHandlerr(async(req, res)=>{
    try {
        const {title,description} = req.body;
        var photo;
  
      const photoPath = req.file?.photoPath?.[0]?.path;

      if(!photoPath || !title || !description){
        throw new Error("photo, title and description are required");
      }

     try {
         photo = await uploadOnCloudinary(photoPath);
   
         console.log("this is the photo you uploaded",photo)
     } catch (error) {
        console.log("an error has been occured while uploading the photo on cloudinary");
        throw new Error("an error has been occured while uploading the photo")
     }

     const photoDetails= await Photo.create({
        photo:{publicId:photo?.public_id, url:photo?.url},
        title:title,
        description:description,
        owner:req.user?._id
     })



    } catch (error) {
        console.log("an error has been occured while uploading the photo", error);
        throw new Error("an error has been occured while uploading the video.")
    }
})


const getAllPhoto = asyncHandlerr(async(req,res)=>{
    try {
        const {photoId} = req.params;

        if(!photoId)
        {
            throw new Error("photoId is not provide");
        }

        const user = await User.findById(req.user?._id, {photoView :1})

        if(!user?.photoView.includes(photoId)){
            await Photo.findByIdAndUpdate(
                photoId,
                {
                    $inc: {
                        photoViews:1
                    }
                },
                {
                    new:true
                }
            )
        }


        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $addToSet:{
                    photoView:photoId
                }
            },
            {
                new:true
            }
        )


        const photoDetails = await Photo.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(photoId)
                }
            },
            {
                $lookup: {
                    from:'users',
                    localField:'woner',
                    foreignField:'_id',
                    as:"owner",
                    pipeline: [
                        {
                            $project: {
                                username:1,
                                email:1,
                                avatar:"$avatar.url",
                                _id:1
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
            },

            {
                $sort:{
                    createdAt: -1,
                }
            }
        ])


        if(!photoDetails){
            throw new Error("photo not found")
        }

    //   for sending the photos

    const options = {
        page,
        limit,
        customLabels: {
            totalDocs: "totalVideos",
            docs: "videos",

        },
        skip: (page - 1) * limit,
        limit: parseInt(limit),
    }


    Video.aggregatePaginate(photoDetails, options)
    .then(result => {
        // console.log("first")
        if (result?.photos?.length === 0) {
            return res.status(200).json({message:"No photos found"})
        }

        return res.status(200)
            .json(
                {
                    message:"photos fetched successfully"
                },
                {
                    result
                }
            )
    }).catch(error => {
        console.log("error in the phto fetching ::", error)
        throw new Error(error?.message || "Internal server error in photos aggregate Paginate")
    })

    } catch (error) {
        console.log("an error has been occured while getting uploaded video")
    }
})


const deletePhoto = asyncHandlerr(async(req,res)=>{
    try {
        const {photoId} = req.params;
        const user =req.user?._id;
        if(!photoId){
            throw new Error("photoId is required")
        }

        const foundPhoto = await Photo.findById(photoId,{photo:1});

        if(!foundPhoto){
            throw new Error ("photo to be deleted is not found");
        }

        // deleting photo from the cloudinary
        const deletePhoto = await deleteOnCloudinary(foundPhoto?.photo?.url,  foundPhoto?.photo?.publicId)
        console.log("photo has been deleted", deletePhoto);

        // deleting photo from the database
        await Photo.findByIdAndDelete(photoId);

        // deleting photo from the related databases
        const updatePromises =[
        User.updateMany({photoView:photoId}, {$pull:{photoView:photoId}}),
        Comment.deleteMany({photo:photoId}),
        Like.deleteMany({photo:photoId})
        ]

        console.log("this is the upadate promis of photodelete", updatePromises)

        await Promise.all(updatePromises).then((value)=>{
            console.log("thiss is the value of resolved promise",value)
        });
    } catch (error) {
        console.log("an error has been occured while deleting the photo");
        throw new Error("error has been occurred while deleting the photo")
    }
})


const getAPhotoById = asyncHandlerr(async(req,res)=>{
    const {photoId} = req.params;

    if(!photoId){
        throw new Error("photo id is required");
    }

    const foundPhoto = await Photo.findById(photoId);


    if(!foundPhoto){
        console.log("photo is not found");
        throw new Error("photo you are looking for is not found")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{photoView:1});

    if(!user?.photoView.includes(photoId)){
        await Photo.findByIdAndUpdate(
            photoId,
            {
                $inc: {
                    views:1
                }
            },
            {
                new: true
            }
        )
    }


    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $addToSet: {
                photoView : videoId
            }
        },
        {
            new: true
        }
    )


    const photo = Photo.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(photoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username:1,
                            _id:1,
                            email:1,
                            avatar:"avatar.url"
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner : {
                    $first : "$owner"
                }
            }
        },
        {
            $addFields: {
                photoUrl: "$photo.url"
            }
        },
    ])
})


export {
    uploadPhoto,
    getAllPhoto,
    deletePhoto,
    getAPhotoById
}