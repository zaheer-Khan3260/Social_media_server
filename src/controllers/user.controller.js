import mongoose, { mongo } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import  {deleteFromCloudinary, uploadOnCloudinary}  from "../utils/Cloudinary.js"
import jwt from "jsonwebtoken"
import axios from "axios"


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const extractProductId = (url) => {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const publicId = fileName.split('.')[0];
    return publicId;
}
const registerUser = asyncHandler( async (req, res) => {

    const {fullname, email, username, password} = req.body
    if([
        fullname,email,username, password
    ].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All Feilds are required")
    }

    const existedUserName = await User.findOne({username})
    if(existedUserName) throw new ApiError(409, "Username already existed");

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath) throw new ApiError(400, "Avatar is required");
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) throw new ApiError(409, "Failed to upload a file")
        
    const user = await User.create({
        fullname,
        email,
        password,
        username,
        avatar: avatar.url,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) throw new ApiError(500, "Failed to create a new User")

        res.status(201).json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        )
}
)


const loginUser = asyncHandler (async (req,res) => {
    const {email, password, username} = req.body
    if (!username && !email) {
        throw new ApiError(400, "Username or Email required");
    }

    // Find the user by username or email
    const user = username
        ? await User.findOne({ username })
        : await User.findOne({ email });

   if(!user) throw new ApiError(400, "User does not exist , Enter Correct username or email");
   
   const correctPassword = await user.isPasswordCorrect(password);
   if(!correctPassword) throw new ApiError(400, "Password is incorrect")
    
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const option = {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    }

    return res.status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse (
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )
    
})

const loggedOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    
    const option = {
        httpOnly: true,
        secure:true,
        sameSite: 'None'
    }
    
    return res.status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
        const userRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if(!userRefreshToken) throw new ApiError(400, "Refresh token is expired");

        try {
            const decodedToken =  jwt.verify(
                userRefreshToken,
                 process.env.REFRESH_TOKEN_SECRET
                )
    
            const user = await User.findById(decodedToken?._id);
            if(!user) throw new ApiError(400, "Refresh token is invalid");
    
            if(userRefreshToken !== user.refreshToken) throw new ApiError(400, "Refresh token is used or expired")
    
           const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
           const option = {
            httpOnly: true,
            secure:true
           }
    
           return req
           .status(200)
           .cookie("accessToken", accessToken, option)
           .cookie("refreshToken", newRefreshToken, option)
           .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token refreshed"
            )
        )
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token")
        }
       


})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id);
    const isPasswordRight = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordRight) throw new ApiError(400, "Invalid Old password");

    user.password = newPassword
    user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change Successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken")
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "User fetched successfully"
    ))
})

const getUserDataById = asyncHandler(async(req,res) => {
    const {userId} = req.body
    if(!userId) throw new ApiError(400, "UserID is required");

    const user = await User.findOne({_id: userId})
    if(!user) throw new ApiError(404, "User Not found")
        const userData = {
            _id: user._id,
            username: user.username,
            fullname: user.fullname,
            avatar:user.avatar,
            email: user.email
        }
        return res.status(201).json(
            new ApiResponse(201,
                userData,
                "Successfully fetch user Data"
            )
        )
})

const updatAccountDetails = asyncHandler(async (req, res) => {
    const {fullname, email} = req.body

    if(!fullname && !email) throw new ApiError(400, "All fields are required");

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullname,
                    email
                }
            },
            {
                new: true
            }

        ).select("-password")

        return res
    .status(200)
    .json(
        new ApiResponse (
            200,
            user,
            "Account detail update successfully"
        )
    )

})

const updateAvatar = asyncHandler (async (req,res) => {
        const localFilePath = req.file?.path
        if(!localFilePath) throw new ApiError(400, "Avatar is required");

        const currentUser = await User.findById(req.user._id);
        if(!currentUser) throw new ApiError(400, "Cannot find the old avatar");
        
        const oldAvatarImageUrl = currentUser?.avatar;

        if(!oldAvatarImageUrl) throw new ApiError(400, "Cannot find the old avatar");

        const productId = extractProductId(oldAvatarImageUrl);
        
       const deleteImage =  await deleteFromCloudinary(productId);

        if(!deleteImage) throw new ApiError(400, "Failed to delete Avatar")
        
       const cloudinaryUrl = await uploadOnCloudinary(localFilePath);
       if(!cloudinaryUrl.url) throw new ApiError(500, "An Error Occur during updating avatar");


       const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            avatar : cloudinaryUrl.url
        },
        {new: true}
       ).select("-password")

       return res
       .status(200)
       .json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
       )

})

const deleteAvatar = asyncHandler( async (req, res) => {
     const currentUser = await User.findById(req.user?._id);
        if(!currentUser) throw new ApiError(400, "Cannot find the old avatar");
        
        const oldAvatarImageUrl = currentUser?.avatar;

        if(!oldAvatarImageUrl) throw new ApiError(400, "Cannot find the old avatar");

        const productId = extractProductId(oldAvatarImageUrl);
        
       const deleteImage =  await deleteFromCloudinary(productId);
        if(!deleteImage) throw new ApiError(400, "Failed to delete Avatar")

        return res.status(200).json(
        new ApiResponse(
        200,
        deleteImage,
        "avatar delete successfully"
        )
        
        )

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {userId} = req.body
    if(!userId) throw new ApiError(400, "userId is missing");
        
    const channel = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields: {
                followerCount: {
                    $size: "$subscribers" 
                   },
                followingCount: {
                    $size: "$subscribedTo"
                   },
                isFollowed: {
                    $cond:{
                        if: {
                            $in: [
                                    new mongoose.Types.ObjectId(req.user?._id),
                                "$subscribers.subscriber"
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
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
                bio:1,
                followerCount: 1,
                followingCount: 1,
                isFollowed: 1
            }
        }

    ])
        console.log("channel", channel);
    if(!channel?.length) throw new ApiError(400, "channel does not exists")
    return res.status(200)
    .json(
    new ApiResponse(
        200,
        channel[0],
        "User channel fetched successfully"
    )
)
})

const checkUserName = asyncHandler(async (req, res) => {
        const {username} = req.body
        if(!username) throw new ApiError(400, "username is required")

        const isUsernameExisted = await User.findOne({username})
        if(isUsernameExisted) { return res.status(200).json(
        new ApiResponse(
        200,
        "Username already existed"
        ))
        }else{
        return res.status(200).json(new ApiResponse(
        200,
        "Username is available"))
        }
    })



export {
    registerUser,
    loginUser,
    loggedOutUser,
    getCurrentUser,
    changeCurrentPassword,
    refreshAccessToken,
    updatAccountDetails,
    getUserChannelProfile,
    updateAvatar,
    deleteAvatar,
    checkUserName,
    getUserDataById,
    
}