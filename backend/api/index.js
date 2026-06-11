import express from "express";

import customersRouter from './client/index.js';

const router = express.Router();

router.use('/client', customersRouter);


export default router;
