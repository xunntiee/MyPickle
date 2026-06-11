import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Header.css';

const Header = () => {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <header className="header">
      <div className="header-main">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <h3>MyPick Store</h3>
            </Link>

            <nav className="nav">
              <Link to="/">Trang chủ</Link>
              <Link to="/shop">Sản phẩm</Link>
              <Link to="/pos">POS</Link>
            </nav>

            <div className="header-actions">
              <Link to="/cart" className="cart-icon-wrapper" aria-label="Giỏ hàng">
                <div className="cart-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </div>
                <span className="cart-text">Giỏ hàng</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
