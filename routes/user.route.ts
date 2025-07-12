import { Router } from 'express';
import { register, logout, getUsers, deleteUser, updateUser, createUserByAdmin } from '../controllers/user.controller';
import { requireSignIn, adminMiddleware } from '../middlewares/auth.middleware';


const router = Router();


router.post('/register', register);
router.post('/logout', logout);
router.post('/create-user', requireSignIn, adminMiddleware, createUserByAdmin);
router.put('/update/:id', requireSignIn, updateUser);
router.delete('/delete-user/:id', requireSignIn, adminMiddleware, deleteUser); // ✅ protected delete

// get all users
router.get('/', requireSignIn, getUsers);


export default router;
