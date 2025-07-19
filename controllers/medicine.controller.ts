// controllers/medicine.controller.ts
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



/**
 * @desc    Create a new medicine
 * @route   POST /api/v1/medicines
 * @access  Admin or Pharmacist only
 */

export const createMedicine = catchAsync(async (req: Request, res: Response) => {
  const {
    brandName,
    genericName,
    dosageForm,
    strength,
    currentStockLevel,
    expiryDate,
    batchNumber,
    prescriptionStatus,
    pricePerUnit,
    receivedDate,
  } = req.body;

  // ✅ Validate required fields
  const requiredFields = [
    brandName,
    genericName,
    dosageForm,
    strength,
    currentStockLevel,
    expiryDate,
    batchNumber,
    prescriptionStatus,
    pricePerUnit,
    receivedDate,
  ];

  if (requiredFields.some(field => field === undefined || field === null || field === '')) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
  }

  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image file is required');
  }

  // ✅ Create the medicine entry
  const medicine = await createMedicineService({
    ...req.body,
    file: req.file,
  });

  // ✅ Log the action to audit log
  await createAuditLog({
    userId: req.currentUser._id,
    userName: req.currentUser.fullName,          // ⬅️ Assumes auth middleware sets this
    action: 'Add',
    details: `Added medicine: ${brandName} (${strength}, Batch: ${batchNumber}, Qty: ${currentStockLevel})`,
  });

  // ✅ Response
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Medicine created successfully',
    data: medicine,
  });
});





/**
 * @desc    Update an existing medicine
 * @route   PUT /api/v1/medicines/:medicineId
 * @access  Admin or Pharmacist only
 */
export const updateMedicine = catchAsync(async (req: Request, res: Response) => {
  const { medicineId } = req.params;

  // ✅ Check if medicine exists
  const existingMedicine = await getMedicineById(medicineId);
  if (!existingMedicine) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');
  }




  // ✅ Validate input if needed (optional based on your schema/rules)
  const {
    brandName,
    genericName,
    dosageForm,
    strength,
    currentStockLevel,
    expiryDate,
    batchNumber,
    prescriptionStatus,
    pricePerUnit,
    receivedDate,
  } = req.body;

  // ✅ Check for duplicate batch number
  if (batchNumber) {
    const existing = await Medicine.findOne({ batchNumber });
    if (existing && existing._id.toString() !== medicineId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Medicine with this batch number already exists');
    }
  }


  const updatePayload: any = {
    ...(brandName && { brandName }),
    ...(genericName && { genericName }),
    ...(dosageForm && { dosageForm }),
    ...(strength && { strength }),
    ...(currentStockLevel && { currentStockLevel }),
    ...(expiryDate && { expiryDate }),
    ...(batchNumber && { batchNumber }),
    ...(prescriptionStatus && { prescriptionStatus }),
    ...(pricePerUnit && { pricePerUnit }),
    ...(receivedDate && { receivedDate }),
  };

  // ✅ Handle optional file upload
  if (req.file) {
    updatePayload.file = req.file;
  }

  const updatedMedicine = await updateMedicineService(medicineId, updatePayload);

  // ✅ Log the action to audit log
  await createAuditLog({
    userId: req.currentUser._id,
    userName: req.currentUser.fullName,          // ⬅️ Assumes auth middleware sets this
    action: 'Edit',
    details: `Updated medicine: ${brandName || existingMedicine.brandName} (${strength || existingMedicine.strength}, Batch: ${batchNumber || existingMedicine.batchNumber}, Qty: ${currentStockLevel || existingMedicine.currentStockLevel})`,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Medicine updated successfully',
    data: updatedMedicine,
  });
});


/**
 * @desc    UDelete a medicine
 * @route   DELETE /api/medicines/:medicineId
 * @access  Admin or Pharmacist only
**/

export const deleteMedicine = catchAsync(async (req: Request, res: Response) => {
  const { medicineId } = req.params;
  // ✅ Check if medicine exists
  const existingMedicine = await getMedicineById(medicineId);
  if (!existingMedicine) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');
  }


  await deleteMedicineService(medicineId);

  // ✅ Log the action to audit log
  await createAuditLog({
    userId: req.currentUser._id,
    userName: req.currentUser.fullName,          // ⬅️ Assumes auth middleware sets this
    action: 'Delete',
    details: `Deleted medicine: ${existingMedicine.brandName} (${existingMedicine.strength}, Batch: ${existingMedicine.batchNumber}, Qty: ${existingMedicine.currentStockLevel})`,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Medicine deleted successfully',
  });
}
);

/**
 * @desc    Get a medicine by ID
 * @route   GET /api/medicines/:medicineId
 * @access  Public
 */

export const getMedicine = catchAsync(async (req: Request, res: Response) => {
  const { medicineId } = req.params;

  // ✅ Check if medicine exists
  const medicine = await getMedicineById(medicineId);

  res.status(httpStatus.OK).json({
    success: true,
    data: medicine,
  });
});


/**
 * @desc    Get All Medicines
 * @route   GET /api/medicines
 * @access  Public
 */

export const getAllMedicines = catchAsync(async (req: Request, res: Response) => {
  const medicines = await getAllMedicinesService(req.query);

  res.status(httpStatus.OK).json({
    success: true,
    data: medicines,
  });
});

