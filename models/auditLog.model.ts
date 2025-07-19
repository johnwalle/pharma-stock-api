import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  action: 'Add' | 'Edit' | 'Delete' | 'Sell';
  details: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  userName: { type: String, required: true },
  action: {
    type: String,
    enum: ['Add', 'Edit', 'Delete', 'Sell'],
    required: true,
  },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
