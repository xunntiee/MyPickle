import express from 'express';
import { listTrevoCategories, TrevoApiError } from '../../../lib/trevo-client.js';
import { mapTrevoCategory } from '../../../lib/trevo-mapper.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const search = String(req.query.search || '').trim().toLowerCase();
        const categories = (await listTrevoCategories())
            .map(mapTrevoCategory)
            .filter((category) => {
                if (!search) {
                    return true;
                }

                return `${category.name} ${category.slug}`.toLowerCase().includes(search);
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        res.json(categories);
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error('Error fetching categories from Trevo:', error);
        res.status(500).json({ error: 'Failed to fetch categories from Trevo' });
    }
});

export default router;
