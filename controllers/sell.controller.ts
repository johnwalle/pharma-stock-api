// controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { getDashboardAnalyticsService } from '../services/dashboard.service';
import { sellMedicineService } from '../services/sell.service';
import { createAuditLog } from '../services/auditLog.service';
import ApiError from '../utils/ApiError';
import { getMedicineById } from '../services/medicine.service';


// sell medicine controller


export const sellMedicineController = catchAsync(async (req: Request, res: Response) => {
    const { medicineId, quantity } = req.body;
    const existingMedicine = await getMedicineById(medicineId);
    if (!existingMedicine) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');
    }

    const result = await sellMedicineService({ medicineId, quantity });

    // ✅ Log the action to audit log
    await createAuditLog({
        userId: req.currentUser._id,
        userName: req.currentUser.fullName, // ⬅️ Assumes auth middleware sets this
        action: 'Sell',
        details: `Sold medicine: ${existingMedicine.brandName} (${existingMedicine.strength}, Batch: ${existingMedicine.batchNumber}, Qty: ${quantity})`,
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: 'Medicine sold successfully',
        data: result,
    });
});






// get the dashboard analytics controller 

export const getDashboardAnalyticsController = catchAsync(
    async (_req: Request, res: Response) => {
        const data = await getDashboardAnalyticsService();
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Analytics data fetched successfully',
            data,
        });
    }
);
