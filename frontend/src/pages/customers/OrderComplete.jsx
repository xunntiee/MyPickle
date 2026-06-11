import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import '../../css/OrderComplete.css';

const OrderComplete = () => {
  const { orderCode } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`/api/client/orders/${orderCode}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    };

    if (orderCode) {
      fetchOrder();
    }
  }, [orderCode]);

  if (!order) {
    return <div className="loading">Đang tải chi tiết đơn hàng...</div>;
  }

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cod':
        return 'Thanh toán khi nhận hàng (COD)';
      case 'cash':
        return 'Thanh toán tiền mặt';
      case 'bank_transfer':
        return 'Chuyển khoản ngân hàng';
      // case 'card':
      //   return 'Thẻ tín dụng';
      default:
        return method; // Hiển thị giá trị gốc nếu không khớp
    }
  };

  return (
    <div className="order-complete-page">
      <div className="container">
        <h1 className="page-title">Cảm ơn bạn đã mua hàng!</h1>

        {/* Steps */}
        <div className="checkout-steps">
          <div className="step completed">
            <span className="step-number">✓</span>
            <span className="step-label">Giỏ hàng</span>
          </div>
          <div className="step completed">
            <span className="step-number">✓</span>
            <span className="step-label">Thông tin</span>
          </div>
          <div className="step completed">
            <span className="step-number">✓</span>
            <span className="step-label">Hoàn tất </span>
          </div>
        </div>

        {/* Success Message */}
        <div className="success-card">
          <div className="success-icon">🎉</div>
          <h2>Cảm ơn bạn!</h2>
          <p className="success-message">Đơn hàng của bạn đã được tiếp nhận</p>

          <div className="order-items-preview scrollable">
            {order.items && order.items.map((item) => (
              <div key={item.id} className="item-preview">
                <div className="item-image">
                    <img src={item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${import.meta.env.VITE_API_URL}${item.image_url}`) : '/images/placeholder.jpg'} alt={item.name} />
                  <span className="item-badge">{item.quantity}</span>
                </div>
              </div>
            ))}
          </div>


          <div className="order-details">
            <div className="detail-item">
              <span className="detail-label">Mã đơn hàng:</span>
              <span className="detail-value">{order.order_code}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ngày đặt:</span>
              <span className="detail-value">
                {new Date(order.created_at).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Tổng cộng:</span>
              <span className="detail-value">
                {(order.total_amount ? order.total_amount : 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Phương thức thanh toán:</span>
              <span className="detail-value">
                {getPaymentMethodText(order.payment_method)}
              </span>
            </div>
          </div>

          <div className="order-actions">
            <Link to="/shop" className="btn btn-outline">
              Tiếp tục mua sắm
            </Link>
            <Link to="/purchase-history" className="btn btn-outline">
              Lịch sử mua hàng
            </Link>
          </div>

        </div>

        {/* Order Info */}
        <div className="order-info-section">
          <h3>Thông tin đơn hàng</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>Thông tin người nhận</h4>
              <p><strong>Tên:</strong> {order.customer_name}</p>
              <p><strong>Email:</strong> {order.customer_email || 'Không có'}</p>
              <p><strong>SĐT:</strong> {order.customer_phone}</p>
            </div>
            <div className="info-card">
              <h4>Địa chỉ giao hàng</h4>
              <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
              {order.notes && <p><strong>Ghi chú:</strong> {order.notes}</p>}
            </div>
            <div className="info-card">
              <h4>Thanh toán & Vận chuyển</h4>
              <p><strong>Thanh toán:</strong> {getPaymentMethodText(order.payment_method)}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="order-items-section">
          <h3>Chi tiết đơn hàng</h3>
          <div className="items-list">
            {order.items && order.items.map((item) => (
              <div key={item.id} className="order-item">
                <div className="item-image-container">
                    <img src={item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${import.meta.env.VITE_API_URL}${item.image_url}`) : '/images/placeholder.jpg'} alt={item.name} />
                </div>
                <div className="item-info">
                  <h4>{item.product_name}</h4>
                  {item.color && <p>Màu: {item.color}</p>}
                  <p>Số lượng: {item.quantity}</p>
                </div>
                <div className="item-total">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </div>
              </div>
            ))}
          </div>

          <div className="order-totals">
            <div className="total-row grand-total">
              <span>Tổng cộng:</span>
              <span>{(order.total_amount ? order.total_amount : 0).toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderComplete;
