import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"
import { app } from "./socket/socket.js";


console.log("Cors origin env", process.env.CORS_ORIGIN);

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: "Content-Type, Authorization, X-Requested-With",
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// we use the keyword "use" for writing middle ware in our code using express

app.use(express.json( {limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"))
app.use(cookieParser());

import UserRouter from "./routes/user.routes.js";
import PostRouter from "./routes/post.routes.js"
import SubscriptionRouter from "./routes/subscription.routes.js"
import LikeRouter from "./routes/like.routes.js"
import messageRouter from "./routes/message.routes.js"
// routes decleration

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/posts", PostRouter);
app.use("/api/v1/subscription", SubscriptionRouter)
app.use("/api/v1/like", LikeRouter)
app.use("/api/v1/message", messageRouter)


export {app}