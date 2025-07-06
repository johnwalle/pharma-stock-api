import User from '../models/user.model';

const getUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

const getUserById = async (id: string) => {
  return User
    .findById(id)
    .select('-password -__v') // Exclude password and version field
    .lean(); // Return plain JavaScript object
}

export default {
  getUserByEmail,
  getUserById,
};
