import User from '../models/user.model';

const getUserByEmail = async (email: string) => {
  return User.findOne({ email });
};


// get all users except the current one and exclude deleted users
const getUsersService = async (currentUserId: string) => {
  return User
    .find({ 
      _id: { $ne: currentUserId },
      isDeleted: false // only include users who are not deleted
    })
    .select('-password -__v') // Exclude sensitive fields
    .lean(); // Return plain JS object
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
  getUsersService
};
