import express from 'express';
import { db } from '../../../config/db.js'; // Adjusted path

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const { search = '' } = req.query;
        const searchPattern = `%${search}%`;

        let query = 'SELECT * FROM categories WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR slug LIKE ?)';
            params.push(searchPattern, searchPattern);
        }

        query += ' ORDER BY name';

        const [categories] = await db.query(query, params);

        // Construct full image URLs dynamically
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const categoriesWithFullUrls = categories.map(category => {
            let imageUrl = category.image_url;
            if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                imageUrl = `${baseUrl}${imageUrl}`;
            }
            return {
                ...category,
                image_url: imageUrl
            };
        });

        res.json(categoriesWithFullUrls);
    } catch (error) {
        console.error('Lỗi khi lấy tất cả danh mục:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

export default router;
