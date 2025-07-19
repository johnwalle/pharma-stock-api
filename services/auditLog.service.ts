import { AuditLog } from '../models/auditLog.model';
import { Types } from 'mongoose';

interface CreateAuditLogInput {
  userId: Types.ObjectId;
  userName: string;
  action: 'Add' | 'Edit' | 'Delete' | 'Sell';
  details: string;
}

export const createAuditLog = async (logData: CreateAuditLogInput) => {
  return await AuditLog.create(logData);
};

export const getAllAuditLogs = async () => {
  return await AuditLog.find().sort({ timestamp: -1 }).limit(250);
};
