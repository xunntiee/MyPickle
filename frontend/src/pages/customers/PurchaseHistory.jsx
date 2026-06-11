import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import '../../css/AdminOrders.css'; // Tái sử dụng CSS của trang Admin
import '../../css/PurchaseHistory.css'; // CSS riêng nếu cần ghi đè

const PurchaseHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState(null); // Thêm state để quản lý lỗi

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            let customerId = null;
            let customerPhone = null;
            let customerEmail = null;

            const khachString = localStorage.getItem('khach'); // Lấy thông tin khách hàng
            const userString = localStorage.getItem('user'); // Lấy thông tin nhân viên/quản lý

            // Ưu tiên kiểm tra nếu có nhân viên/quản lý đăng nhập
            if (userString) {
                try {
                    const user = JSON.parse(userString);
                    // Nếu là nhân viên hoặc quản lý, trang này không dành cho họ
                    if (user.role === "Nhân viên" || user.role === "Quản lý") {
                        setError("Trang này chỉ dành cho khách hàng. Bạn đã đăng nhập với vai trò " + user.role + ".");
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Lỗi parse userString trong PurchaseHistory:", e);
                    // Nếu userString bị lỗi, tiếp tục kiểm tra khachString
                }
            }

            // Kiểm tra thông tin khách hàng
            if (khachString) {
                try {
                    const khach = JSON.parse(khachString);
                    if (khach.role === "khachhang" && khach.MaKH) {
                        customerId = khach.MaKH; // Lấy MaKH làm ID khách hàng
                        customerPhone = khach.SDT || khach.phone || null;
                        customerEmail = khach.email || null;
                        console.log('Frontend: Extracted customer identity from localStorage (khach):', {
                            customerId,
                            customerPhone,
                            customerEmail,
                        });
                    } else {
                        setError("Dữ liệu đăng nhập khách hàng không hợp lệ. Vui lòng đăng nhập lại.");
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Lỗi parse khachString trong PurchaseHistory:", e);
                    setError("Lỗi dữ liệu người dùng trong bộ nhớ cục bộ. Vui lòng đăng nhập lại.");
                    setLoading(false);
                    return;
                }
            }

            if (customerId && (!customerPhone || !customerEmail)) {
                try {
                    const profileResponse = await axios.get(`/api/admin/taikhoan/customer/profile?id=${customerId}`);
                    const customer = profileResponse.data?.customer;
                    if (customer) {
                        customerPhone = customerPhone || customer.SDT || customer.phone || null;
                        customerEmail = customerEmail || customer.email || null;
                    }
                } catch (profileError) {
                    console.warn('Could not load customer profile for Trevo order history:', profileError);
                }
            }

            // Nếu không tìm thấy thông tin khách hàng hợp lệ
            if (!customerId && !customerPhone && !customerEmail) {
                setError("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem lịch sử mua hàng.");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('/api/client/orders/history', {
                    params: {
                        customerId,
                        phone: customerPhone,
                        email: customerEmail,
                    },
                });
                setOrders(response.data);
            } catch (err) {
                console.error('Lỗi khi lấy lịch sử đơn hàng:', err);
                setError('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []); // Dependency array rỗng để chỉ chạy một lần khi component mount

    const viewOrderDetails = async (orderCode) => {
        try {
            const response = await axios.get(`/api/client/orders/${orderCode}`);
            setSelectedOrder(response.data);
            setShowModal(true);
        } catch (error) {
            console.error('Lỗi khi tải chi tiết đơn hàng:', error);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    const getStatusInfo = (status) => {
        const statuses = {
            cho_xac_nhan: { color: 'warning', text: 'Chờ xác nhận' },
            da_xac_nhan: { color: 'info', text: 'Đã xác nhận' },
            dang_giao: { color: 'primary', text: 'Đang giao hàng' },
            da_nhan: { color: 'success', text: 'Đã nhận hàng' },
            doi_hang: { color: 'info', text: 'Đổi hàng' }, // Trạng thái mới
            tra_hang: { color: 'danger', text: 'Trả hàng' }, // Trạng thái mới
            hoan_tien: { color: 'danger', text: 'Hoàn tiền' }, // Trạng thái mới
            da_huy: { color: 'danger', text: 'Đã hủy (trước xác nhận)' },
            huy_sau_xac_nhan: { color: 'danger', text: 'Hủy sau xác nhận' },
            giao_that_bai: { color: 'danger', text: 'Giao thất bại' },
            pending: { color: 'warning', text: 'Chờ xử lý' },
            confirmed: { color: 'info', text: 'Đã xác nhận' },
            completed: { color: 'success', text: 'Hoàn tất' },
            cancelled: { color: 'danger', text: 'Đã hủy' },
            draft: { color: 'secondary', text: 'Nháp' },
        };
        return statuses[status] || { color: 'secondary', text: status };
    };

    const formatDate = (d) => new Date(d).toLocaleString('vi-VN');

    if (loading) {
        return <div className="loading">Đang tải lịch sử mua hàng...</div>;
    }

    if (error) {
        return (
            <div className="purchase-history-page">
                <div className="container">
                    <h1 className="page-title">Lịch sử mua hàng</h1>
                    <div className="error-message">
                        <p>{error}</p>
                        {!localStorage.getItem('user') && (
                            <Link to="/login" className="btn btn-primary">Đăng nhập ngay</Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="purchase-history-page">
            <div className="container">
                <h1 className="page-title">Lịch sử mua hàng</h1>

                {orders.length === 0 ? (
                    <div className="no-orders-message">
                        <p>Bạn chưa có đơn hàng nào.</p>
                        <Link to="/shop" className="btn btn-primary">Bắt đầu mua sắm</Link>
                    </div>
                ) : (
                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Mã HĐ</th>
                                    <th>Ngày đặt</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td><strong>{order.order_code}</strong></td>
                                        <td>{formatDate(order.created_at)}</td>
                                        <td><strong>{order.total_amount.toLocaleString('vi-VN')}₫</strong></td>
                                        <td>
                                            <span className={`status-badge status-${getStatusInfo(order.status).color}`}>
                                                {getStatusInfo(order.status).text}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-view"
                                                onClick={() => viewOrderDetails(order.order_code)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && selectedOrder && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content order-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-history">
                            <h3>Chi tiết Đơn hàng - {selectedOrder.order_code}</h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <h4>Thông tin khách hàng</h4>
                                <p><strong>Tên:</strong> {selectedOrder.customer_name}</p>
                                <p><strong>Giới tính:</strong> {selectedOrder.customer_gender || 'Chưa cập nhật'}</p>
                                <p><strong>Email:</strong> {selectedOrder.customer_email || 'Không có'}</p>
                                <p><strong>SĐT:</strong> {selectedOrder.customer_phone}</p>
                            </div>
                            <div className="detail-section">
                                <h4>Địa chỉ giao hàng</h4>
                                <p>{selectedOrder.shipping_address}</p>
                            </div>
                            {selectedOrder.notes && (
                                <div className="detail-section">
                                    <h4>Ghi chú đơn hàng</h4>
                                    <p className="order-notes">{selectedOrder.notes}</p>
                                </div>
                            )}
                            <div className="detail-section">
                                <h4>Sản phẩm</h4>
                                <table className="items-table">
                                    <thead>
                                        <tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá</th><th>Tổng</th></tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items && selectedOrder.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.price.toLocaleString('vi-VN')}₫</td>
                                                <td>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="detail-section summary-section">
                                <h4>Tổng cộng: <span>{selectedOrder.total_amount.toLocaleString('vi-VN')}₫</span></h4>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseHistory;
