import express from 'express';
import { adminMiddleware, requireSignIn } from '../middlewares/auth.middleware';
import { createNotification, getAllUserNotifications, markNotificationAsRead, markAllUserNotificationsAsRead } from '../controllers/notification.controller';
const router = express.Router();



router.post('/', requireSignIn, adminMiddleware, createNotification);
router.get('/', requireSignIn, getAllUserNotifications);
router.post('/read', requireSignIn, markNotificationAsRead);
router.post('/all-read', requireSignIn, markAllUserNotificationsAsRead);

export default router;