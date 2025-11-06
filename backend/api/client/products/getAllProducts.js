import express from 'express';
import { db } from '../../../config/db.js'; // Adjusted path

const router = express.Router();

// Get all products with optional filters and sorting
router.get('/', async (req, res) => {
    try {
        const { category, sort, search, minPrice, maxPrice, status, page, limit } = req.query;

        // Determine if pagination should be applied
        // Pagination will only be applied if the 'limit' query parameter is explicitly provided.
        const applyPagination = limit !== undefined;

        let currentPage = 1;
        let productsPerPage = 12; // Default if pagination is applied and limit is not specified
        let offset = 0;

        if (applyPagination) {
            currentPage = parseInt(page) || 1;
            productsPerPage = parseInt(limit) || 12;
            offset = (currentPage - 1) * productsPerPage;
        }

        // Build the base query for counting total products
        let countQuery = 'SELECT COUNT(p.id) AS totalCount FROM products p LEFT JOIN categories c ON p.category = c.name WHERE 1=1';
        const countParams = [];

        // Apply filters to count query
        if (category) {
            countQuery += ' AND c.slug = ?';
            countParams.push(category);
        }
        if (search) {
            countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }
        if (minPrice) {
            countQuery += ' AND p.price >= ?';
            countParams.push(minPrice);
        }
        if (maxPrice) {
            countQuery += ' AND p.price <= ?';
            countParams.push(maxPrice);
        }
        if (status === 'new') {
            countQuery += ' AND p.is_new = true';
        } else if (status === 'sale') {
            countQuery += ' AND p.original_price IS NOT NULL AND p.price < p.original_price';
        }

        const [totalCountResult] = await db.query(countQuery, countParams);
        const totalCount = totalCountResult[0].totalCount;

        // Build the main query for fetching products
        // Luôn tính toán total_sold bằng cách JOIN với bảng order
        let selectClause = 'SELECT p.*, COALESCE(SUM(oi.quantity), 0) AS total_sold';
        let fromClause = `
            FROM products p 
            LEFT JOIN categories c ON p.category = c.name
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'da_nhan'
        `;
        let whereClause = 'WHERE 1=1';
        let groupByClause = 'GROUP BY p.id'; // Luôn nhóm theo ID sản phẩm
        let orderByClause = '';
        const params = [];

        // Build WHERE clause from filters
        if (category) {
            whereClause += ' AND c.slug = ?';
            params.push(category);
        }

        if (search) {
            whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (minPrice) {
            whereClause += ' AND p.price >= ?';
            params.push(minPrice);
        }

        if (maxPrice) {
            whereClause += ' AND p.price <= ?';
            params.push(maxPrice);
        }

        if (status === 'new') {
            whereClause += ' AND p.is_new = true';
        } else if (status === 'sale') {
            whereClause += ' AND p.original_price IS NOT NULL AND p.price < p.original_price';
        }

        // Build ORDER BY clause
        if (sort === 'best_selling') {
            orderByClause = 'ORDER BY total_sold DESC, p.name ASC';
        } else if (sort === 'price_asc') {
            orderByClause = 'ORDER BY p.price ASC';
        } else if (sort === 'price_desc') {
            orderByClause = 'ORDER BY p.price DESC';
        } else if (sort === 'name_asc') {
            orderByClause = 'ORDER BY p.name ASC';
        } else if (sort === 'name_desc') {
            orderByClause = 'ORDER BY p.name DESC';
        } else if (sort === 'newest') {
            orderByClause = 'ORDER BY p.created_at DESC';
        } else {
            orderByClause = 'ORDER BY c.name ASC, p.name ASC';
        }

        // Pagination clause
        let paginationClause = '';
        if (applyPagination) {
            paginationClause = ' LIMIT ? OFFSET ?';
            params.push(productsPerPage, offset);
        }

        // Assemble the final query
        const query = `${selectClause} ${fromClause} ${whereClause} ${groupByClause} ${orderByClause} ${paginationClause}`;

        const [products] = await db.query(query, params);

        // Construct full image URLs dynamically
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const productsWithFullUrls = products.map(product => {
            let imageUrl = product.image_url;
            // Ensure the image URL is a full URL if it's a relative path starting with /uploads/
            if (imageUrl && imageUrl.startsWith('/uploads/') && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                imageUrl = `${baseUrl}${imageUrl}`;
            }
            return {
                ...product,
                image_url: imageUrl
            };
        });

        res.json({ products: productsWithFullUrls, totalCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

export default router;
