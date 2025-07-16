// controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { getDashboardAnalyticsService } from '../services/dashboard.service';
import { sellMedicineService } from '../services/sell.service';


// sell medicine controller


export const sellMedicineController = catchAsync(async (req: Request, res: Response) => {
    const { medicineId, quantity } = req.body;

    const result = await sellMedicineService({ medicineId, quantity });

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
