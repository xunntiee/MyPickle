import { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import '../../css/AdminProducts.css';
import { Sidebar } from '../../components/Sidebar';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({
        id: null,
        name: '',
        description: '',
        price: '',
        original_price: '',
        category: '',
        image_url: '',
        images: [],
        colors: [],
        stock: '',
        is_new: false,
        discount_percent: 0
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // State cho tìm kiếm và phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(10);
    const [totalProducts, setTotalProducts] = useState(0);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [currentPage, searchTerm]); // Trigger fetch khi trang hoặc từ khóa tìm kiếm thay đổi

    const fetchProducts = async () => {
        try {
            const params = {
                page: currentPage,
                limit: productsPerPage,
                search: searchTerm,
            };
            const response = await axios.get('/api/client/products', { params });
            setProducts(response.data.products);
            setTotalProducts(response.data.totalCount);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            // Lấy tất cả danh mục cho dropdown, không phân trang
            const response = await axios.get('/api/client/categories');
            setCategories(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentProduct({
            ...currentProduct,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleArrayInput = (field, value) => {
        const items = value.split(',').map(item => item.trim()).filter(item => item);
        setCurrentProduct({
            ...currentProduct,
            [field]: items
        });
    };

    const openAddModal = () => {
        alert('Commerce catalog is now managed in Trevo. Please add products in Trevo.');
    };

    const openEditModal = (product) => {
        alert(`"${product.name}" is managed in Trevo. Please edit products in Trevo.`);
    };

    const closeModal = () => {
        setShowModal(false);
        setImageFile(null);
        setImagePreview('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        // Thêm tất cả các trường vào formData
        Object.keys(currentProduct).forEach(key => {
            if (key === 'images' || key === 'colors') {
                formData.append(key, JSON.stringify(currentProduct[key]));
            } else if (currentProduct[key] !== null) {
                formData.append(key, currentProduct[key]);
            }
        });

        if (imageFile) {
            formData.append('image', imageFile); // 'image' phải khớp với tên field trong productUpload.single('image')
        }

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (editMode) {
                await axios.put(`/api/admin/products/${currentProduct.id}`, formData, config);
                alert('Product updated successfully!');
            } else {
                await axios.post('/api/admin/products', formData, config);
                alert('Product added successfully!');
            }

            closeModal();
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        alert(`Product ${id} is managed in Trevo. Delete or deactivate it in Trevo.`);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset về trang đầu tiên khi tìm kiếm
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const totalPages = Math.ceil(totalProducts / productsPerPage);

    return (
        <div className="admin-container">
            <Sidebar />
            <div className="admin-content">
                <div className="admin-products-header">
                    <h2>Product Management</h2>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        + Add New Product
                    </button>
                </div>

                <div className="admin-search-wrapper">
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm theo mã HĐ, tên, SĐT khách hàng..."
                        className="admin-search-bar"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>

                <div className="products-table-container">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <img
                                            src={product.image_url || '/images/default-product.png'}
                                            alt={product.name}
                                            className="product-thumb"
                                        />
                                    </td>
                                    <td>
                                        <div className="product-name-cell">
                                            <strong>{product.name}</strong>
                                        </div>
                                    </td>
                                    <td>{product.category_name || product.category}</td>
                                    <td>
                                        <div className="price-cell">
                                            <span className="current">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                                            </span>
                                            {product.original_price && (
                                                <span className="original">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.original_price)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`stock ${product.stock > 20 ? 'in-stock' : 'low-stock'}`}>
                                            {product.stock} units
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status ${product.stock > 0 ? 'active' : 'out-of-stock'}`}>
                                            {product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                className="btn-icon btn-edit"
                                                onClick={() => openEditModal(product)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon btn-delete"
                                                onClick={() => handleDelete(product.id)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content-product" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header-product">
                                <h3>{editMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                                <button className="modal-close" onClick={closeModal}>×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="product-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tên sản phẩm *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={currentProduct.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Danh mục *</label>
                                        <select
                                            name="category"
                                            value={currentProduct.category}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.name}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Mô tả *</label>
                                    <textarea
                                        name="description"
                                        value={currentProduct.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Giá (VND) *</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={currentProduct.price}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Giá gốc (VND)</label>
                                        <input
                                            type="number"
                                            name="original_price"
                                            value={currentProduct.original_price}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Tồn kho *</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={currentProduct.stock}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Giảm giá %</label>
                                        <input
                                            type="number"
                                            name="discount_percent"
                                            value={currentProduct.discount_percent}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Ảnh chính (Tải lên từ máy tính)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        required={!imageFile && !currentProduct.image_url}
                                    />
                                </div>

                                {imagePreview && (
                                    <div className="form-group">
                                        <label>Xem trước ảnh</label>
                                        <img src={imagePreview} alt="Preview" style={{ maxWidth: '100px', borderRadius: '4px' }} />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Màu sắc (cách nhau bằng dấu phẩy)</label>
                                    <input
                                        type="text"
                                        value={currentProduct.colors.join(', ')}
                                        onChange={(e) => handleArrayInput('colors', e.target.value)}
                                        placeholder="Đen, Xanh, Đỏ"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="is_new"
                                            checked={currentProduct.is_new}
                                            onChange={handleInputChange}
                                        />
                                        <span>Đánh dấu là sản phẩm MỚI</span>
                                    </label>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={closeModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;
