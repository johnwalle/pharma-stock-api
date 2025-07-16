import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine extends Document {
  _id: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  currentStockLevel: number;
  reorderThreshold: number;
  reorderQuantity: number;
  expiryDate: string;
  batchNumber: string;
  storageConditions: string;
  supplierInfo: string;
  storageLocation: string;
  prescriptionStatus: string;
  pricePerUnit: number;
  receivedDate: string;
  status: 'available' | 'low-stock' | 'out-of-stock';
  imageURL?: string;
  notes?: string;
  isDeleted: boolean;
}

const medicineSchema = new Schema<IMedicine>(
  {
    brandName: { type: String, required: true, trim: true },
    genericName: { type: String, required: true, trim: true },
    dosageForm: {
      type: String,
      required: true,
      enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Inhaler', 'Other'],
      trim: true
    },
    strength: { type: String, required: true, trim: true },
    currentStockLevel: { type: Number, required: true, min: 0 },
    reorderThreshold: { type: Number, required: true, min: 0 },
    reorderQuantity: { type: Number, required: true, min: 0 },
    expiryDate: { type: String, required: true },
    batchNumber: { type: String, required: true, unique: true, trim: true },
    storageConditions: { type: String, trim: true },
    supplierInfo: { type: String, trim: true },
    storageLocation: {
      type: String,
      enum: ['Pharmacy Shelf A', 'Pharmacy Shelf B', 'Refrigerator', 'Controlled Storage', 'Other', ''],
      trim: true
    },
    prescriptionStatus: {
      type: String,
      required: true,
      enum: ['Prescription', 'OTC', 'Controlled'],
      trim: true
    },
    pricePerUnit: { type: Number, required: true, min: 0 },
    receivedDate: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['available', 'low-stock', 'out-of-stock'],
      default: 'available'
    },
    imageURL: { type: String, trim: true },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Indexes for faster queries
medicineSchema.index({ batchNumber: 1 });
medicineSchema.index({ genericName: 1, brandName: 1 });
medicineSchema.index({ isDeleted: 1, status: 1 });

export default mongoose.model<IMedicine>('Medicine', medicineSchema);