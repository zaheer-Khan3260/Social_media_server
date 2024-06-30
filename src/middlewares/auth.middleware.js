import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"


export const varifyJwt = asyncHandler(async (req, _, next) => {
   try {
    const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
   //  console.log("token in middleware",token);
    if(!token) throw new ApiError(401," unauthorized request");
 
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = (decodedToken)
    req.user = user;
 
    next()
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
   }

})