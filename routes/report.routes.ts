import express from 'express';
import { getReport } from '../controllers/report.controller';
import { requireSignIn } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', requireSignIn, getReport);

export default router;
