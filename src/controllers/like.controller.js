 
import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const togglePostLike = asyncHandler(async (req, res) => {
    const {postId} = req.body
    if(!postId) throw new ApiError(400, "Post ID is required");
    const isPostLiked = await Like.findOne({
        post: postId,
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    if(isPostLiked) {
            const deletePostLike = await Like.deleteOne({
                    _id: isPostLiked?._id
            })
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    deletePostLike,
                    "successfully dislike the video"
                )
            )
    }else {
        const postLiked = await Like.create({
            post: postId,
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
        })
        
        return res.status(200).json(
            new ApiResponse(200,
                postLiked,
                "Liked the video Successfully"
            )
        )
    }
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId) throw new ApiError(400, "Video ID is required");

    const isCommentLiked = await Like.findOne({
        comment: commentId,
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    if(isCommentLiked) {
            const deleteCommentLike = await Like.deleteOne({
                    _id: isCommentLiked?._id
            })
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    deleteCommentLike,
                    "successfully dislike the comment"
                )
            )
    }else {
        const commentLiked = await Like.create({
            comment: commentId,
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
        })

        return res.status(200).json(
            new ApiResponse(200,
                commentLiked,
                "Liked the comment Successfully"
            )
        )
    }
    
    

})


const getLikedPosts = asyncHandler(async (req, res) => {
        const likedUserData = await Like.find({likedBy: req.user?._id})

        const likedPost = likedUserData.filter(likedData => likedData.post? likedData : null)
        

     return res.status(200)
     .json(
        new ApiResponse(200,
            likedPost,
            "fetch liked video successfully"
        )
     )
})


export {
    toggleCommentLike,
    togglePostLike,
    getLikedPosts
}