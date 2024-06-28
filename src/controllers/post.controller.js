import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.model.js";

const extractProductId = (url) => {
  const urlParts = url.split("/");
  const fileName = urlParts[urlParts.length - 1];
  const publicId = fileName.split(".")[0];
  return publicId;
};

const getAllPosts = asyncHandler(async (req, res) => {
  const postsAggregation = await Post.aggregate([
    {
      $lookup: {
        from: "likes",
        foreignField: "post",
        localField: "_id",
        as: "postLikes"
      }
    },
    {
      $addFields: {
          likeCount: {
            $size: "$postLikes"
          },
          isLiked: {
            $cond: {
              if: {
                $in: [
                  new mongoose.Types.ObjectId(req.user?._id),
                  "$postLikes.likedBy"
                ]
              },
              then: true,
              else: false
            }
          }
      }
    },
    {
      $project: {
        postFile: 1,
        caption: 1,
        likeCount: 1,
        isLiked: 1,
        comment: 1,
        owner: 1,
        createdAt: 1
      }
    }
  ]);

  if (!postsAggregation) throw new ApiError(400, "Failed to Video aggregation");

  return res
    .status(200)
    .json(new ApiResponse(200, postsAggregation, "Video fetch successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { caption } = req.body;
  if (!caption) return new ApiError(400, "All fields are required");

  const owner = req.user?._id;
  if (!owner) {
    throw new ApiError(404, "Owner not found");
  }

  const postLocalFilePath = req.file?.path;
  if (!postLocalFilePath) return new ApiError(400, "Video is required");

  const thumbnailLocalFilePath = req.file?.path;
  try {
    const post = await uploadOnCloudinary(postLocalFilePath);
    if (!post) throw new ApiError(500, "Facing error to uploading video");

    const thumbnail = await uploadOnCloudinary(thumbnailLocalFilePath);
    const postData = await Post.create({
      caption,
      postFile: post.url,
      isPublished: true,
      owner
    });

    return res
      .status(200)
      .json(new ApiResponse(200, postData, "Video upload Successfully"));
  } catch (error) {
    throw new ApiError(
      400,
      error ? error.message : "Facing Issues while uploading"
    );
  }
});

const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!mongoose.Types.isValidObjectId(postId)) throw new ApiError(400, "Post Id is invalid");
  
  const post = await Post.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(postId)
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "post",
        as: "comment"
      }
    },
    {
      $project: {
        postFile: 1,
        duration: 1,
        thumbnail: 1,
        views: 1,
        comment: 1,
        owner: 1,
        caption: 1
      }
    }
  ]);

  if(!post || post.length === 0) throw new ApiError(404, "Video not found")


  return res
    .status(200)
    .json(new ApiResponse(200, post[0], "Video fetch successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!postId) throw new ApiError(400, "video Id is required");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(400, "video doesn't found");

  const postProductId = extractProductId(post.postFile);
  if (!postProductId)
    throw new ApiError(404, "Cann't find the video Product Id");
  const deleteCurrentPost = await cloudinary.uploader.destroy(
    postProductId,
    {
      resource_type: "auto",
    },
    function (error, result) {
      if (!result)
        throw new ApiError(
          400,
          error ? error.message : "Failed to delete video"
        );
    }
  );
  if (!deleteCurrentPost) throw new ApiError(400, "Failed to delete video");

  if (post.thumbnail) {
    const thumbnailProductId = extractProductId(post.thumbnail);
    if (!thumbnailProductId)
      throw new ApiError(404, "Cann't find the video Product Id");

    const deleteThumbnail = await await cloudinary.uploader.destroy(
      thumbnailProductId,
      function (error, result) {
        if (!result)
          throw new ApiError(
            400,
            error ? error.message : "Failed to delete video"
          );
        return true;
      }
    );

    if (!deleteThumbnail) throw new ApiError(400, "Failed to delete thumbnail");
  }
  const postDataDelete = await Video.deleteOne({
    _id: postId,
  });
  if (!postDataDelete)
    throw new ApiError(400, "Failed to delete data from MongoDB");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post deleted Successfully"));
});

const updateThumbnail = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!postId) throw new ApiError(400, "video Id is required");

  const thumbnailLocalFilePath = req.file?.thumbnail[0]?.path;
  if (!thumbnailLocalFilePath)
    return new ApiError(400, "Thumbnail is required");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(400, "Video is not found");

  const productId = extractProductId(post.thumbnail);
  console.log("product Id", productId);
  if (!productId) throw new ApiError(400, "Product id doesn't found");

  const deleteThumbnail = await cloudinary.uploader.destroy(
    productId,
    function (error, result) {
      if (!result)
        throw new ApiError(
          400,
          error ? error.message : "Failed to delete video"
        );
      return true;
    }
  );

  if (!deleteThumbnail) throw new ApiError(400, "Failed to delete thumbnail");

  const thumbnail = await uploadOnCloudinary(thumbnailLocalFilePath);
  if (!thumbnail)
    throw new ApiError(500, "Facing error to uploading thumbnail");

  const updatedVideoThumbnail = await Post.findByIdAndUpdate(
    postId,
    {
      thumbnail: thumbnail.url,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideoThumbnail,
        "thumbnail update successfully"
      )
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!postId) throw new ApiError(400, "Video ID is required");

  const currentPost = await Post.findById(postId);
  if (!currentPost) throw new ApiError(404, "Video not found");

  // Toggle the publish status
  const newPublishStatus = !currentPost.isPublished;

  const post = await Post.findByIdAndUpdate(
    postId,
    {
      isPublished: newPublishStatus,
    },
    { new: true }
  );

  if (!post) throw new ApiError(400, "Failed to toggel the video");
  return res
    .status(200)
    .json(new ApiResponse(200, post, "Video toggle successfully"));
});

const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new ApiError(400, "User ID is required");

  const allPosts = await Post.find({ owner: userId });

  return res
    .status(200)
    .json(new ApiResponse(200, allPosts, "Fetch all user Post successfully"));
});

export {
  getAllPosts,
  publishAVideo,
  getPostById,
  deletePost,
  updateThumbnail,
  togglePublishStatus,
  getUserPosts,
};
