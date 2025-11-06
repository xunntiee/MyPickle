import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image-card">
        <img src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : `${import.meta.env.VITE_API_URL}${product.image_url}`) : '/images/placeholder.jpg'} alt={product.name} />
        {product.is_new && <span className="badge badge-new">NEW</span>}
        {product.discount_percent > 0 && (
          <span className="badge badge-discount">-{product.discount_percent}%</span>
        )}
        <button
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={product.stock === 0} // Vô hiệu hóa nếu hết hàng
        >
          Thêm vào giỏ hàng
        </button>
      </div>
      <div className="product-info-card">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          <div className="stars">{renderStars(Math.round(product.rating))}</div>
          <span className="reviews-count">({product.reviews_count})</span>
        </div>
        <div className="product-price">
          <span className="current-price">
            {product.price.toLocaleString('vi-VN')} đ
          </span>
          {product.original_price && (
            <span className="original-price">
              {product.original_price.toLocaleString('vi-VN')} đ
            </span>
          )}
        </div>
        <div className="product-stock">
          {product.stock > 0 ? (
            <span className="in-stock">Còn: {product.stock}</span>
          ) : (
            <span className="out-of-stock">Hết hàng</span>
          )}
          <span className="sold-count">Đã bán: {product.total_sold || 0}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
