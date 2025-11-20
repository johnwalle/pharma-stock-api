import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicineSale extends Document {
  medicineId: mongoose.Types.ObjectId | string;
  brandName: string;
  genericName?: string;
  batchNumber?: string;
  strength?: string;
  dosageForm?: string;
  unitType?: string;
  quantitySold: number;
  stockBefore: number;
  stockAfter: number;
  soldAt: Date;
  sellingPrice: number;
  purchaseCost: number;
  profit: number;
  prescriptionStatus?: 'Prescription' | 'OTC' | 'Controlled';
  expiry?: Date;
}

const medicineSaleSchema = new Schema<IMedicineSale>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    brandName: { type: String, required: true },
    genericName: { type: String },
    batchNumber: { type: String },
    strength: { type: String },
    dosageForm: { type: String },
    unitType: { type: String },
    quantitySold: { type: Number, required: true, min: 1 },
    stockBefore: { type: Number, required: true, min: 0 },
    stockAfter: { type: Number, required: true, min: 0 },
    soldAt: { type: Date, default: Date.now },
    sellingPrice: { type: Number, required: true, min: 0 },
    purchaseCost: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    prescriptionStatus: { type: String, enum: ['Prescription', 'OTC', 'Controlled'] },
    expiry: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMedicineSale>('MedicineSale', medicineSaleSchema);
