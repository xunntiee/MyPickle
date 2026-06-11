import express from 'express';
import { listTrevoCategories, listTrevoProducts, TrevoApiError } from '../../../lib/trevo-client.js';
import {
    applyMyPickProductFilters,
    buildCategoryMaps,
    mapTrevoProduct,
    paginate,
    sortMyPickProducts,
} from '../../../lib/trevo-mapper.js';

const router = express.Router();

function sendTrevoError(res, error) {
    if (error instanceof TrevoApiError) {
        return res.status(error.status || 500).json({
            error: error.message,
            details: error.details,
        });
    }

    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch products from Trevo' });
}

router.get('/', async (req, res) => {
    try {
        const { category, sort, search, minPrice, maxPrice, status, page, limit } = req.query;
        const fetchLimit = Number(process.env.TREVO_CATALOG_FETCH_LIMIT || 100);

        const categories = await listTrevoCategories();
        const { byId: categoryById, bySlug: categoryBySlug } = buildCategoryMaps(categories);
        const selectedCategory = category ? categoryBySlug.get(String(category)) : null;

        if (category && !selectedCategory) {
            return res.json({ products: [], totalCount: 0 });
        }

        const productsResponse = await listTrevoProducts({
            search,
            categoryId: selectedCategory?.id,
            page: 1,
            limit: Math.min(Math.max(fetchLimit, 1), 100),
        });

        const mappedProducts = productsResponse.products.map((product) =>
            mapTrevoProduct(product, categoryById)
        );
        const filteredProducts = applyMyPickProductFilters(mappedProducts, {
            category,
            search,
            minPrice,
            maxPrice,
            status,
        });
        const sortedProducts = sortMyPickProducts(filteredProducts, sort);
        const totalCount = sortedProducts.length;
        const products = limit === undefined
            ? sortedProducts
            : paginate(sortedProducts, page, limit);

        res.json({ products, totalCount });
    } catch (error) {
        sendTrevoError(res, error);
    }
});

export default router;
