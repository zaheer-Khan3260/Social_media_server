import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const sendMessage = asyncHandler(async(req, res) => {
    try {
        const { recieverId } = req.params;
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
        const { userToChat } = req.params;
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