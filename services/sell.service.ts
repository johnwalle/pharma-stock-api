// services/sell.service.ts
import Medicine from '../models/medicine.model';
import MedicineSale from '../models/sell.model';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

export type SellMedicinePayload = {
  medicineId: string;
  quantity: number;
  sellingPrice?: number; // optional, will enforce from medicine
};

export type BulkSellMedicinePayload = SellMedicinePayload[];

/**
 * Sell a single medicine from dispenser
 */
export const sellMedicineService = async ({ medicineId, quantity }: SellMedicinePayload) => {
  if (!medicineId || !quantity) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing or invalid required fields');
  }
  if (quantity <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Quantity must be greater than zero');
  }

  const medicine = await Medicine.findOne({ _id: medicineId, isDeleted: false });
  if (!medicine) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');
  }

  if (medicine.stockDispenser < quantity) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Not enough stock in dispenser');
  }

  // Track stock before sale
  const stockBefore = medicine.stockDispenser;

  // Deduct stock
  medicine.stockDispenser -= quantity;

  // Update medicine status
  if (medicine.stockDispenser === 0) medicine.status = 'out-of-stock';
  else if (medicine.stockDispenser < medicine.reorderThreshold) medicine.status = 'low-stock';
  else medicine.status = 'available';

  // Record detailed sale
  await MedicineSale.create({
    medicineId: medicine._id,
    brandName: medicine.brandName,
    genericName: medicine.genericName,
    batchNumber: medicine.batchNumber,
    strength: medicine.strength,
    dosageForm: medicine.dosageForm,
    unitType: medicine.unitType,
    purchaseCost: medicine.purchaseCost,
    sellingPrice: medicine.sellingPrice,
    quantitySold: quantity,
    profit: (medicine.sellingPrice - medicine.purchaseCost) * quantity,
    stockBefore,
    stockAfter: medicine.stockDispenser,
    soldAt: new Date(),
  });

  await medicine.save();

  return {
    medicineId: medicine._id,
    brandName: medicine.brandName,
    genericName: medicine.genericName,
    batchNumber: medicine.batchNumber,
    strength: medicine.strength,
    quantitySold: quantity,
    sellingPrice: medicine.sellingPrice,
    purchaseCost: medicine.purchaseCost,
    profit: (medicine.sellingPrice - medicine.purchaseCost) * quantity,
    newDispenserStock: medicine.stockDispenser,
    status: medicine.status,
  };
};

/**
 * Bulk sell medicines
 */
export const bulkSellMedicineService = async (cart: BulkSellMedicinePayload) => {
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cart must contain at least one medicine');
  }

  const results = [];

  for (const item of cart) {
    const result = await sellMedicineService({
      medicineId: item.medicineId,
      quantity: item.quantity,
    });
    results.push(result);
  }

  return results;
};
