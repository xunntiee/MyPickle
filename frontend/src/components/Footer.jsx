import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column">
              <h3>MyPick Store</h3>
              <p className="footer-description">
                Cửa hàng ecommerce pickleball kết nối trực tiếp với Trevo để đồng bộ sản phẩm,
                tồn kho, khách hàng và đơn hàng.
              </p>
            </div>

            <div className="footer-column">
              <h4>Đường dẫn</h4>
              <ul>
                <li><Link to="/">Trang chủ</Link></li>
                <li><Link to="/shop">Sản phẩm</Link></li>
                <li><Link to="/cart">Giỏ hàng</Link></li>
                <li><Link to="/pos">POS</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Vận hành bởi Trevo</h4>
              <ul>
                <li>Catalog lấy từ Trevo API</li>
                <li>Đơn hàng tạo trực tiếp trong Trevo</li>
                <li>Tồn kho kiểm soát tập trung</li>
                <li>API key được giữ trong backend MyPick</li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Liên hệ</h4>
              <ul className="no-list-style">
                <li><span>Hotline:</span> <a href="tel:0796682288">079 668 2288</a></li>
                <li><span>Email:</span> <a href="mailto:support@mypick.trevo.studio">support@mypick.trevo.studio</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
