import { Router } from "express";
import { varifyJwt } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()
router.use(varifyJwt);

router.route("/isSubscribed/c/:channelId")
.get(toggleSubscription);
router.route("/subscriber/c/:channelId")
.get(getUserChannelSubscribers)
router.route("/subscribedTo/c/:subscriberId")
.get(getSubscribedChannels);




export default router;