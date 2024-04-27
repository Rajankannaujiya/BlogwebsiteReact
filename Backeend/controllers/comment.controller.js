import asyncHandler from "express-async-handler";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import {User} from "../models/user.models.js";
import {Photo} from "../models/photos.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const uploadComment = asyncHandler(async (req, res) => {
  const { comment, userId, id } = req.params;

  if (!comment || !userId) {
    throw new Error("comment and userId is required");
  }

  if (comment?.trim() === "") throw new Error("content is required");

  try {
    // if you ge the videoId then execute this one
    const video = await Video.findById(id);
    if (video && video!==null) {

      const user = await User.findById(req.user?._id)
      if(!user){
        throw new Error("user is not found");
      }


      const comment = await Comment.create(
        {
            comment,
            video:id,
            owner:req.user?._id,
        }
      )

      if(!comment){
        return res.status(404).send("some error has occured while uploading the comment")
      }

        return res.status(200).json({comment})
    }

    // if you get the photoId then execute this one
    const photo = await Photo.findById(id);
    if (photo && photo!== null) {

      const user = await User.findById(req.user?._id)
      if(!user){
        throw new Error("user is not found");
      }


      const comment = await Comment.create(
        {
            comment,
            video:id,
            owner:req.user?._id,
        }
      )

      if(!comment){
      return res.status(404).send("some error has occured while uploading the comment")
      }

      return res.status(200).json({comment})

    }
  } catch (error) {
    console.log("an error has been occured while uploading the comment");
    throw new Error("Error occured while uploading the comment");
  }
});

const getComment = asyncHandler(async (req, res) => {
    try {
        const {id}=req.params;
        var videoDetail;
        var photDetail;


        if(!isValidObjectId(id)){
            throw new Error("invalid id");
        }

        if(id){
            
            const video = await Video.findById(id);
            if(video && video !==null){
                videoDetail =await Video.aggregate([
                    {
                        $match:{
                            _id:new mongoose.Types.ObjectId(id)
                        }
                    },
                    {
                        $lookup:{
                            from:"user",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project: {
                                        _id:1,
                                        username:1,
                                        avatar:"$avatar.url"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    },
                    {
                        $sort: {
                            "createdAt": -1
                        }
                    }
                ])

                return res.status(200).json({videoDetail})
            }

            const photo = await Photo.findById(id);
            if(photo && photo !==null){

                photDetail = await Photo.aggregate([
                    {
                        $match: {
                            _id: new mongoose.Types.ObjectId(id)
                        }
                    },
                    {
                        $lookup:{
                            from: "user",
                            localField:"owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        _id:1,
                                        username:1,
                                        avatar:"$avatar.url"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    },
                    {
                        $sort: {
                            "createdAt": -1,
                        }
                    }
                ])
                return res.status(200).json({photDetail})
            }
        }


    } catch (error) {
        console.log("got an error in getting the comment");
        return res.status(400).send("an error has been occured while fetching comment");
    }
});

const updateComment = asyncHandler(async (req, res) => {

    try {
        const {CommentId} = req.params;
        if(!CommentId){
            throw new Error("id is required")
        }
        const comment = await Comment.findById(CommentId);
        if(!comment) {
            return res.status(404).send("comment not found")
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            CommentId,
            {
                $set: {
                    comment:comment
                }
            },
            {
                new: true
            }
        )

        if(!updatedComment){
            return res.status(400).send("comment not updated")
        }
        return res.status(200).json({updatedComment})


    } catch (error) {
        console.log("an error occured while updating the comment");
        return res.status(400).send("error occured while updating the comment");
    }

});

const deleteComment = asyncHandler(async (req, res) => {
    try {
        const {CommentId} = req.params;

        if(!CommentId){
            return res.status(404).send("comment id is required");
        }

        const comment = await Comment.findByIdAndDelete(
            CommentId,
            {
                new: true,
            }
        )

        if(!comment){
            return res.status(400).send("comment not deleted")
        }

        return res.status(200).send("deleted successfully");


    } catch (error) {
        console.log("an error has been occured while deleting the comment");
    }

});

export { updateComment, getComment, deleteComment, uploadComment };
