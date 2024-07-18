 
import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getPostComments = asyncHandler(async (req, res) => {
    // Get postId from the request body
    const { postId } = req.body;
    const { page = 1, limit = 10 } = req.query;
    const sortBy = "createdAt";

    if (!postId) throw new ApiError(400, "Post id is required");

    const commentAggregation = Comment.aggregate([
        {
            $match: {
                post: new mongoose.Types.ObjectId(postId)
            }
        },
        {
            $lookup: {
              from: "likes",
              foreignField: "comment",
              localField: "_id",
              as: "commentLike"
            }
          },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        },
        {
            $addFields: {
              likeCount: {
                $size: "$commentLike"
              },
              isLiked: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(req.user?._id),
                      "$commentLike.likedBy"
                    ]
                  },
                  then: true,
                  else: false
                }
              }
            }
          },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                content: 1,
                post: 1,
                createdAt: 1,
                'owner._id': 1,
                'owner.avatar': 1,
                'owner.fullname': 1,
                'owner.username': 1,
                likeCount: 1,
                isLiked: 1,
            }
        },
        {
            $sort: {
                [sortBy]: 1
            }
        }
    ]);

    const options = {
        page: page || 1,
        limit: limit || 1,
        customLabels: {
            totalDocs: "totalItems",
            docs: 'comments',
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
    };

    try {
        // Check if Comment.aggregatePaginate is a function
        if (typeof Comment.aggregatePaginate !== 'function') {
            throw new ApiError(500, "aggregatePaginate is not a function");
        }

        // Fetch paginated comments
        const allComments = await Comment.aggregatePaginate(commentAggregation, options);

        return res.status(201).json(
            new ApiResponse(
                201,
                allComments,
                "Fetch all comments successfully"
            )
        );
    } catch (error) {
        console.error("Error occurred:", error);
        throw new ApiError(500, error ? error : "Server Error");
    }
});


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