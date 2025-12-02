import Notification from '../models/notification.model';
import { Types } from 'mongoose';

  /**
   * Create a new notification
   */
    const createNotification = async(
        data: {
            title: string;
            message: string;
            link?: string;
            read: boolean;
          }
    ) => {
            const newNotification = new Notification({
                title: data.title,
                message: data.message,
                link: data.link,
                read: data.read,
            });
            await newNotification.save();
            return newNotification;
    }

    /**
     * Get all notifications (Admin)
     */
    const getAllNotifications = async() => {
        return await Notification.find().sort({ createdAt: -1 });
    }

    /**
     * Mark a notification as read
     */
    const markNotification = async(notificationId: string) => {
        await Notification.findByIdAndUpdate(notificationId, { read: true });
    }

    const markAllUserNotifications = async() => {
        // update all notifications to read: true
        await Notification.updateMany({}, { read: true });
    }

    /**
     * Get a notification by ID
     */
    const getNotificationById = async(notificationId: Types.ObjectId) => {
        return await Notification.findById(notificationId).populate('user', 'fullName email address');
    }

    export default {
        createNotification,
        getAllNotifications,
        markNotification,
        markAllUserNotifications,
        getNotificationById
      };
