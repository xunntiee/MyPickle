import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from '../../utils/axiosConfig';
import '../../css/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod: cash on delivery
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    sex: ''
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Thêm state để kiểm tra đăng nhập
  const [customerId, setCustomerId] = useState(null); // Thêm state để lưu customerId

  const total = getCartTotal();

  useEffect(() => {
    const loadCustomerData = async () => {
      const khachString = localStorage.getItem('khach'); // Thay đổi: Đọc từ 'khach'
      if (khachString) {
        try {
          const khach = JSON.parse(khachString);
          // Kiểm tra nếu là khách hàng và có MaKH
          if (khach.role === "khachhang" && khach.MaKH) { // Thay đổi: Điều kiện kiểm tra vai trò và ID khách hàng
            setIsLoggedIn(true);
            setCustomerId(khach.MaKH); // Lưu customerId vào state
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/taikhoan/customer/profile?id=${khach.MaKH}`); // Thay đổi: Sử dụng khach.MaKH
            if (response.data.success) {
              const customer = response.data.customer;
              let address = customer.DiaChi || '';
              if (address.includes(',')) {
                const parts = address.split(',');
                address = parts.join(',').trim(); // Phần còn lại là address
              }

              setFormData({
                fullName: customer.TenKh || '',
                email: customer.email || '',
                phone: customer.SDT || '',
                address: address,
                notes: '', // Ghi chú luôn trống cho đơn hàng mới
                sex: customer.GioiTinh || ''
              });
            }
          }
        } catch (error) {
          console.error('Lỗi khi tải thông tin khách hàng:', error);
          // Xử lý lỗi hoặc để form trống
        }
      }
    };

    loadCustomerData();
  }, []); // Chạy một lần khi component mount

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra định dạng số điện thoại (tùy chọn, ví dụ: 10 chữ số)
    if (!/^\d{10,11}$/.test(formData.phone.trim())) {
      alert('Số điện thoại không hợp lệ. Vui lòng nhập 10 hoặc 11 chữ số.');
      return;
    }
    try {
      const orderData = {
        ...formData,
        paymentMethod,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          color: item.color,
          // Thêm các trường khác nếu cần
        })),
        total: total,
        status: 'cho_xac_nhan', // Trạng thái mặc định
        customer_id: customerId, // Thay đổi: Thêm customer_id từ state
        // Xóa dòng này: customer: isLoggedIn ? JSON.parse(localStorage.getItem('user')) : null 
      };

      console.log("Dữ liệu đơn hàng gửi đi:", orderData); // THÊM DÒNG NÀY ĐỂ KIỂM TRA

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/client/orders`, orderData); // Đảm bảo URL đầy đủ

      if (response.data.orderCode) {
        await clearCart();
        navigate(`/order-complete/${response.data.orderCode}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.error || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <div className="container">
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Hãy thêm sản phẩm vào giỏ trước khi thanh toán!</p>
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
            <span className="step-label">Chi tiết thanh toán</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-label">Hoàn tất</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-layout">
          <div className="checkout-form">
            <div className="form-section">
              <h2>Thông tin liên hệ</h2>
              <div className="form-group">
                <label>HỌ VÀ TÊN *</label>
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
                  <label>EMAIL (KHÔNG BẮT BUỘC)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>GIỚI TÍNH</label>
                  <select name="sex" value={formData.sex} onChange={handleInputChange}>
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>SỐ ĐIỆN THOẠI *</label>
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
                <label>ĐỊA CHỈ *</label>
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
                <label>GHI CHÚ (TÙY CHỌN)</label>
                <textarea
                  name="notes"
                  placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
            </div>

            <button type="submit" className="btn btn-primary place-order-btn">
              Đặt hàng
            </button>
          </div>

          <div className="order-summary">
            <h2>Tóm tắt đơn hàng</h2>

            <div className="order-items">
              {cartItems.map((item) => (
                <div key={item.product_id} className="order-item">
                  <img src={item.image_url || '/images/placeholder.jpg'} alt={item.name} />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    {item.color && <p>Màu: {item.color}</p>}
                    <p className="quantity">x {item.quantity}</p>
                  </div>
                  <span className="item-price">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                </div>
              ))}
            </div>
            {/* 
            <div className="coupon-input">
              <input type="text" placeholder="Mã khuyến mãi" />
              <button type="button" className="btn btn-outline">Áp dụng</button>
            </div> */}

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
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
              </div>
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Tạm tính</span>
                <span>{total.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="summary-total">
                <span>Tổng cộng</span>
                <span>{total.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
