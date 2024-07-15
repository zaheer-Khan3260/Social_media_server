import dotenv from "dotenv"
import connectDatabase from "./db/index.js"
import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { app, server } from "./socket/socket.js";

dotenv.config({
    path: './env'
});

console.log("Cors origin env", process.env.CORS_ORIGIN);

const corsOptions = {
    origin: [process.env.CORS_ORIGIN, "http://localhost:3000"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: "Content-Type, Authorization, X-Requested-With",
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));


connectDatabase()
.then(() => {
    server.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed !!!", err);
})

app.use(express.json( {limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"))
app.use(cookieParser());

import UserRouter from "./routes/user.routes.js";
import PostRouter from "./routes/post.routes.js"
import SubscriptionRouter from "./routes/subscription.routes.js"
import LikeRouter from "./routes/like.routes.js"
import messageRouter from "./routes/message.routes.js"
import commentRouter from "./routes/comment.routes.js"
// routes decleration

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/posts", PostRouter);
app.use("/api/v1/subscription", SubscriptionRouter)
app.use("/api/v1/like", LikeRouter)
app.use("/api/v1/message", messageRouter)
app.use("/api/v1/comments", commentRouter)


