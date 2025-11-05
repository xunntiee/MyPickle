import express from 'express';
import { db } from '../../../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

async function generateNewCustomerId() {
    const [lastCustomer] = await db.query(
        "SELECT id FROM tbl_khachhang ORDER BY CAST(SUBSTRING(id, 3) AS UNSIGNED) DESC LIMIT 1"
    );

    if (lastCustomer.length > 0) {
        const lastId = lastCustomer[0].id;
        const lastNumber = parseInt(lastId.substring(2), 10);
        return 'KH' + String(lastNumber + 1).padStart(4, '0');
    } else {
        return 'KH0001';
    }
}

router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            notes, paymentMethod, items, total,
            status: requestStatus,
            orderType: requestOrderType
        } = req.body;

        let customerId = req.body.customer?.id;
        let customerName = req.body.customer?.name || req.body.fullName;
        let customerEmail = req.body.customer?.email || req.body.email;
        let customerPhone = req.body.customer?.phone || req.body.phone;
        let customerAddress = req.body.customer?.address || req.body.address;
        let customerSex = req.body.customer?.sex || req.body.sex;

        customerName = customerName || null;
        customerPhone = customerPhone || null;
        customerEmail = customerEmail || null;
        customerAddress = customerAddress || null;
        customerSex = customerSex || null;

        if (!customerName) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Tên khách hàng không được để trống.' });
        }
        if (!customerPhone) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Số điện thoại khách hàng không được để trống.' });
        }

        const orderType = requestOrderType || 'online';

        const orderCode = uuidv4().split('-')[0].toUpperCase();
        let initialStatus;

        if (customerId) {
            await connection.query(
                `UPDATE tbl_khachhang SET TenKh = ?, SDT = ?, email = ?, DiaChi = ?, GioiTinh = ? WHERE id = ?`,
                [customerName, customerPhone, customerEmail, customerAddress, customerSex, customerId]
            );
        } else {
            const [existingCustomers] = await connection.query(
                "SELECT id FROM tbl_khachhang WHERE email = ? OR SDT = ?",
                [customerEmail, customerPhone]
            );

            if (existingCustomers.length > 0) {
                customerId = existingCustomers[0].id;
                await connection.query(
                    `UPDATE tbl_khachhang SET TenKh = ?, SDT = ?, email = ?, DiaChi = ?, GioiTinh = ? WHERE id = ?`,
                    [customerName, customerPhone, customerEmail, customerAddress, customerSex, customerId]
                );
            } else {
                customerId = await generateNewCustomerId();
                await connection.query(
                    `INSERT INTO tbl_khachhang (id, TenKh, SDT, email, DiaChi, GioiTinh) VALUES (?, ?, ?, ?, ?, ?)`,
                    [customerId, customerName, customerPhone, customerEmail, customerAddress, customerSex]
                );
            }
        }

        initialStatus = requestStatus || (orderType === 'pos' ? 'da_nhan' : 'cho_xac_nhan');

        for (const item of items) {
            if (!item.product_id) {
                await connection.rollback();
                connection.release();
                console.error('Lỗi: product_id bị thiếu cho sản phẩm:', item.name);
                return res.status(400).json({ error: `Thiếu ID sản phẩm cho '${item.name}'. Vui lòng kiểm tra lại giỏ hàng.` });
            }

            const [[product]] = await connection.query(
                'SELECT stock, name FROM products WHERE id = ? FOR UPDATE',
                [item.product_id]
            );

            if (!product) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ error: `Sản phẩm '${item.name}' không tồn tại.` });
            }

            if (product.stock < item.quantity) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: `Không đủ hàng tồn kho cho sản phẩm '${product.name}'. Chỉ còn ${product.stock} sản phẩm.` });
            }

            await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
                item.quantity,
                item.product_id,
            ]);
        }

        const orderData = [
            orderCode, customerId, customerName, customerEmail, customerPhone, customerAddress,
            notes, paymentMethod, total, initialStatus, orderType
        ];

        const [orderResult] = await connection.query(
            `INSERT INTO orders (order_code, customer_id, customer_name, customer_email, customer_phone, shipping_address, notes, payment_method, total_amount, status, order_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            orderData
        );

        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price, color, product_name)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.price, item.color, item.name]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Đặt hàng thành công!', orderCode: orderCode });

    } catch (error) {
        await connection.rollback();
        console.error('Lỗi khi tạo đơn hàng:', error);
        if (error.message && error.message.includes('Không đủ hàng tồn kho')) {
            connection.release();
            return res.status(400).json({ error: error.message });
        }
        connection.release();
        res.status(500).json({ error: 'Không thể tạo đơn hàng.' });
    } finally {
        if (connection) connection.release();
    }
});

export default router;
