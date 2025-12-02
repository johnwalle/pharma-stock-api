// src/models/product.schema.ts
import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface INotification extends Document {
    title: string;
    message: string;
    link?: string;
    read: boolean;
}

const NotificationSchema: Schema<INotification> = new Schema<INotification>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
                type: String,
                required: true,
                trim: true,
            },
        link: {
            type: String,
            trim: true,
        },
        read: {
                type: Boolean,
                default: false,
            },
    },
    {
        timestamps: true,
    }
);

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
