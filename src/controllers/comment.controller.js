 
import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getPostComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {postId} = req.params
    const {page = 1, limit = 10} = req.query
    const sortBy = "createdAt";

    if(!postId) throw new ApiError(400, "Video id is required")

        const commentAggregation = await Comment.aggregate([
            {
                $match : {
                    post: new mongoose.Types.ObjectId(postId)
                }
            },
            {
                $project: {
                    content: 1,
                    post: 1,
                    owner: 1,
                    createdAt: 1
                }
            },
            {
                $sort: {
                    [sortBy]: 1
                }
            }
        ])

        const option = {
            page: page || 1,
            limit: limit || 1,
            customeLabels: {
              totalDocs: "totalItems",
              docs: 'users',
              limit: 'perPage',
              page: 'currentPage',
              nextPage: 'next',
              prevPage: 'prev',
              totalPages: 'pageCount',
              pagingCounter: 'pageCounter',
              hasPrevPage: 'hasPrev',
              hasNextPage: 'hasNext',
              meta: 'paginator'
            }
          }

         try {
            const allComments = await Comment.aggregatePaginate(commentAggregation, option)
            return res.status(201).json(
                new ApiResponse(
                    201,
                    allComments,
                    "Fetch all comments successfully"
                )
            ) 
         } catch (error) {
            throw new ApiError(500, error ? error.message : "Server Error")
         }

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content, postId} = req.body
 if(!content && !postId) throw new ApiError(400, "Content and VideoID is required")
    const user = req.user?._id
if(!user) throw new ApiError(400, "Unauthorised request")

   try {
     const comment = await Comment.create({
         content,
         owner: user,
         post: postId
     })

    return res.status(201).json(
        new ApiResponse(
            200,
            comment,
            "comment is created"
        )
    )
   } catch (error) {
    return res.status(500).json(
        new ApiResponse(
            500,
            "Server error"
        )
    )
   }
    
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId, content} = req.body
    if(!commentId && !content) throw new ApiError(400, "Content and comment is required")

    try {
        const comment = await Comment.findOneAndUpdate({
          _id: mongoose.Types.ObjectId(commentId)
        },
        {
            content
        },
        {new: true}
    )

    return res.status(201).json(
        new ApiResponse(201,
            comment,
            "Comment updated successfully"
        )
    )
    } catch (error) {
        throw new ApiError(500, error? error.message : "Server error")
    }


})  

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!mongoose.Types.ObjectId(commentId)) throw new ApiError(400, "Comment id isn't valid")

        try {
            const commentDelete = await Comment.findByIdAndDelete({
                _id: new mongoose.Types.ObjectId(commentId)
            })
            return res.status(201).json(
                new ApiResponse(
                    201,
                    commentDelete,
                    "Comment deleted successfully"
                )
            )
        } catch (error) {
            throw new ApiError(500, error ? error.message : "Server Error")
        }

})

export {
    getPostComments, 
    addComment, 
    updateComment,
    deleteComment
    }