import express from 'express';
import { authLimiter } from '../middlewares/auth.limmiter';
import {
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';

const router = express.Router();


router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);


export default router;
