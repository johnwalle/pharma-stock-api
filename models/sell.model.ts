import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicineSale extends Document {
  medicineId: mongoose.Types.ObjectId | string;
  brandName: string;
  genericName: string;
  batchNumber: string;
  strength: string;
  dosageForm: string;
  unitType: string;
  quantitySold: number;
  soldAt: Date;
  sellingPrice: number;
  purchaseCost: number;
  profit: number;
  stockBefore: number;
  stockAfter: number;
}

const medicineSaleSchema = new Schema<IMedicineSale>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    brandName: { type: String, required: true },
    genericName: { type: String, required: true },
    batchNumber: { type: String, required: true },
    strength: { type: String, required: true },
    dosageForm: { type: String, required: true },
    unitType: { type: String, required: true },
    quantitySold: { type: Number, required: true, min: 1 },
    soldAt: { type: Date, default: Date.now },
    sellingPrice: { type: Number, required: true, min: 0 },
    purchaseCost: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMedicineSale>('MedicineSale', medicineSaleSchema);
