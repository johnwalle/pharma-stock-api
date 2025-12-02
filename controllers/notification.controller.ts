import { Request, Response } from 'express';
import ApiError from '../utils/ApiError';
import notificationService from '../services/notification.service';
import httpStatus from 'http-status';


/**
 * Create a new notification
 */
export const createNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, message, link, read } = req.body;
        if (!title) {
            throw new ApiError(400, 'Title is required');
        }
        if (!message) {
            throw new ApiError(400, 'Message is required');
        }
        const newNotification = await notificationService.createNotification({
            title,
            message,
            link,
            read,
        });
        res.status(httpStatus.CREATED).json({
            status: 'success',
            data: { notification: newNotification },
        });
    } catch (error: any) {
        console.error('Error creating notification:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal Server Error',
        });
    }
};

/**
 * Get all notifications for a specific user
 */
export const getAllUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const notifications = await notificationService.getAllNotifications();
        res.status(httpStatus.OK).json({
            status: 'success',
            data: { notifications },
        });
    } catch (error: any) {
        console.error('Error getting user notifications:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal Server Error',
        });
    }
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { notificationId } = req.body;
        if (!notificationId) {
            throw new ApiError(400, 'Notification ID is required');
        }
        const notification = await notificationService.markNotification(notificationId);
        res.status(httpStatus.OK).json({
            status: 'success',
            data: { notification },
        });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal Server Error',
        });
    }
};

export const markAllUserNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        await notificationService.markAllUserNotifications();
        res.status(httpStatus.OK).json({
            status: 'success',
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal Server Error',
        });
    }
};
