import {Server} from "socket.io"
import http from "http"
import express from "express"


const app = express()

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: [process.env.CORS_ORIGIN, "http://localhost:3000"],
        methods: ["GET", "POST"]
    }
})


export const getRecieverSocketId = (recieverId) => {
    return userSocketMap[recieverId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if(userId !== undefined) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        const disconnectedUser = Object.keys(userSocketMap)
        .find(key => userSocketMap[key] === socket.id)
        if(disconnectedUser){
        delete userSocketMap[disconnectedUser];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    })
})

export {app, io, server}