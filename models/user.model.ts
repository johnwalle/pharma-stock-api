import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export type UserRole = 'admin' | 'pharmacist' | 'manager';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string; // Optional for OAuth users
  fullName: string;
  role: UserRole;
  googleId?: string;
  isDeleted: boolean;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance method
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId; // only required if not a Google user
      },
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'pharmacist', 'manager'],
      default: 'pharmacist',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows many null/undefined values
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
  },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash password before save
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error as Error);
  }
});



const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
