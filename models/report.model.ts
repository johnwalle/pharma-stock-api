import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicine extends Document {
  brandName: string;
  stock: number;
  price: number;
  expiry: Date;
}

const medicineSchema = new Schema<IMedicine>({
  brandName: { type: String, required: true },
  stock: { type: Number, required: true },
  price: { type: Number, required: true },
  expiry: { type: Date, required: true },
}, {
  timestamps: true
});

export default mongoose.model<IMedicine>('Medicine', medicineSchema);
