import express from 'express';
import { db } from '../../../config/db.js'; // Adjusted path

const router = express.Router();

// Add item to cart
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { sessionId, productId, quantity, color } = req.body;

        // Lấy thông tin sản phẩm và khóa hàng để tránh race condition
        const [[product]] = await connection.query('SELECT stock FROM products WHERE id = ? FOR UPDATE', [productId]);

        if (!product) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
        }

        if (product.stock < quantity) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: `Không đủ hàng tồn kho cho sản phẩm này. Chỉ còn ${product.stock} sản phẩm.` });
        }

        // Kiểm tra nếu sản phẩm đã tồn tại trong giỏ hàng
        const [existing] = await connection.query(
            'SELECT id, quantity FROM cart_items WHERE session_id = ? AND product_id = ? AND color = ? FOR UPDATE',
            [sessionId, productId, color]
        );

        if (existing.length > 0) {
            const newQuantity = existing[0].quantity + quantity;
            if (product.stock < newQuantity) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: `Không thể thêm. Tổng số lượng vượt quá tồn kho (${product.stock}).` });
            }
            // Cập nhật số lượng
            await connection.query(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [newQuantity, existing[0].id]
            );
        } else {
            // Thêm sản phẩm mới
            await connection.query(
                'INSERT INTO cart_items (session_id, product_id, quantity, color) VALUES (?, ?, ?, ?)',
                [sessionId, productId, quantity, color]
            );
        }

        await connection.commit(); // Hoàn tất giao dịch
        res.json({ message: 'Item added to cart' });
    } catch (error) {
        await connection.rollback(); // Hoàn tác nếu có lỗi
        console.error('Lỗi khi thêm mục vào giỏ hàng:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    } finally {
        connection.release();
    }
});

export default router;