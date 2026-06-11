import express from 'express';
import getAllProductsRouter from './getAllProducts.js';
import getProductByIdRouter from './getProductById.js';
import getFeaturedNewArrivalsRouter from './getFeaturedNewArrivals.js';
import getFeaturedOnSaleRouter from './getFeaturedOnSale.js';
import postProductReviewRouter from './postProductReview.js';

const router = express.Router();

// Use individual routers
router.use('/', getAllProductsRouter); // Handles / and /?category=...
router.use('/', getFeaturedNewArrivalsRouter); // Handles /featured/new-arrivals
router.use('/', getFeaturedOnSaleRouter); // Handles /featured/on-sale
router.use('/', getProductByIdRouter); // Handles /:id
router.use('/', postProductReviewRouter); // Handles /:id/reviews

export default router;
