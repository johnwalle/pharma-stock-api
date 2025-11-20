import httpStatus from 'http-status';
import { Types } from 'mongoose';
import Medicine, { IMedicine } from '../models/medicine.model';
import ApiError from '../utils/ApiError';
import logger from '../config/logger';
const cloudinary = require('../config/cloudinary.config');

interface CreateMedicineInput extends Partial<IMedicine> {
  file?: Express.Multer.File;
}

// --------------------------
// CREATE MEDICINE SERVICE
// --------------------------
export const createMedicineService = async (data: CreateMedicineInput) => {
  const {
    brandName,
    genericName,
    dosageForm,
    strength,
    unitType,
    unitQuantity,
    subUnitQuantity, // optional
    purchaseCost,
    sellingPrice,
    reorderThreshold = 0,
    expiryDate,
    batchNumber,
    storageConditions,
    supplierInfo,
    storageLocation,
    prescriptionStatus,
    receivedDate,
    notes = '',
    file, // Multer file
  } = data;

  // --------------------------
  // Required fields
  // --------------------------
  const required = [
    brandName, genericName, dosageForm, strength, unitType,
    unitQuantity, sellingPrice, expiryDate, batchNumber,
    prescriptionStatus, receivedDate
  ];
  if (required.some(f => f === undefined || f === null || f === '')) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
  }

  if (!file || !file.buffer) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image file is required');
  }

  // --------------------------
  // Validate numeric fields
  // --------------------------
  if (Number(unitQuantity) < 0) throw new ApiError(httpStatus.BAD_REQUEST, 'unitQuantity cannot be negative');
  if (subUnitQuantity !== undefined && Number(subUnitQuantity) <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'subUnitQuantity must be positive if provided');
  }
  if (Number(sellingPrice) < 0) throw new ApiError(httpStatus.BAD_REQUEST, 'sellingPrice cannot be negative');
  if (purchaseCost !== undefined && Number(purchaseCost) < 0) throw new ApiError(httpStatus.BAD_REQUEST, 'purchaseCost cannot be negative');

  // --------------------------
  // Prescription validation
  // --------------------------
  const validPrescription = ['Prescription', 'OTC', 'Controlled'];
  if (!validPrescription.includes(prescriptionStatus!)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid prescription status value');
  }

  // --------------------------
  // Duplicate batch check
  // --------------------------
  const existing = await Medicine.findOne({ brandName, strength, batchNumber });
  if (existing) throw new ApiError(httpStatus.BAD_REQUEST, 'This batch for the medicine already exists');

  // --------------------------
  // Upload image
  // --------------------------
  const imageURL = await new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'Medicines', resource_type: 'image' },
      (error: any, result: any) => {
        if (error || !result) reject(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload image'));
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });

  // --------------------------
  // Status calculation (based on unitQuantity)
  // --------------------------
  const today = new Date();
  const expiryDateObj = expiryDate ? new Date(expiryDate) : undefined;

  let status: 'available' | 'low-stock' | 'out-of-stock' | 'expired' = 'available';

  if (expiryDateObj && expiryDateObj < today) status = 'expired';
  else if (Number(unitQuantity) === 0) status = 'out-of-stock';
  else if (Number(unitQuantity) < Number(reorderThreshold)) status = 'low-stock';

  //check the date
  if (!receivedDate) throw new ApiError(httpStatus.BAD_REQUEST, "Received date is required");
  const receivedDateObj = new Date(receivedDate);



  // --------------------------
  // Save medicine
  // --------------------------
  const newMedicine = await Medicine.create({
    brandName,
    genericName,
    dosageForm,
    strength,
    unitType,
    unitQuantity: Number(unitQuantity), // total stock in store
    subUnitQuantity: subUnitQuantity ? Number(subUnitQuantity) : undefined, // optional
    stockDispenser: 0, // initially zero
    purchaseCost: purchaseCost ? Number(purchaseCost) : undefined,
    sellingPrice: Number(sellingPrice),
    reorderThreshold: Number(reorderThreshold),
    expiryDate: expiryDateObj!,
    batchNumber,
    storageConditions: storageConditions || '',
    supplierInfo: supplierInfo || '',
    storageLocation: storageLocation || '',
    prescriptionStatus,
    receivedDate: new Date(receivedDateObj),
    notes,
    imageURL,
    status,
    isDeleted: false,
  });

  return newMedicine;
};


