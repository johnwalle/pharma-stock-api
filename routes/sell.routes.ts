import express from 'express';
import { sellMedicineController, getDashboardAnalyticsController } from '../controllers/sell.controller';
import { adminMiddleware, requireSignIn } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/', requireSignIn, adminMiddleware, sellMedicineController);
router.get('/analytics', requireSignIn, getDashboardAnalyticsController);

export default router;

