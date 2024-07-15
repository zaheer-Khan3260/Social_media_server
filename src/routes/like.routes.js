import { Router } from 'express';
import {
    toggleCommentLike,
    togglePostLike,
    getLikedPosts
} from "../controllers/like.controller.js"
import {varifyJwt} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(varifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/postLike").post(togglePostLike);
router.route("/toggle/commentLike").post(toggleCommentLike);
router.route("/videos").get(getLikedPosts);

export default router