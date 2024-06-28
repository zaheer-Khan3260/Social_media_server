import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// we use the keyword "use" for writing middle ware in our code using express

app.use(express.json( {limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"))
app.use(cookieParser());

import UserRouter from "./routes/user.routes.js";
import PostRouter from "./routes/post.routes.js"
import SubscriptionRouter from "./routes/subscription.routes.js"
import LikeRouter from "./routes/like.routes.js"

// routes decleration

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/posts", PostRouter);
app.use("/api/v1/subscription", SubscriptionRouter)
app.use("/api/v1/like", LikeRouter)



export {app}