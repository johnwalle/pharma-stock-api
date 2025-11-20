import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine extends Document {
  _id: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;

  unitType: string;
  unitQuantity: number; // units in storage
  subUnitQuantity?: number;

  purchaseCost: number;
  sellingPrice: number;

  stockDispenser: number;
  reservedStock?: number;

  reorderThreshold: number;
  reorderQuantity?: number;

  expiryDate: Date;
  batchNumber: string;

  storageConditions?: string;
  supplierInfo?: string;
  storageLocation?: string;

  prescriptionStatus: 'Prescription' | 'OTC' | 'Controlled';
  receivedDate: Date;

  status: 'available' | 'low-stock' | 'out-of-stock' | 'expired';
  imageURL?: string;
  notes?: string;
  isDeleted: boolean;
}

const medicineSchema = new Schema<IMedicine>(
  {
    brandName: { type: String, required: true, trim: true },
    genericName: { type: String, required: true, trim: true },
    dosageForm: { type: String, required: true, trim: true },
    strength: { type: String, required: true, trim: true },

    unitType: { type: String, required: true, trim: true },
    unitQuantity: { type: Number, required: true, min: 0, default: 0 }, // storage units
    subUnitQuantity: { type: Number, required: false, min: 0 },

    purchaseCost: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },

    stockDispenser: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, required: false, min: 0, default: 0 },

    reorderThreshold: { type: Number, required: true, min: 0, default: 10 },
    reorderQuantity: { type: Number, required: false, min: 0, default: 50 },

    expiryDate: { type: Date, required: true },
    batchNumber: { type: String, required: true, trim: true },

    storageConditions: { type: String, trim: true },
    supplierInfo: { type: String, trim: true },
    storageLocation: {
      type: String,
      enum: [
        'Pharmacy Shelf A',
        'Pharmacy Shelf B',
        'Refrigerator',
        'Controlled Storage',
        'Store Room',
        'Dispenser',
        'Other',
        '',
      ],
      trim: true,
    },

    prescriptionStatus: {
      type: String,
      required: true,
      enum: ['Prescription', 'OTC', 'Controlled'],
      trim: true,
    },

    receivedDate: { type: Date, required: true },

    status: {
      type: String,
      required: true,
      enum: ['available', 'low-stock', 'out-of-stock', 'expired'],
      default: 'available',
    },

    imageURL: { type: String, trim: true },
    notes: { type: String, trim: true },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound unique index for per-batch uniqueness
medicineSchema.index({ brandName: 1, strength: 1, batchNumber: 1 }, { unique: true });
medicineSchema.index({ genericName: 1, brandName: 1 });
medicineSchema.index({ expiryDate: 1 });
medicineSchema.index({ isDeleted: 1, status: 1 });

// Auto-update status before saving
medicineSchema.pre<IMedicine>('save', function (next) {
  const totalStock = this.unitQuantity + this.stockDispenser;
  const today = new Date();

  if (this.expiryDate < today) this.status = 'expired';
  else if (totalStock === 0) this.status = 'out-of-stock';
  else if (totalStock < this.reorderThreshold) this.status = 'low-stock';
  else this.status = 'available';

  next();
});

export default mongoose.model<IMedicine>('Medicine', medicineSchema);
