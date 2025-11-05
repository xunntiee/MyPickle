import React, { useState } from "react";
import axios from "../../utils/axiosConfig";
import { Link } from "react-router-dom";
import "../../css/ForgotPassword.css";

export default function ForgotPassword() {
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [maTK, setMaTK] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // 🔹 Kiểm tra mật khẩu
    if (!newPassword || !confirmPassword) {
      setMessage("❌ Vui lòng nhập mật khẩu mới và xác nhận.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("❌ Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      const payload = {
        role:
          role === "employee"
            ? "Nhân viên"
            : role === "Quản lý"
              ? "Quản lý"
              : "Khách hàng",
        email,
        maTK,
        newPassword,
        confirmPassword,
      };

      const res = await axios.post(
        "/api/admin/taikhoan/forgot-password",
        payload
      );

      setMessage(res.data.success ? `✅ ${res.data.message}` : `❌ ${res.data.message}`);
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu:", error);
      setMessage("❌ Lỗi kết nối đến server!");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box animate-pop">
        <h2>Quên mật khẩu</h2>
        <p>Chọn loại tài khoản để khôi phục mật khẩu.</p>

        {/* 🔹 Chọn loại tài khoản */}
        <div className="role-selector">
          <label className={role === "customer" ? "active" : ""}>
            <input
              type="radio"
              name="role"
              value="customer"
              checked={role === "customer"}
              onChange={() => setRole("customer")}
            />
            Khách hàng
          </label>

          <label className={role === "employee" ? "active" : ""}>
            <input
              type="radio"
              name="role"
              value="employee"
              checked={role === "employee"}
              onChange={() => setRole("employee")}
            />
            Nhân viên
          </label>

          <label className={role === "Quản lý" ? "active" : ""}>
            <input
              type="radio"
              name="role"
              value="Quản lý"
              checked={role === "Quản lý"}
              onChange={() => setRole("Quản lý")}
            />
            Quản lý
          </label>
        </div>

        {/* 🔹 Form nhập dữ liệu */}
        <form onSubmit={handleSubmit}>
          {role === "customer" && (
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          {(role === "employee" || role === "Quản lý") && (
            <input
              type="text"
              placeholder="Nhập mã tài khoản (maTK)"
              value={maTK}
              onChange={(e) => setMaTK(e.target.value)}
              required
            />
          )}

          <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit">Cập nhật mật khẩu</button>
        </form>

        {message && <p className="message">{message}</p>}

        <p>
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
