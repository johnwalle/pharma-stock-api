import mongoose from 'mongoose';
import tokenTypes from '../config/token';

const tokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
  type: {
    type: String,
    enum: Object.values(tokenTypes),
    required: true,
  },
});

export default mongoose.model('Token', tokenSchema);
