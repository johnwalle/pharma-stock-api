import express from 'express';
import { createMedicine, deleteMedicine, getAllMedicines, getMedicine, updateMedicine } from '../controllers/medicine.controller';
import { requireSignIn, adminMiddleware } from '../middlewares/auth.middleware';
const multer = require('multer');
const router = express.Router();
const upload = multer();


//public routes

//geta medicine by id
router.get('/:medicineId', getMedicine);

//get all medicines
router.get('/', getAllMedicines);



// Protected and role-restricted routes
router.post(
  '/create',
  requireSignIn,
  adminMiddleware,
  upload.single('image'), // multer handles file parsing
  createMedicine
);

router.put(
  '/update/:medicineId',
  requireSignIn,
  adminMiddleware,
  upload.single('image'), // multer handles file parsing
  updateMedicine // Assuming this is the update function, adjust if needed
)

router.delete(
  '/delete/:medicineId',
  requireSignIn,
  adminMiddleware,
  deleteMedicine
);

// Export the router
export default router;