import express from 'express';
import productsRouter from './products/index.js';
import categoriesRouter from './categories/index.js';
import ordersRouter from './orders/index.js'
const router = express.Router();

// Use sub-routers for different admin functionalities
router.use('/products', productsRouter);
router.use('/categories', categoriesRouter);
router.use('/orders', ordersRouter);
export default router;
