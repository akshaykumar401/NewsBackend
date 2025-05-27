import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  sendComment,
} from '../controllers/comment.controller.js';

const router = Router();

// Secure Route
router.route('/sendComment').post(
  verifyJWT,
  sendComment
);

export default router;