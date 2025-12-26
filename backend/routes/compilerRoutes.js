import express from 'express';
import { runCode } from '../controllers/compilerController.js';

const router = express.Router();

router.post('/run', runCode);

export default router;