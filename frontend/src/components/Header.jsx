import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import "./Header.css";

const Header = () => {
  const { getCartCount } = useCart();
  const [userName, setUserName] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear(); // ⚠️ Xóa tất cả dữ liệu trong localStorage
    setUserName(null);
    setRole(null);
    navigate("/login");
  };


  const checkLoginStatus = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const khach = JSON.parse(localStorage.getItem("khach"));

    if (user && (user.role === "Nhân viên" || user.role === "Quản lý")) {
      // Nhân viên hoặc Quản lý
      setUserName(user.userName);
      setRole(user.role);
      console.log("🔹 Đăng nhập với vai trò:", user.role);
    } else if (khach) {
      // Khách hàng
      setUserName(khach.TenKh);
      setRole(khach.role);
      console.log("🔹 Khách hàng đăng nhập:", khach.TenKh, khach.role);
    } else {
      setUserName(null);
      setRole(null);
    }
  };


  useEffect(() => {
    checkLoginStatus();
    window.addEventListener("storage", checkLoginStatus);
    return () => window.removeEventListener("storage", checkLoginStatus);
  }, []);

  return (
    <header className="header">
      <div className="header-main">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <h3>Pickleball Bồ đề</h3>
            </Link>

            <nav className="nav">
              {/* <Link to="/">Trang chủ</Link>  */}
              {/* <Link to="/shop">Shop</Link> */}
              {role !== "Nhân viên" && (
                <>
                  <Link to="/">Trang chủ</Link>
                  <Link to="/shop">Shop</Link>
                </>
              )}

              {/* <Link to="/">Trang chủ</Link>
              <Link to="/shop">Shop</Link> */}

              {/* Chỉ hiện menu Quản lý/Bán hàng cho Nhân viên hoặc Quản lý */}
              {role === "Nhân viên" && (
                <>
                  <Link to="/">Trang chủ</Link>
                  <Link to="/pos">Bán hàng tại quầy</Link>
                  <Link to="/calam">Đăng ký ca làm</Link>
                </>
              )}
              {userName && (role !== "Quản lý") && (
                <div className="nav-dropdown">
                  <span className="dropdown-title">Đặt sân ▾</span>
                  <div className="dropdown-menu">
                    <Link to="/dat-san">Đặt sân ngày</Link>
                    <Link to="/santhang">Đặt sân tháng</Link>
                    <Link to="/datve">Xé vé</Link>
                  </div>
                </div>
              )}
              {/* {(role === "Quản lý") && (
                </>
              )} */}
              {role === "Quản lý" && (
                <>
                  <Link to="/dat-san">Quản lý</Link>
                  <Link to="/pos">Bán hàng tại quầy</Link>
                </>
              )}
            </nav>

            <div className="header-actions">
              {userName ? (
                <>
                  <Link to="/profile" className="action-icon login-icon">
                    <span>
                      Xin chào,{" "}
                      {userName.length > 20
                        ? userName.slice(0, 20) + "..."
                        : userName}
                    </span>
                  </Link>
                  <div
                    className="action-icon logout-icon"
                    onClick={handleLogout}
                    title="Đăng xuất"
                  >
                    <span>Đăng xuất</span>
                  </div>
                </>
              ) : (
                <Link to="/login" className="action-icon login-icon">
                  <span>Đăng nhập</span>
                </Link>
              )}

              {role !== "Nhân viên" && (
                <Link to="/cart" className="cart-icon-wrapper">
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
                    {getCartCount() > 0 && (
                      <span className="cart-badge">{getCartCount()}</span>
                    )}
                  </div>
                  <span className="cart-text">Giỏ hàng</span>
                </Link>
              )}

            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
