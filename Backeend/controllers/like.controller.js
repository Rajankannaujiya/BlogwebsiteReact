import asyncHandler from "express-async-handler";
// import {User} from "../models/user.models.js"
import {Like} from "../models/likes.model.js"
import {Video} from "../models/video.models.js"
import {Photo} from "../models/photos.model.js"
import {Comment} from "../models/comment.models.js"
import mongoose, { isValidObjectId } from "mongoose";
// import {Photo} from "../models/photos.model.js"


const toggleLike = async(Model, resouceId, userId)=>{
    if(!Model || !resouceId || !userId){
        throw new Error("model, resouceId and userId is required");
    }


    const resouce = Model.findById(resouceId);
    if(!resouce){
        throw new Error("resource not found");
    }

    const resourceField = Model.modelName.toLowerCase();

    const isLiked = await Like.findOne({ [resourceField]: resouceId, likedBy: userId })

    var response;
    try {
        response = isLiked ?
            await Like.deleteOne({ [resourceField]: resouceId, likedBy: userId }) :
            await Like.create({ [resourceField]: resouceId, likedBy: userId })
    } catch (error) {
        console.error("toggleLike error ::", error);
        throw new Error(error?.message)
    }

    const totalLikes = await Like.countDocuments({[resourceField]:resouceId,likedBy:userId})

    return { response, isLiked, totalLikes };

}

const toggleLikedVideo = asyncHandler(async(req,res)=>{
    const {videoId}= req.params;

    if(!videoId){
        return res.status(400).send("videoId is not provided");
    }

    const {response, isLiked, totalLikes} = await toggleLike(Video, videoId, req.user?._id);

    return res.status(200).json({response,totalLikes},isLiked === null ? "Liked successfully" : "remove liked successfully");
})


const toggleLikedPhoto = asyncHandler(async(req,res)=>{
    const {photoId} = req.params;
    if(!photoId){
        return res.status(400).send("photoId is not provided");
    }

    const {response, isLiked, totalLikes} = await toggleLike(Photo, photoId, req.user?._id);

    return res.status(200).json({response,totalLikes},isLiked === null ? "Liked successfully" : "remove liked successfully");
})


const toggleLikedComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params;
    if(!commentId){
        return res.status(400).send("commentId is not provided");
    }

    const {response, isLiked, totalLikes} = await toggleLike(Comment, commentId, req.user?._id);

    return res.status(200).json({response,totalLikes},isLiked === null ? "Liked successfully" : "remove liked successfully");
})

const getLikedVideos = asyncHandler(async(req,res)=>{

    const userId = req.user?._id?.toString();
    var likeVideos;

    if(!userId){
        return res.status(400).send("userId is not provided")
    }

    if(!isValidObjectId(userId)){
        console.log("the userId is not valid");
        throw new Error("invalid user id")
    }

    try {
       likeVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedvideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner", 
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        avatar:"$avatar.url"

                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                    {
                        $addFields: {
                            video: "$video.url"
                        },
                    },
                    {
                        $addFields: {
                            thumbnail: "$thumbnail.url"
                        },
                    },
                ]
            }
        }
       ])

        
    } catch (error) {
        console.log("this error occured in getting the video likes",rror?.message)
    }

})

const getLikedPhotos= asyncHandler (async(req,res)=>{


    const userId = req.user?._id?.toString();
    var likePhotos;

    if(!userId){
        return res.status(400).send("userId is not provided")
    }

    if(!isValidObjectId(userId)){
        console.log("the userId is not valid");
        throw new Error("invalid user id")
    }

    try {
       likeVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "photos",
                localField: "photo",
                foreignField: "_id",
                as: "likedPhotos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner", 
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        avatar:"$avatar.url"

                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                    {
                        $addFields: {
                            photo: "$photo.url"
                        },
                    }
                ]
            }
        }
       ])

        
    } catch (error) {
        console.log("this error occured in getting the video likes",rror?.message)
    }

})


export {toggleLikedVideo,toggleLikedPhoto,toggleLikedComment,getLikedVideos,getLikedPhotos}