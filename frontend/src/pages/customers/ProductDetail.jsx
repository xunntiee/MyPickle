import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/ProductCard';
import '../../css/ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await axios.get(`/api/client/products/${id}`);
            setProduct(response.data);

            // Parse colors and set first as default
            if (response.data.colors) {
                const colors = JSON.parse(response.data.colors);
                setSelectedColor(colors[0]);
            }

            // Fetch related products - sử dụng category_slug để nhất quán với Shop.jsx
            const relatedResponse = await axios.get('/api/client/products', {
                params: { category: response.data.category_slug } // Sử dụng category_slug ở đây
            });
            setRelatedProducts(relatedResponse.data.products.filter(p => String(p.id) !== String(id)).slice(0, 4));
        } catch (error) {
            console.error('Error fetching product:', error);
        }
    };

    const handleAddToCart = () => {
        if (product) {
            const added = addToCart(product, quantity, selectedColor);
            if (added) {
                alert('Sản phẩm đã được thêm vào giỏ hàng!');
            }
        }
    };

    const incrementQuantity = () => setQuantity(q => q + 1);
    const decrementQuantity = () => setQuantity(q => (q > 1 ? q - 1 : 1));

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

    if (!product) {
        return <div className="loading">Đang tải...</div>;
    }

    const parseJsonList = (value, fallback = []) => {
        if (!value) {
            return fallback;
        }

        try {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            return Array.isArray(parsed) ? parsed : fallback;
        } catch {
            return fallback;
        }
    };

    const images = parseJsonList(product.images, product.image_url ? [product.image_url] : []);
    const colors = parseJsonList(product.colors);

    return (
        <div className="product-detail-page">
            <div className="container">
                {/* Breadcrumb */}
                <div className="breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <Link to="/shop">Cửa hàng</Link>
                    <span>/</span>
                    <span>{product.name}</span>
                </div>

                {/* Product Section */}
                <div className="product-detail">
                    {/* Image Gallery */}
                    <div className="product-gallery">
                        <div className="gallery-thumbs">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    className={`thumb ${selectedImage === index ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(index)}
                                >
                                    <img src={img.replace(/"/g, '') || '/images/placeholder.jpg'} alt={`${product.name} ${index + 1}`} />
                                </button>
                            ))}
                        </div>
                        <div className="gallery-main">
                            <img src={images[selectedImage]?.replace(/"/g, '') || '/images/placeholder.jpg'} alt={product.name} />
                            {product.is_new && <span className="badge badge-new">MỚI</span>}
                            {product.discount_percent > 0 && (
                                <span className="badge badge-discount">-{product.discount_percent}%</span>
                            )}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="product-info-section">
                        <div className="product-rating">
                            <div className="stars">{renderStars(Math.round(product.rating))}</div>
                            <span className="reviews-count">({product.reviews_count} Đánh giá)</span>
                        </div>

                        <h1 className="product-title">{product.name}</h1>

                        <p className="product-description">{product.description}</p>

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
                                <span className="in-stock">Còn hàng: {product.stock}</span>
                            ) : (
                                <span className="out-of-stock">Hết hàng</span>
                            )}
                            <span className="sold-count">Đã bán: {product.total_sold || 0}</span>
                        </div>

                        {/* Quantity and Add to Cart */}
                        <div className="product-actions">
                            <div className="quantity-selector">
                                <button onClick={decrementQuantity}>-</button>
                                <input type="text" value={quantity} readOnly />
                                <button onClick={incrementQuantity}>+</button>
                            </div>

                            <button
                                className="btn-add-to-cart"
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                            >
                                Thêm vào giỏ hàng
                            </button>
                        </div>

                        {/* Additional Info */}
                        <div className="additional-info">
                            <div className="info-item">
                                <span>Mã sản phẩm</span>
                                <span>{product.id}</span>
                            </div>
                            <div className="info-item">
                                <span>Danh mục</span>
                                {/* Sử dụng category_slug cho liên kết và category_name cho hiển thị */}
                                <Link to={`/shop?category=${product.category_slug}`}>{product.category_name}</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="product-tabs">
                    <div className="tabs-header">
                        <button
                            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Mô tả sản phẩm
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('questions')}
                        >
                            Câu hỏi
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            Đánh giá ({product.reviews_count})
                        </button>
                    </div>

                    <div className="tabs-content">
                        {activeTab === 'description' && (
                            <div className="tab-pane">
                                <p>{product.description}</p>
                            </div>
                        )}

                        {activeTab === 'questions' && (
                            <div className="tab-pane">
                                <p>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="tab-pane">
                                {product.reviews && product.reviews.length > 0 ? (
                                    product.reviews.map((review) => (
                                        <div key={review.id} className="review-item">
                                            <div className="review-header">
                                                <strong>{review.author_name}</strong>
                                                <div className="stars">{renderStars(review.rating)}</div>
                                            </div>
                                            <p>{review.comment}</p>
                                            <span className="review-date">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p>Chưa có đánh giá nào.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="related-products">
                        <div className="section-header">
                            <h2>Sản phẩm liên quan</h2>
                            <Link to="/shop" className="view-all">Xem tất cả →</Link>
                        </div>
                        <div className="products-grid">
                            {relatedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
