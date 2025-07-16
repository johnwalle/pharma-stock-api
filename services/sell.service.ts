import Medicine from '../models/medicine.model';
import MedicineSale from '../models/sell.model';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

type SellMedicinePayload = {
  medicineId: string;
  quantity: number;
};

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

  if (medicine.currentStockLevel < quantity) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Not enough stock available');
  }

  // Update stock level
  medicine.currentStockLevel -= quantity;

  // Update status
  if (medicine.currentStockLevel === 0) {
    medicine.status = 'out-of-stock';
  } else if (medicine.currentStockLevel < medicine.reorderThreshold) {
    medicine.status = 'low-stock';
  } else {
    medicine.status = 'available';
  }

  // Get today’s start and end timestamps
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Check if this medicine has a sale record today
  const existingSale = await MedicineSale.findOne({
    medicineId: medicine._id,
    soldAt: { $gte: startOfToday, $lte: endOfToday },
  });

  if (existingSale) {
    // Update quantity in existing record
    existingSale.quantitySold += quantity;
    await existingSale.save();
  } else {
    // Create new sale record
    await MedicineSale.create({
      medicineId: medicine._id,
      brandName: medicine.brandName,
      quantitySold: quantity,
      soldAt: new Date(), // ensure soldAt is today
    });
  }

  await medicine.save();

  return {
    medicineId: medicine._id,
    brandName: medicine.brandName,
    newStockLevel: medicine.currentStockLevel,
    status: medicine.status,
  };
};
