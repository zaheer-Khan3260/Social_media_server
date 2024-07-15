import { Router } from 'express';

import {varifyJwt} from "../middlewares/auth.middleware.js"
import { addComment, getPostComments } from '../controllers/comment.controller.js';

const router = Router();
router.use(varifyJwt); 

router.route("/createComment").post(addComment);
router.route("/getComment").post(getPostComments);

export default router