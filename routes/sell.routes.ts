// routes/sell.routes.ts
import express from 'express';
import {
  sellMedicineController,
  getDashboardAnalyticsController,
  bulkSellMedicineController, // new controller for bulk
} from '../controllers/sell.controller';
import { adminMiddleware, requireSignIn } from '../middlewares/auth.middleware';

const router = express.Router();

// Single or bulk sell
router.post('/', requireSignIn, adminMiddleware, bulkSellMedicineController);

// Dashboard analytics
router.get('/analytics', requireSignIn, getDashboardAnalyticsController);

export default router;
