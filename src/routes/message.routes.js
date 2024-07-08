import { Router } from "express";
import { varifyJwt } from "../middlewares/auth.middleware.js";
import { deleteMessage, getConversation, getConversationById, getMessage, sendMessage } from "../controllers/message.controller.js";

const router = Router();

router.use(varifyJwt)

router.route("/sendMessage").post( sendMessage )
router.route("/getMessage").post( getMessage )
router.route("/getConversation").get(getConversation)
router.route("/getConversationById").post(getConversationById)
router.route("/deleteMessage").post(deleteMessage)

export default router;