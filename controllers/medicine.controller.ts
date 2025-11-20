import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import Medicine from '../models/medicine.model';
import {
  createMedicineService,
  updateMedicineService,
  getMedicineById,
  deleteMedicineService,
  getAllMedicinesService,
} from '../services/medicine.service';
import { createAuditLog } from '../services/auditLog.service';

// ----------------------------------------------------
// CREATE MEDICINE (STORE ONLY)
// ----------------------------------------------------

export const createMedicine = catchAsync(async (req: Request, res: Response) => {
  console.log("Received create medicine request with body:", req.body);
  console.log("Uploaded image file:", req.file);

  const {
    brandName,
    genericName,
    dosageForm,
    strength,
    unitType,
    unitQuantity,
    subUnitQuantity,
    purchaseCost,
    sellingPrice,
    expiryDate,
    batchNumber,
    prescriptionStatus,
    receivedDate,
    reorderThreshold,
    storageConditions,
    supplierInfo,
    storageLocation,
    notes,
  } = req.body;

  // REQUIRED FIELDS
  const required = [
    brandName,
    genericName,
    dosageForm,
    strength,
    unitType,
    unitQuantity,
    sellingPrice,
    expiryDate,
    batchNumber,
    prescriptionStatus,
    receivedDate,
    reorderThreshold,
  ];

  if (required.some((v) => v === undefined || v === null || v === "")) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields");
  }

  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image file is required");
  }

  // Duplicate batch check
  const existingBatch = await Medicine.findOne({
    brandName,
    strength,
    batchNumber,
  });

  if (existingBatch) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This batch for the medicine already exists"
    );
  }

  // Determine stock status
  const today = new Date();
  const expiryDateObj = new Date(expiryDate);
  const receivedDateObj = new Date(receivedDate);

  let status: "available" | "low-stock" | "out-of-stock" | "expired" = "available";

  if (expiryDateObj < today) status = "expired";
  else if (Number(unitQuantity) === 0) status = "out-of-stock";
  else if (Number(unitQuantity) < Number(reorderThreshold)) status = "low-stock";

  // CREATE MEDICINE
  const medicine = await createMedicineService({
    brandName,
    genericName,
    dosageForm,
    strength,
    unitType,
    unitQuantity: Number(unitQuantity), // this is now the "store" stock
    subUnitQuantity: subUnitQuantity ? Number(subUnitQuantity) : undefined,
    purchaseCost: purchaseCost ? Number(purchaseCost) : undefined,
    sellingPrice: Number(sellingPrice),
    stockDispenser: 0, // dispenser initially empty
    expiryDate: expiryDateObj,
    batchNumber,
    prescriptionStatus,
    receivedDate: receivedDateObj,
    reorderThreshold: Number(reorderThreshold),
    storageConditions: storageConditions || "",
    supplierInfo: supplierInfo || "",
    storageLocation: storageLocation || "",
    notes: notes || "",
    status,
    file: req.file, // image upload
  });

  // AUDIT LOG
  await createAuditLog({
    userId: req.currentUser._id,
    userName: req.currentUser.fullName,
    action: "Add",
    details: `Added medicine: ${brandName} (${strength}, Batch: ${batchNumber}, Qty in Store: ${unitQuantity})`,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Medicine created successfully",
    data: medicine,
  });
});



// ----------------------------------------------------
// MOVE FROM STORE → DISPENSER
// ----------------------------------------------------
export const moveToDispenser = catchAsync(async (req: Request, res: Response) => {
  const { medicineId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid move quantity');
  }

  // Get Mongoose document
  const med = await Medicine.findById(medicineId);
  if (!med) throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');

  if (quantity > med.unitQuantity) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Not enough stock in store');
  }

  // Move stock
  med.unitQuantity -= Number(quantity); // decrement store
  med.stockDispenser += Number(quantity); // increment dispenser

  // Recalculate status based only on store stock
  const today = new Date();
  if (med.expiryDate < today) med.status = 'expired';
  else if (med.unitQuantity === 0) med.status = 'out-of-stock';
  else if (med.unitQuantity < med.reorderThreshold) med.status = 'low-stock';
  else med.status = 'available';

  // Save changes
  await med.save();

  // Audit log
  await createAuditLog({
    userId: req.currentUser._id,
    userName: req.currentUser.fullName,
    action: 'Transfer',
    details: `Moved ${quantity} units of ${med.brandName} (${med.strength}) from Store → Dispenser`,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Stock moved to dispenser successfully',
    data: med,
  });
});


