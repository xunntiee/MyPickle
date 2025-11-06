import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import '../../css/Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();

  const incrementQuantity = (item) => {
    // Kiểm tra nếu số lượng hiện tại + 1 vượt quá tồn kho
    if (item.quantity + 1 > item.stock) {
      alert(`Không thể thêm. Chỉ còn ${item.stock} sản phẩm trong kho.`);
      return;
    }
    updateQuantity(item.id, item.quantity + 1);
  };

  const decrementQuantity = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemove = (itemId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      removeFromCart(itemId);
    }
  };

  const handleQuantityChange = (item, value) => {
    const newQuantity = parseInt(value, 10);

    if (isNaN(newQuantity) || newQuantity < 1) {
      return; // Không cập nhật nếu nhập số không hợp lệ
    }

    if (newQuantity > item.stock) {
      alert(`Chỉ còn ${item.stock} sản phẩm trong kho.`);
      return;
    }

    updateQuantity(item.id, newQuantity);
  };

  const subtotal = getCartTotal();
  const total = subtotal; // Total is now the same as subtotal

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <div className="container">
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Thêm sản phẩm để bắt đầu mua sắm!</p>
          <Link to="/shop" className="btn btn-primary">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title-cart">Giỏ hàng</h1>

        {/* Steps */}
        <div className="checkout-steps">
          <div className="step active">
            <span className="step-number">1</span>
            <span className="step-label">Giỏ hàng</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span className="step-label">Thanh toán</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-label">Hoàn tất</span>
          </div>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            <div className="cart-table">
              <div className="cart-header">
                <div>Sản phẩm</div>
                <div>Số lượng</div>
                <div>Giá</div>
                <div>Tạm tính</div>
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-product">
                    <img src={item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${import.meta.env.VITE_API_URL}${item.image_url}`) : '/images/placeholder.jpg'} alt={item.name} />
                    <div className="product-details">
                      <h3>{item.name}</h3>
                      {item.color && <p className="product-color">Màu: {item.color}</p>}
                      {/* Hiển thị tồn kho */}
                      <p className="product-stock-info">Tồn kho: {item.stock}</p>
                      <button className="remove-btn" onClick={() => handleRemove(item.id)}>
                        ✕ Xóa
                      </button>
                    </div>
                  </div>

                  <div className="cart-quantity">
                    <div className="quantity-selector">
                      <button onClick={() => decrementQuantity(item)}>-</button>
                      <input
                        type="number"
                        value={item.quantity}
                        min="1"
                        max={item.stock}
                        onChange={(e) => handleQuantityChange(item, e.target.value)}
                      />
                      <button
                        onClick={() => incrementQuantity(item)}
                        disabled={item.quantity >= item.stock} // Vô hiệu hóa nút nếu đạt tồn kho
                      >+</button>
                    </div>
                  </div>

                  <div className="cart-price">
                    {item.price.toLocaleString('vi-VN')}₫
                  </div>

                  <div className="cart-subtotal">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h2>Tóm tắt giỏ hàng</h2>

            <div className="summary-row">
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString('vi-VN')}₫</span>
            </div>

            <div className="summary-total">
              <span>Tổng cộng</span>
              <span>{total.toLocaleString('vi-VN')}₫</span>
            </div>

            <Link to="/checkout" className="btn btn-primary checkout-btn">
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
