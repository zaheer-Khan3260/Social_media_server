import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema({
    conversationBetween: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    message: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: []
        }
    ]
},{
    timestamps: true
})