// ----------------------------------------------------
// UPDATE MEDICINE
// ----------------------------------------------------
export const updateMedicine = catchAsync(async (req: Request, res: Response) => {
  const { medicineId } = req.params;

  const existingMedicine = await getMedicineById(medicineId);
  if (!existingMedicine) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');
  }

  const {
    brandName,
    genericName,
    dosageForm,
    strength,
    unitType,
    unitQuantity,
    subUnitQuantity,
    purchaseCost,
    sellingPrice,
    stockStore,
    stockDispenser,
    expiryDate,
    batchNumber,
    prescriptionStatus,
    receivedDate,
    reorderThreshold,
    storageConditions,
    supplierInfo,
    storageLocation,
    notes,
  } = req.body;

  // Prevent duplicate batch
  if (batchNumber) {
    const existing = await Medicine.findOne({
      brandName: brandName || existingMedicine.brandName,
      strength: strength || existingMedicine.strength,
      batchNumber,
    });

    if (existing && existing._id.toString() !== medicineId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Medicine with this batch already exists'
      );
    }
  }

  // Build update payload
  const updatePayload: any = {
    ...(brandName && { brandName }),
    ...(genericName && { genericName }),
    ...(dosageForm && { dosageForm }),
    ...(strength && { strength }),
    ...(unitType && { unitType }),
    ...(unitQuantity !== undefined && { unitQuantity: Number(unitQuantity) }),
    ...(subUnitQuantity !== undefined && { subUnitQuantity: Number(subUnitQuantity) }),
    ...(purchaseCost !== undefined && { purchaseCost: Number(purchaseCost) }),
    ...(sellingPrice !== undefined && { sellingPrice: Number(sellingPrice) }),
    ...(stockStore !== undefined && { stockStore: Number(stockStore) }),
    ...(stockDispenser !== undefined && { stockDispenser: Number(stockDispenser) }),
    ...(expiryDate && { expiryDate: new Date(expiryDate) }),
    ...(batchNumber && { batchNumber }),
    ...(prescriptionStatus && { prescriptionStatus }),
    ...(receivedDate && { receivedDate: new Date(receivedDate) }),
    ...(reorderThreshold !== undefined && { reorderThreshold: Number(reorderThreshold) }),
    ...(storageConditions && { storageConditions }),
    ...(supplierInfo && { supplierInfo }),
    ...(storageLocation && { storageLocation }),
    ...(notes && { notes }),
  };

  if (req.file) {
    updatePayload.imageURL = req.file.path;
  }

  // Auto-update status
  const newStockStore = updatePayload.unitQuantity ?? existingMedicine.unitQuantity ?? 0;
  const newStockDispenser = updatePayload.stockDispenser ?? existingMedicine.stockDispenser ?? 0;
  const newThreshold = updatePayload.reorderThreshold ?? existingMedicine.reorderThreshold ?? 0;
  const expiryToCheck = updatePayload.expiryDate ?? existingMedicine.expiryDate;
  const today = new Date();

  if (expiryToCheck && new Date(expiryToCheck) < today) {
    updatePayload.status = 'expired';
  } else {
    const totalStock = newStockStore + newStockDispenser;
    if (totalStock === 0) updatePayload.status = 'out-of-stock';
    else if (totalStock < newThreshold) updatePayload.status = 'low-stock';
    else updatePayload.status = 'available';
  }

  const updatedMedicine = await updateMedicineService(medicineId, updatePayload);

  // Create audit log
  await createAuditLog({
    userId: req.currentUser._id,
    userName: req.currentUser.fullName,
    action: 'Edit',
    details: `Updated medicine: ${brandName || existingMedicine.brandName} (${strength || existingMedicine.strength}, Batch: ${batchNumber || existingMedicine.batchNumber})`,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Medicine updated successfully',
    data: updatedMedicine,
  });
});

// ----------------------------------------------------
// DELETE MEDICINE
// ----------------------------------------------------
export const deleteMedicine = catchAsync(async (req: Request, res: Response) => {
  const { medicineId } = req.params;

  const medicine = await getMedicineById(medicineId);
  if (!medicine) throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');

  await deleteMedicineService(medicineId);

  await createAuditLog({
    userId: req.currentUser._id,
    userName: req.currentUser.fullName,
    action: 'Delete',
    details: `Deleted medicine: ${medicine.brandName} (${medicine.strength}, Batch: ${medicine.batchNumber})`,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Medicine deleted successfully',
  });
});

// ----------------------------------------------------
// GET MEDICINE
// ----------------------------------------------------
export const getMedicine = catchAsync(async (req: Request, res: Response) => {
  const { medicineId } = req.params;

  const medicine = await getMedicineById(medicineId);
  if (!medicine) throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');

  res.status(httpStatus.OK).json({
    success: true,
    data: medicine,
  });
});

// ----------------------------------------------------
// GET ALL MEDICINES
// ----------------------------------------------------
export const getAllMedicines = catchAsync(async (req: Request, res: Response) => {
  const medicines = await getAllMedicinesService(req.query);

  res.status(httpStatus.OK).json({
    success: true,
    data: medicines,
  });
});


//get medicines which are in dispensers or which have values of greater than 0 in stockDispenser
export const getMedicinesInDispenser = catchAsync(async (req: Request, res: Response) => {
  const medicines = await Medicine.find({ stockDispenser: { $gt: 0 }, isDeleted: false });
  res.status(httpStatus.OK).json({
    success: true,
    data: medicines,
  });
});
