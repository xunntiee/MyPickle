import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import ProductCard from '../../components/ProductCard';
import '../../css/Home.css';

const Home = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [onSaleProducts, setOnSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [newResponse, saleResponse, categoryResponse] = await Promise.all([
          axios.get('/api/client/products/featured/new-arrivals'),
          axios.get('/api/client/products/featured/on-sale'),
          axios.get('/api/client/categories'),
        ]);

        setNewArrivals(Array.isArray(newResponse.data) ? newResponse.data : []);
        setOnSaleProducts(Array.isArray(saleResponse.data) ? saleResponse.data : []);
        setCategories(Array.isArray(categoryResponse.data) ? categoryResponse.data.slice(0, 5) : []);
      } catch (error) {
        console.error('Could not load MyPick home data:', error);
      }
    }

    loadHomeData();
  }, []);

  const heroImage =
    newArrivals[0]?.image_url ||
    onSaleProducts[0]?.image_url ||
    categories[0]?.image_url ||
    '';

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              <span>MyPick Store</span>
              <br />
              Pickleball commerce powered by Trevo
            </h1>
            <p>
              Sản phẩm, tồn kho và đơn hàng được đồng bộ trực tiếp từ Trevo.
              MyPick chỉ đóng vai trò storefront và POS cho trải nghiệm bán hàng chuyên biệt.
            </p>
            <Link to="/shop" className="btn hero-btn">
              Mua ngay
            </Link>
          </div>
        </div>

        {heroImage && (
          <div className="hero-image">
            <img src={heroImage} alt="MyPick pickleball products" />
          </div>
        )}
      </section>

      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Mua sắm theo danh mục</h2>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.slug}`}
                className={`category-card category-${index + 1}`}
              >
                {category.image_url && (
                  <img src={category.image_url} alt={category.name} className="category-bg" />
                )}
                <div className="category-overlay" />
                <div className="category-content">
                  <h3>{category.name}</h3>
                  <span className="shop-now">Xem ngay →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="new-arrivals-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Sản phẩm mới</h2>
            <Link to="/shop?status=new" className="view-all">
              Xem thêm sản phẩm →
            </Link>
          </div>
          <div className="products-grid">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="on-sale-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Đang giảm giá</h2>
            <Link to="/shop?status=sale" className="view-all">
              Xem tất cả ưu đãi →
            </Link>
          </div>
          <div className="products-grid">
            {onSaleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature">
              <h3>Catalog tập trung</h3>
              <p>Sản phẩm và danh mục được quản lý tại Trevo.</p>
            </div>
            <div className="feature">
              <h3>Tồn kho đồng bộ</h3>
              <p>MyPick đọc tồn kho khả dụng từ Trevo để tránh lệch dữ liệu.</p>
            </div>
            <div className="feature">
              <h3>Đơn hàng tập trung</h3>
              <p>Checkout và POS đều tạo đơn trực tiếp trong Trevo.</p>
            </div>
            <div className="feature">
              <h3>API key an toàn</h3>
              <p>Khóa Trevo nằm ở backend, không lộ ra trình duyệt.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
