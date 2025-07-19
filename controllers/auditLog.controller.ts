import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { createAuditLog, getAllAuditLogs } from '../services/auditLog.service';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';

export const createLog = catchAsync(async (req: Request, res: Response) => {
    const { userId, userName, action, details } = req.body;

    if (!userId || !userName || !action || !details) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
    }

    const log = await createAuditLog({ userId, userName, action, details });

    res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Audit log created successfully',
        data: log,
    });
});

export const getLogs = catchAsync(async (req: Request, res: Response) => {
    const logs = await getAllAuditLogs();

    if (!logs.length) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No audit logs found');
    }

    res.status(httpStatus.OK).json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: logs,
    });
});
