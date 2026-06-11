import React, { useState, useEffect } from 'react';
import '../../css/POS.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function POS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerSex, setcustomerSex] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');

    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(12); 
    const [totalProducts, setTotalProducts] = useState(0); 

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: productsPerPage,
                });
                if (searchTerm) {
                    params.append('search', searchTerm);
                }

                const response = await fetch(`${API_BASE_URL}/api/client/products?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const data = await response.json();
                setProducts(data.products);
                setTotalProducts(data.totalCount); 
            } catch (err) {
                console.error("Lỗi khi tải sản phẩm:", err);
            }
        };

        fetchProducts();
    }, [currentPage, productsPerPage, searchTerm]); 

    const addToCart = (productToAdd) => { 
        console.log('POS - Sản phẩm được thêm vào giỏ hàng:', productToAdd);
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === productToAdd.id);

            const actualProduct = products.find(p => p.id === productToAdd.id);
            if (!actualProduct) {
                alert('Không tìm thấy thông tin tồn kho cho sản phẩm này.');
                return currentCart;
            }

            if (existingItem) {
                const newQuantity = existingItem.quantity + 1;
                if (newQuantity > actualProduct.stock) {
                    alert(`Không đủ hàng tồn kho cho ${productToAdd.name}. Chỉ còn ${actualProduct.stock} sản phẩm.`);
                    return currentCart;
                }
                return currentCart.map(item =>
                    item.id === productToAdd.id ? { ...item, quantity: newQuantity } : item
                );
            } else {
                if (1 > actualProduct.stock) { 
                    alert(`Không đủ hàng tồn kho cho ${productToAdd.name}. Chỉ còn ${actualProduct.stock} sản phẩm.`);
                    return currentCart;
                }
                return [...currentCart, { ...productToAdd, quantity: 1 }];
            }
        });
    };

    const updateQuantity = (productId, amount) => {
        setCart(currentCart => {
            return currentCart.map(item => {
                if (item.id === productId) {
                    const actualProduct = products.find(p => p.id === productId);
                    if (!actualProduct) {
                        alert('Không tìm thấy thông tin tồn kho cho sản phẩm này.');
                        return item; 
                    }

                    const newQuantity = item.quantity + amount;

                    if (newQuantity <= 0) {
                        return null; 
                    }

                    if (amount > 0 && newQuantity > actualProduct.stock) {
                        alert(`Không đủ hàng tồn kho cho ${item.name}. Chỉ còn ${actualProduct.stock} sản phẩm.`);
                        return item; 
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(Boolean);
        });
    };

    const removeItem = (productId) => {
        setCart(currentCart => currentCart.filter(i => i.id !== productId));
    };

    const clearAll = () => {
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setcustomerSex(''); 
        setPaymentMethod('Tiền mặt');
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal;

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert("Giỏ hàng trống! Vui lòng thêm sản phẩm.");
            return;
        }

        if (!customerName.trim()) {
            alert("Vui lòng nhập Tên khách hàng.");
            return;
        }
        if (!customerPhone.trim()) {
            alert("Vui lòng nhập Số điện thoại khách hàng.");
            return;
        }
        if (!/^\d{10,11}$/.test(customerPhone.trim())) {
            alert('Số điện thoại không hợp lệ. Vui lòng nhập 10 hoặc 11 chữ số.');
            return;
        }

        try {
            const itemsToSend = cart.map(item => ({
                product_id: item.id, 
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                color: item.color || null 
            }));

            console.log('POS Checkout - Dữ liệu items đang được gửi:', itemsToSend);

            const response = await fetch(`${API_BASE_URL}/api/client/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: itemsToSend,
                    total,
                    paymentMethod: paymentMethod,
                    status: 'da_nhan', 
                    orderType: 'pos', 
                    customer: {
                        name: customerName,
                        phone: customerPhone,
                        sex: customerSex
                    }
                })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Thanh toán thất bại' }));
                throw new Error(errorData.error || 'Thanh toán thất bại');
            }
            alert('Thanh toán thành công!');
            clearAll();
        } catch (error) {
            console.error('Lỗi thanh toán:', error);
            alert(`Có lỗi xảy ra khi thanh toán: ${error.message}`);
        }
    };
    const handleQuantityChange = (item, value) => {
        const newQuantity = parseInt(value, 10);

        if (isNaN(newQuantity) || newQuantity < 1) return;

        const actualProduct = products.find(p => p.id === item.id);
        if (!actualProduct) return;

        if (newQuantity > actualProduct.stock) {
            alert(`Chỉ còn ${actualProduct.stock} sản phẩm trong kho.`);
            return;
        }

        setCart(currentCart =>
            currentCart.map(i =>
                i.id === item.id ? { ...i, quantity: newQuantity } : i
            )
        );
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalProducts / productsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="pos-container">
            <div className="pos-products">
                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..." 
                    className="pos-search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <div className="product-grid">
                    {products.map(product => (
                        <div key={product.id} className="product-card-pos" onClick={() => addToCart(product)}>
                            <img src={product.image_url || '/images/default-product.png'} alt={product.name} />
                            <p>{product.name}</p>
                            <span>{product.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
                            <p className="product-stock">Tồn kho: {product.stock}</p> {/* THÊM DÒNG NÀY */}
                        </div>
                    ))}
                </div>

                {/* Thêm phân trang */}
                {totalPages > 1 && (
                    <div className="pagination">
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                                onClick={() => handlePageChange(index + 1)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar / Invoice */}
            <aside className="pos-sidebar">
                <div className="current-sale-card">
                    <h3 className="sale-title">Đơn hàng hiện tại</h3>

                    <div className="sale-items">
                        {cart.length === 0 ? (
                            <div className="empty-sale">Chưa có sản phẩm</div>
                        ) : cart.map(item => (
                            <div className="sale-item" key={item.id}>
                                <div className="sale-item-left">
                                    <div className="sale-item-name">{item.name}</div>
                                    <div className="sale-item-sub">
                                        <span className="price">{item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
                                        <span className="qty">× {item.quantity}</span>
                                    </div>
                                </div>
                                <div className="sale-item-controls">
                                    <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>

                                    <input
                                        type="number"
                                        className="qty-input"
                                        value={item.quantity}
                                        min="1"
                                        max={products.find(p => p.id === item.id)?.stock || 1}
                                        onChange={(e) => handleQuantityChange(item, e.target.value)}
                                    />

                                    <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                    <button className="remove-btn" onClick={() => removeItem(item.id)}>🗑️</button>
                                </div>

                            </div>
                        ))}
                    </div>

                    <div className="sale-summary">
                        <div className="summary-row"><span>Tổng phụ:</span><span>{subtotal.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span></div> {/* Đã sửa tiếng Việt */}
                        <div className="summary-total-row"><span>Tổng cộng:</span><span>{total.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span></div> {/* Đã sửa tiếng Việt */}
                    </div>

                    <form className="sale-form" onSubmit={(e) => { e.preventDefault(); handleCheckout(); }}>
                        <label>Tên khách hàng *</label>
                        <input required type="text" placeholder="Nhập tên khách hàng" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

                        <label>Số điện thoại *</label>
                        <input required type="text" placeholder="Nhập số điện thoại" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />

                        <label>Giới tính</label>
                        <select value={customerSex} onChange={(e) => setcustomerSex(e.target.value)}>
                            <option value="">Chọn giới tính</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>

                        <label>Phương thức thanh toán *</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <option>Tiền mặt</option>
                            <option>Chuyển khoản</option>
                        </select>

                        <div className="sale-actions">
                            <button type="button" className="btn-clear" onClick={clearAll}>Xóa tất cả</button> {/* Đã sửa tiếng Việt */}
                            <button type="submit" className="btn-complete">Hoàn tất thanh toán</button> {/* Đã sửa tiếng Việt */}
                        </div>
                    </form>
                </div>
            </aside>
        </div>
    );
}
