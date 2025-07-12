// services/medicine.service.ts
import httpStatus from 'http-status';
import Medicine, { IMedicine } from '../models/medicine.model';
import ApiError from '../utils/ApiError';
import logger from '../config/logger';



const cloudinary = require('../config/cloudinary.config');

interface CreateMedicineInput extends Partial<IMedicine> {
    file?: Express.Multer.File;
}


export const createMedicineService = async (data: CreateMedicineInput) => {
    const {
        brandName,
        genericName,
        dosageForm,
        strength,
        currentStockLevel,
        reorderThreshold = 0,
        reorderQuantity = 0,
        expiryDate,
        batchNumber,
        storageConditions,
        supplierInfo,
        storageLocation,
        prescriptionStatus,
        pricePerUnit,
        receivedDate,
        notes = '',
        file,
    } = data;

    // ✅ Check for missing required fields
    const required = [
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

    if (required.some((f) => f === undefined || f === null || f === '')) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
    }

    if (!file || !file.buffer) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Image file is required');
    }

    // ✅ Validate numeric fields
    const numericFields = [
        { name: 'currentStockLevel', value: currentStockLevel },
        { name: 'reorderThreshold', value: reorderThreshold },
        { name: 'reorderQuantity', value: reorderQuantity },
        { name: 'pricePerUnit', value: pricePerUnit },
    ];

    for (const field of numericFields) {
        if (field.value !== undefined && Number(field.value) < 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, `${field.name} cannot be negative`);
        }
    }

    // ✅ Validate prescription status
    const validPrescription = ['Prescription', 'OTC', 'Controlled'];
    if (!validPrescription.includes(prescriptionStatus!)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid prescription status value');
    }

    // ✅ Check for duplicate batch number
    const existing = await Medicine.findOne({ batchNumber });
    if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Medicine with this batch number already exists');
    }

    // ✅ Upload image to Cloudinary
    const imageURL: string = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: 'Medicines',
                resource_type: 'image',
            },
            (error: any, result: any) => {
                if (error || !result) {
                    logger.error(`Cloudinary upload error: ${error?.message || 'Unknown error'}`);
                    reject(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload image'));
                } else {
                    logger.info('📸 Image uploaded to Cloudinary');
                    resolve(result.secure_url);
                }
            }
        ).end(file.buffer);
    });

    // ✅ Create medicine in DB
    const newMedicine = await Medicine.create({
        brandName,
        genericName,
        dosageForm,
        strength,
        currentStockLevel,
        reorderThreshold,
        reorderQuantity,
        expiryDate,
        batchNumber,
        storageConditions,
        supplierInfo,
        storageLocation,
        prescriptionStatus,
        pricePerUnit,
        receivedDate,
        notes,
        imageURL,
        isDeleted: false,
    });

    return newMedicine;
};



// services/medicine.service.ts
import { Types } from 'mongoose';

/**
 * Update a medicine by its ID
 * @param medicineId - The ID of the medicine to update
 * @param updateData - The fields to update
 * @returns The updated medicine document
 */
interface UpdateMedicineInput extends Partial<IMedicine> {
    file?: Express.Multer.File;
}

export const updateMedicineService = async (
    medicineId: string,
    updateData: UpdateMedicineInput
) => {
    if (!Types.ObjectId.isValid(medicineId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid medicine ID format');
    }

    const existingMedicine = await Medicine.findById(medicineId);
    if (!existingMedicine) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found');
    }

    // ✅ If a file is provided, upload it to Cloudinary and update imageURL
    if (updateData.file && updateData.file.buffer) {
        const imageURL: string = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'Medicines',
                    resource_type: 'image',
                },
                (error: any, result: any) => {
                    if (error || !result) {
                        logger.error(`Cloudinary upload error: ${error?.message || 'Unknown error'}`);
                        reject(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload image'));
                    } else {
                        logger.info('📸 Image updated in Cloudinary');
                        resolve(result.secure_url);
                    }
                }
            ).end(updateData.file!.buffer); // <--- use non-null assertion here
        });

        updateData.imageURL = imageURL;
    }

    // ✅ Remove file buffer from update data before saving to DB
    delete updateData.file;

    const updatedMedicine = await Medicine.findByIdAndUpdate(
        medicineId,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    return updatedMedicine;
};



//get medicine by ID service
export const getMedicineById = async (medicineId: string) => {
    if (!Types.ObjectId.isValid(medicineId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid medicine ID format');
    }

    const medicine = await Medicine.findById(medicineId).lean();
    // check also if it is deleted
    if (!medicine || medicine.isDeleted) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found or has been deleted');
    }
    return medicine;
}

//delete medicine service
export const deleteMedicineService = async (medicineId: string) => {
    if (!Types.ObjectId.isValid(medicineId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid medicine ID format');
    }

    const existingMedicine = await Medicine.findById(medicineId);
    if (!existingMedicine || existingMedicine.isDeleted) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Medicine not found or has already been deleted');
    }
    // Soft delete the medicine
    existingMedicine.isDeleted = true;
    await existingMedicine.save();
    return true; // Return true to indicate successful deletion
}


//get all medicines service

interface GetAllMedicinesParams {
    search?: string;
    status?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    page?: number;
}


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
  const {
    search = '',
    status = '',
    expiry = '',
    sortBy = 'expiryDate',
    order = 'desc',
    limit = 10,
    page = 1,
  } = query;

  const filter: Record<string, any> = {
    isDeleted: false,
  };

  // Search by text
  if (search.trim()) {
    filter.$or = [
      { brandName: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { batchNumber: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by status
  if (status) {
    filter.status = status;
  }

  // Filter by expiry
  if (expiry === '30days' || expiry === '6months') {
    const now = new Date();
    const futureDate = new Date();

    if (expiry === '30days') {
      futureDate.setDate(now.getDate() + 30);
    } else if (expiry === '6months') {
      futureDate.setMonth(now.getMonth() + 6);
    }

    filter.expiryDate = {
      $gte: now,
      $lte: futureDate,
    };
  }

  // Sort
  const sort: Record<string, 1 | -1> = {
    [sortBy]: order === 'asc' ? 1 : -1,
  };

  const skip = (page - 1) * limit;

  const [medicines, total] = await Promise.all([
    Medicine.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Medicine.countDocuments(filter),
  ]);

  return {
    medicines,
    total,
    page,
    perPage: limit,
    totalPages: Math.ceil(total / limit),
  };
};

