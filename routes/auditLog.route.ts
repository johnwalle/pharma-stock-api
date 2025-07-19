import express from 'express';
import { getLogs } from '../controllers/auditLog.controller';
import { requireSignIn } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', requireSignIn, getLogs);

export default router;
