// controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { getDashboardAnalyticsService } from '../services/dashboard.service';
import { sellMedicineService } from '../services/sell.service';
import { createAuditLog } from '../services/auditLog.service';
import ApiError from '../utils/ApiError';
import { getMedicineById } from '../services/medicine.service';

interface CartItem {
  medicineId: string;
  quantity: number;
}

// ---------------------
// Bulk Sell Controller
// ---------------------
export const bulkSellMedicineController = catchAsync(async (req: Request, res: Response) => {
  const { cart } = req.body as { cart: CartItem[] };

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cart must contain at least one medicine');
  }

  const soldItems = [];

  for (const item of cart) {
    const { medicineId, quantity } = item;

    if (!medicineId || !quantity || quantity < 1) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid medicineId or quantity');
    }

    const medicine = await getMedicineById(medicineId);
    if (!medicine) {
      throw new ApiError(httpStatus.NOT_FOUND, `Medicine not found: ${medicineId}`);
    }

    if (quantity > medicine.stockDispenser) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Not enough stock in dispenser for ${medicine.brandName}`
      );
    }

    const sold = await sellMedicineService({ medicineId, quantity });
    soldItems.push(sold);
  }

  // Log bulk sale in one audit entry
  const auditDetails = soldItems
    .map(
      (item) =>
        `${item.brandName} (${item.genericName}, ${item.strength}, Batch: ${item.batchNumber}, Qty: ${item.quantitySold}, Selling: ${item.sellingPrice}, Cost: ${item.purchaseCost}, Profit: ${item.profit.toFixed(
          2
        )})`
    )
    .join('; ');

  await createAuditLog({
    userId: req.currentUser._id,
    userName: req.currentUser.fullName,
    action: 'Sell',
    details: `Sold medicines: ${auditDetails}`,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Medicines sold successfully',
    data: soldItems,
  });
});

// ---------------------
// Single Sell Controller
// ---------------------
export const sellMedicineController = catchAsync(async (req: Request, res: Response) => {
  const { medicineId, quantity } = req.body;

  if (!medicineId || !quantity || quantity < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid medicineId or quantity');
  }

  const existingMedicine = await getMedicineById(medicineId);
  if (!existingMedicine) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');
  }

  if (quantity > existingMedicine.stockDispenser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Not enough stock in dispenser');
  }

  const result = await sellMedicineService({ medicineId, quantity });

  await createAuditLog({
    userId: req.currentUser._id,
    userName: req.currentUser.fullName,
    action: 'Sell',
    details: `Sold medicine: ${result.brandName} (${result.genericName}, ${result.strength}, Batch: ${result.batchNumber}, Qty: ${result.quantitySold}, Selling: ${result.sellingPrice}, Cost: ${result.purchaseCost}, Profit: ${result.profit.toFixed(
      2
    )})`,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Medicine sold successfully',
    data: result,
  });
});

// ---------------------
// Dashboard Analytics Controller
// ---------------------
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
