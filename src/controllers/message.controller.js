import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const sendMessage = asyncHandler(async(req, res) => {
    try {
        const { recieverId } = req.body;
        const { message } = req.body
    
        if(!recieverId) throw new ApiError(401, "Sender Id is required");
    
        const senderId = req.user?._id
        if(!senderId) throw new ApiError(401, "Unauthorised request");
    
        let conversation = await Conversation.findOne({
            conversationBetween: {$all: [senderId, recieverId]}
        })
    
        if(!conversation) {
            conversation = new Conversation({
                conversationBetween: [senderId, recieverId],
                messages: []
            });
        }
    
        const newMessage = new Message({
            senderId,
            recieverId,
            message
        })
        console.log("new message Id", newMessage)
        if(newMessage) {
            conversation.messages.push(newMessage?._id)
        }
    
        await Promise.all([conversation.save(), newMessage.save()])
        return res.status(201).json(
            new ApiResponse(
                201,
                newMessage,
                "Message created successfully"
            )
        )
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
    }

})

export const getMessage = asyncHandler(async(req, res) => {

    try {
        const { userToChat } = req.body
        if(!userToChat) throw new ApiError(400, "User to chat id is required")
        const senderId = req.user?._id;

        const conversation = await Conversation.findOne({
            conversationBetween: {$all: [senderId, userToChat]}
        }).populate("messages")

        if(!conversation) {return res.status(200).json(new ApiResponse(
            200,
            [],
            "There is NO convertion between you two"
        ))}
        const message = conversation.messages

        return res.status(201).json(
            new ApiResponse(
                201,
                message,
                "Fetching conversation successfully "
            )
        )

    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
    }
})

export const getConversation = asyncHandler(async(req, res) => {
    const senderId = req.user?._id
    const conversation = await Conversation.find({
        conversationBetween: {$all: [senderId]}
    }).populate("conversationBetween").populate("messages")
    if(!conversation) return res.status(200).json(
        new ApiResponse(
            200,
            [],
            "You didn't send message anyone"
        )
    )
    return res.status(201).json(
        new ApiResponse(201,
            conversation,
            "Fetch conversation successfully"
        )
    )
})

export const getConversationById = asyncHandler(async(req, res) => {
    const {conversationId} = req.body
    if(!conversationId) throw new ApiError(400, "Conversation id required")
    const conversation = await Conversation.findById(conversationId).populate("conversationBetween").populate("messages")
    if(!conversation) return res.status(200).json(
        new ApiResponse(
            200,
            [],
            "You didn't send message anyone"
        )
    )
    return res.status(201).json(
        new ApiResponse(201,
            conversation,
            "Fetch conversation successfully"
        )
    )
})