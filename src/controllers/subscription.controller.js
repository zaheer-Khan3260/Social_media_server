import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.body;
    console.log("Channel Id in toggel subscription", channelId)
    if (!channelId) throw new ApiError(400, "Channel ID is required");
  
    const userId = req.user?._id;
    if (!userId) throw new ApiError(400, "User not authenticated");
  
    // Check if the channel (user) exists
    const channel = await User.findById(channelId);
    if (!channel) throw new ApiError(404, "Channel (User) not found");
  
    // Check if the user is already subscribed to the channel
    const existingSubscription = await Subscription.findOne({ subscriber: userId, channel: channelId });
        console.log("existingSubscrition", existingSubscription);
    if (existingSubscription) {
      // If subscribed, remove the subscription
     const deleteSubscription = await Subscription.deleteOne({ _id: existingSubscription._id });
  if(!deleteSubscription) throw new ApiError(400, "Failed to delete the Data")
      return res.status(200).json(new ApiResponse(200, deleteSubscription, "Unsubscribed successfully"));
    } else {
      // If not subscribed, add the subscription
      await Subscription.create({ subscriber: userId, channel: channelId });
  
      return res.status(200).json(new ApiResponse(200, {}, "Subscribed successfully"));
    }
  });


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId) throw new ApiError(400, "Channel id is required")

        const channelSubscribersList = await Subscription.find({channel: channelId})
        if(!channelSubscribersList) throw new ApiError(400, "Cann't find the channel")

         const subscribers =  channelSubscribersList.map((channelData) => channelData.subscriber)
         if(!subscribers) throw new ApiError(400, "An error occur while fetching subscriber")
        return res.status(200).json(
            new ApiResponse(
                200,
                subscribers,
                "Subscriber fetch successfully"
            )
        )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId) throw new ApiError(400, "Channel id is required")

        const channelSubscribedToList = await Subscription.find({subscriber: subscriberId})
        if(!channelSubscribedToList) throw new ApiError(400, "Cann't find the channel")

         const channels =  channelSubscribedToList.map((channelData) => channelData.channel)
         if(!channels) throw new ApiError(400, "An error occur while fetching subscriber")

        return res.status(200).json(
            new ApiResponse(
                200,
                channels,
                "SubscribedTo fetch successfully"
            )
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}