import { Router } from "express";
import { varifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { 
  getAllPosts,
  publishAVideo,
  getPostById,
  deletePost,
  updateThumbnail,
  togglePublishStatus,
  getUserPosts,
 } from "../controllers/post.controller.js";



const router = Router();
router.use(varifyJwt)

router.route("/")
.get(getAllPosts)
.post( upload.single("postFile"),
    publishAVideo
)

router.route("/deletePost").post(deletePost)
router.route("/postFunction")
.post(togglePublishStatus)
.patch(upload.single("thumbnail"), updateThumbnail);
router.route("/getUserPost")
.post(getUserPosts)
router.route("/getPostById").post(getPostById)


export default router;