
import asyncHandlerr from "express-async-handler";
import {Video} from '../models/video.models.js';
import {User} from '../models/user.models.js';
import {Comment} from "../models/comment.models.js";
import {Like} from "../models/likes.modeel.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utilits/cloudinary.js";
import mongoose from "mongoose";

const publishVideo = asyncHandlerr(async(req,res)=>{
  try {
      const {title,description} = req.body;
  
      const videoPath = req.file?.videoPath?.[0]?.path;
      
      const thumbnail = req.file?.videoPath?.[0]?.path;
  
      if(!videoPath || !thumbnail || !title || !description){
          throw new Error("video, thumbnail, title and description is required")
      }
  
      const video = await uploadOnCloudinary(videoPath);
      const videoThumbnail = await uploadOnCloudinary(thumbnail);
      console.log(video)
  
      if(!video){
          throw new Error("An error has been occur while updating the avatar")
      }
  
      const videoDetail = await Video.create({
          video:{publicId:video?.public_id, url:video?.url},
          thumbnail:{publicId:videoThumbnail?.public_id, url:videoThumbnail?.url},
          title:title,
          description:description,
          duration:video.duration,
          owner:req.user?._id
      })
  
      return res.status(200).json({video:video.url,thumbnail:videoThumbnail.url})
  } catch (error) {
    console.log("error occured while publishing the video", error?.message)
    return null;
  }
})


const getVideoById = asyncHandlerr(async(req,res)=>{
    try {
        const {videoId} = req.params;
        if(!isValidObjectId(videoId)){
            throw new Error('videoId is the required to get a video');
        }


        const foundVideo= Video.findById(videoId);
        if(!foundVideo){
            throw new Error('video not found with the given id');
        }


        const user= await User.findById(req.user?._id, { watchHistory : 1 } );

        if(!user?.watchHistory.includes(videoId)){
            await  Video.findByIdAndUpdate(
                videoId,
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


        //  if not in the watch history add it to the watch History,

        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $addToSet: {
                    watchHistory : videoId
                }
            },
            {
                new: true
            }
        )


        const video = await Video.aggregate(
           [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                           $project: {
                            username: 1,
                            avatar:"avatar.url",
                            email: 1,
                            _id: 1
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
                    videoUrl: "$video.url"
                }
            },
            {
                $addFields:{
                    thumbnail : "$thumbnail.url"
                }
            }
           ]
        )

        console.log("video in getVideoById ::", video?.[0])

        if(!video){
            throw new Error("video not found ");
        }

        return res.status(200).json({
            video:video?.[0]
        })
        
    } catch (error) {
        console.log("an error has occur in getting the video", error?.message)
        return null;
    }
})

//  has to work on this one
const getAllVideo = asyncHandlerr(async(req,res)=>{

    const { page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = 1,
        userId } = req.query;

    if(!userId || ! page || !limit || ! query || ! sortBy || !sortType){
        throw new Error("getAllVideo :: All the fields have not given please enter the all field");
    }

    const machingCondition= {
        $or:[
            {
                title:{$regex:query, $option:"i"}
            },
            {
                description:{$regex:query, $option: "i"}
            }
        ]
    }

    if(userId){
         machingCondition.owner = new mongoose.Types.ObjectId(userId);
    }

    var allVideo ;

    try {
        allVideo = Video.aggregate([
            {
                $match: machingCondition,
            },
            {
                $lookup:{
                    from:"users",
                    localField:'owner',
                    foreignField:'_id',
                    as: "owner",
                    pipeline: [
                        {
                            $project:{
                                _id:1,
                                username:1,
                                email:1,
                                avatar:"$avatar.url"
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    $first:"$owner",
                }
            },
            {
                $sort: {
                    [sortBy || "createdAt"]: sortType || 1
                }
            }
        ])


        // for sending the videos


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
        

        Video.aggregatePaginate(allVideo, options)
        .then(result => {
            // console.log("first")
            if (result?.videos?.length === 0 && userId) {
                return res.status(200).json({message:"No videos found"})
            }

            return res.status(200)
                .json(
                    {
                        message:"video fetched successfully"
                    },
                    {
                        result
                    }
                )
        }).catch(error => {
            console.log("error ::", error)
            throw new Error(error?.message || "Internal server error in video aggregate Paginate")
        })


    } catch (error) {
        console.log("an error has been occured while getting all videos please try again later",error);
        throw new Error("An error occured while getting the video");
        
    }
}) 



const deleteVideo = asyncHandlerr(async(req,res)=>{
  try {
      const {videoId}=req.params;
      var deleteVideoPromise;
      var deleteThumbnailPromise;
      if(!videoId){
          throw new Error("videoId must be provided");
      }
  
      const foundVideo = await Video.findById(videoId,{video:1, thumbnail: 1});
  
      if(!foundVideo){
          throw new Error("video to be deleted cannot be found");
      }
  
      // deleting from the cloudinary
      [deleteVideoPromise, deleteThumbnailPromise] = await Promise.all([
          deleteOnCloudinary(foundVideo.video.url, foundVideo.video.publicId),
          deleteOnCloudinary(foundVideo.thumbnail.url, foundVideo.thumbnail.publicId)
        ]);
  
        console.log(deleteVideoPromise,"this is the deleted video promise")
        console.log(deleteThumbnailPromise,"this is the deleted thumbnail of video promise")
  
  
  // Deleting from the database
      await Video.findByIdAndDelete(videoId);
  
      // 4. Remove video from related collections (optimized updates)
      const updatePromises = [
          User.updateMany({ watchHistory: videoId }, { $pull: { watchHistory: videoId } }),
          Comment.deleteMany({ video: videoId }),
          Like.deleteMany({ video: videoId })
        ];
    
        console.log("this is the upadate promis of videodelete", updatePromises)

        await Promise.all(updatePromises);
      
  } catch (error) {
    console.log("an error has been occured", error)
    throw new Error("error while deleting the video please try after some time")
  }
})



export {publishVideo,getVideoById,getAllVideo,deleteVideo}