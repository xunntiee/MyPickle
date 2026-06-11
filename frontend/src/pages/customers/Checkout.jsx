import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from '../../utils/axiosConfig';
import '../../css/Checkout.css';

const SHIPPING_OPTIONS = {
  standard: 30000,
  express: 50000,
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    sex: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const subtotal = getCartTotal();
  const shippingCost = SHIPPING_OPTIONS[shippingMethod] || 0;
  const total = subtotal + shippingCost;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!/^\d{10,11}$/.test(formData.phone.trim())) {
      alert('Số điện thoại không hợp lệ. Vui lòng nhập 10 hoặc 11 chữ số.');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        ...formData,
        paymentMethod,
        shippingMethod,
        shippingCost,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          color: item.color,
        })),
        total,
        status: 'cho_xac_nhan',
      };

      const response = await axios.post('/api/client/orders', orderData);
      const orderCode = response.data?.orderCode;

      if (!orderCode) {
        throw new Error('Trevo did not return an order code.');
      }

      clearCart();
      navigate(`/order-complete/${orderCode}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.error || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <div className="container">
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Hãy thêm sản phẩm vào giỏ trước khi thanh toán.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Thanh toán</h1>

        <div className="checkout-steps">
          <div className="step completed">
            <span className="step-number">✓</span>
            <span className="step-label">Giỏ hàng</span>
          </div>
          <div className="step active">
            <span className="step-number">2</span>
            <span className="step-label">Thông tin</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-label">Hoàn tất</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-layout">
          <div className="checkout-form">
            <div className="form-section">
              <h2>Thông tin người mua</h2>
              <div className="form-group">
                <label>Họ và tên *</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Nhập họ và tên"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select name="sex" value={formData.sex} onChange={handleInputChange}>
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Địa chỉ giao hàng</h2>
              <div className="form-group">
                <label>Địa chỉ *</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  name="notes"
                  placeholder="Ghi chú về đơn hàng hoặc thời gian giao hàng"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Phương thức giao hàng</h2>
              <div className="shipping-options">
                <label className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={(event) => setShippingMethod(event.target.value)}
                  />
                  <div className="shipping-info">
                    <span>Giao hàng tiêu chuẩn</span>
                    <span className="shipping-cost">30.000 đ</span>
                  </div>
                </label>
                <label className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={(event) => setShippingMethod(event.target.value)}
                  />
                  <div className="shipping-info">
                    <span>Giao hàng nhanh</span>
                    <span className="shipping-cost">50.000 đ</span>
                  </div>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary place-order-btn" disabled={submitting}>
              {submitting ? 'Đang gửi đơn...' : 'Đặt hàng'}
            </button>
          </div>

          <div className="order-summary">
            <h2>Tóm tắt đơn hàng</h2>

            <div className="order-items">
              {cartItems.map((item) => (
                <div key={item.id} className="order-item">
                  <img src={item.image_url || '/images/placeholder.jpg'} alt={item.name} />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    {item.color && <p>Màu: {item.color}</p>}
                    <p className="quantity">x {item.quantity}</p>
                  </div>
                  <span className="item-price">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </div>

            <div className="form-section">
              <h2>Phương thức thanh toán</h2>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    className="payment-radio"
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
              </div>
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="summary-row">
                <span>Phí giao hàng</span>
                <span>{shippingCost.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="summary-total">
                <span>Tổng cộng</span>
                <span>{total.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
