import { Router } from "express";
import { 
    registerUser,
    loginUser,
    loggedOutUser,
    updateAvatar,
    getCurrentUser,
    updatAccountDetails,
    changeCurrentPassword,
    getUserChannelProfile,
    getUserDataById,
    deleteAvatar,
    searchUser,
         } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { varifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(upload.single("avatar"),
    registerUser);
    router.route("/login").post(loginUser)
    router.route("/logout").post(varifyJwt, loggedOutUser);
    router.route("/update-avatar").patch(varifyJwt, upload.single("avatar"), updateAvatar)
    router.route("/current-user").get(varifyJwt, getCurrentUser)
    router.route("/change-password").post(varifyJwt, changeCurrentPassword);
    router.route("/update-account-details").post(varifyJwt, updatAccountDetails)
    router.route("/getUserChannelProfile").post(varifyJwt, getUserChannelProfile)
    router.route("/getUserById").post(varifyJwt, getUserDataById)
    router.route("/deleteAvatar").get(varifyJwt, deleteAvatar)
    router.route("/searchUser").post(varifyJwt, searchUser)


export default router;