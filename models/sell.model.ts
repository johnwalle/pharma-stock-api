// models/medicineSale.model.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicineSale extends Document {
  medicineId: object | string;
  brandName: string;
  quantitySold: number;
  soldAt: Date;
}

const medicineSaleSchema = new Schema<IMedicineSale>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    brandName: {
      type: String,
      required: true,
    },
    quantitySold: {
      type: Number,
      required: true,
      min: 1,
    },
    soldAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMedicineSale>('MedicineSale', medicineSaleSchema);