// --------------------------
// UPDATE MEDICINE SERVICE
// --------------------------
interface UpdateMedicineInput extends Partial<IMedicine> {
  file?: Express.Multer.File;
}

export const updateMedicineService = async (
  medicineId: string,
  updateData: UpdateMedicineInput
) => {
  if (!Types.ObjectId.isValid(medicineId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid medicine ID');
  }

  const existingMedicine = await Medicine.findById(medicineId);
  if (!existingMedicine || existingMedicine.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');
  }

  // Handle file upload
  if (updateData.file && updateData.file.buffer) {
    const imageURL = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'Medicines', resource_type: 'image' },
        (error: any, result: any) => {
          if (error || !result) {
            reject(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload image'));
          } else resolve(result.secure_url);
        }
      ).end(updateData.file!.buffer);
    });
    updateData.imageURL = imageURL;
  }
  delete updateData.file;

  // Auto-update status based on unitQuantity + stockDispenser
  const storeQty = updateData.unitQuantity ?? existingMedicine.unitQuantity ?? 0;
  const dispenserQty = updateData.stockDispenser ?? existingMedicine.stockDispenser ?? 0;
  const totalStock = storeQty + dispenserQty;
  const threshold = updateData.reorderThreshold ?? existingMedicine.reorderThreshold ?? 0;
  const expiry = updateData.expiryDate ?? existingMedicine.expiryDate;
  const today = new Date();

  if (expiry && new Date(expiry) < today) {
    updateData.status = 'expired';
  } else if (totalStock === 0) {
    updateData.status = 'out-of-stock';
  } else if (totalStock < threshold) {
    updateData.status = 'low-stock';
  } else {
    updateData.status = 'available';
  }

  const updatedMedicine = await Medicine.findByIdAndUpdate(
    medicineId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updatedMedicine;
};


export const getMedicineById = async (medicineId: string) => {
  if (!Types.ObjectId.isValid(medicineId)) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid medicine ID');
  const medicine = await Medicine.findById(medicineId).lean();
  if (!medicine || medicine.isDeleted) throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found or deleted');
  return medicine;
};

export const deleteMedicineService = async (medicineId: string) => {
  if (!Types.ObjectId.isValid(medicineId)) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid medicine ID');
  const existingMedicine = await Medicine.findById(medicineId);
  if (!existingMedicine || existingMedicine.isDeleted) throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');
  existingMedicine.isDeleted = true;
  await existingMedicine.save();
  return true;
};

interface GetAllMedicinesParams {
  search?: string;
  status?: string;
  expiry?: '30days' | '6months';
  sortBy?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

export const getAllMedicinesService = async (query: GetAllMedicinesParams) => {
  const { search = '', status = '', expiry = '', sortBy = 'expiryDate', order = 'desc', limit = 10, page = 1 } = query;
  const filter: Record<string, any> = { isDeleted: false };

  if (search.trim()) filter.$or = [
    { brandName: { $regex: search, $options: 'i' } },
    { genericName: { $regex: search, $options: 'i' } },
    { batchNumber: { $regex: search, $options: 'i' } },
  ];

  if (status) filter.status = status;

  if (expiry === '30days' || expiry === '6months') {
    const now = new Date();
    const future = new Date();
    if (expiry === '30days') future.setDate(now.getDate() + 30);
    else future.setMonth(now.getMonth() + 6);
    filter.expiryDate = { $gte: now, $lte: future };
  }

  const sort: Record<string, 1 | -1> = { [sortBy]: order === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [medicines, total] = await Promise.all([
    Medicine.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Medicine.countDocuments(filter),
  ]);

  return { medicines, total, page, perPage: limit, totalPages: Math.ceil(total / limit) };
};
