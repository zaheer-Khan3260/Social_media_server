import { Router } from "express";
import { varifyJwt } from "../middlewares/auth.middleware.js";
import { getConversation, getConversationById, getMessage, sendMessage } from "../controllers/message.controller.js";

const router = Router();

router.use(varifyJwt)

router.route("/send/:recieverId").post( sendMessage )
router.route("/getMessage/:userToChat").post( getMessage )
router.route("/getConversation").get(getConversation)
router.route("/getConversationById").post(getConversationById)

export default router;