import React, { useEffect, useState } from "react";
import "../../css/DatSanNgay.css";
import { Sidebar } from "../../components/Sidebar";
import { Link } from "react-router";
import { useNavigate } from "react-router"; // thêm đầu file
import axios from "../../utils/axiosConfig";

export function DatSanNgay() {
  const [zoomedImage, setZoomedImage] = useState(null); // lưu ảnh đang phóng to
  const [notificationCount, setNotificationCount] = useState(0);
  const [pendingBookings, setPendingBookings] = useState([]);

  const [pendingModalOpen, setPendingModalOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null); // booking để hiển thị form

  const [allMonthlyData, setAllMonthlyData] = useState([]);

  //   const currentUser =
  //   JSON.parse(localStorage.getItem("user")) ||
  //   JSON.parse(localStorage.getItem("khach"));

  // if (currentUser?.role === "Nhân viên" || currentUser?.role === "Quản lý") {
  //   console.log("Mã nhân viên:", currentUser.maNV);
  // }
  // else if (currentUser?.id && !currentUser?.maNV) {
  //   console.log("👉 Khách hàng:");
  //   console.log("Mã khách hàng:", currentUser.id);
  //   console.log("Tên KH:", currentUser.TenKh);
  //   console.log("SĐT:", currentUser.SDT);
  // }
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [maNguoiDung, setMaNguoiDung] = useState("");
  const navigate = useNavigate();
  const openingHour = 5;
  const closingHour = 24;
  const slotMinutes = 60;

  useEffect(() => {
    const currentUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("khach"));

    if (!currentUser) return;

    let role = "";
    let maNguoiDung = "";

    if (currentUser?.role === "Nhân viên" || currentUser?.role === "Quản lý") {
      role = currentUser.role;
      maNguoiDung = currentUser.maNV;
      console.log("🔹 Đang đăng nhập với vai trò:", currentUser.role);
      console.log("Mã nhân viên:", maNguoiDung);
    } else if (currentUser?.MaKH) {
      role = "Khách hàng";
      maNguoiDung = currentUser.MaKH; // ✅ sửa từ currentUser.id => currentUser.MaKH
      console.log("🔹 Khách hàng đăng nhập:");
      console.log("Mã KH:", maNguoiDung);
      console.log("Tên KH:", currentUser.TenKh);
      console.log("SĐT:", currentUser.SDT);
    }

    setUser(currentUser);
    setRole(role);
    setMaNguoiDung(maNguoiDung);
  }, []);

  const [courts, setCourts] = useState([]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [eventSlots, setEventSlots] = useState({});
  const [monthlySlots, setMonthlySlots] = useState({});
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  // 🔹 Giả lập role và mã khách hàng (sau này sẽ lấy từ API đăng nhập)

  const API_BASE = "http://localhost:3000/api/admin/san";

  const timeSlots = () => {
    const total = (closingHour - openingHour) * (60 / slotMinutes);
    return Array.from({ length: total }, (_, i) => i);
  };

  const slotToLabel = (i) => {
    const minutes = openingHour * 60 + i * slotMinutes;
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  const fetchDatSanThang = async (date, courtsArg = []) => {
    try {
      // 🔹 Chuẩn hóa ngày hiện tại
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const dateFormatted = formatDate(date.split("T")[0]);

      // 🔹 Lấy danh sách sân tháng từ API
      const res = await fetch("http://localhost:3000/api/admin/santhang/list");
      if (!res.ok) throw new Error("Lỗi khi lấy danh sách đặt sân tháng");
      const result = await res.json();
      const data = Array.isArray(result) ? result : result.data || [];

      if (!Array.isArray(data)) {
        console.error("⚠️ API không trả về mảng hợp lệ:", result);
        return;
      }

      const mapThang = {};
      const allSanThang = [];

      for (const item of data) {
        // --- Parse danh sách ngày ---
        let danhSachNgay = [];
        try {
          if (!item.DanhSachNgay) danhSachNgay = [];
          else if (Array.isArray(item.DanhSachNgay))
            danhSachNgay = item.DanhSachNgay;
          else danhSachNgay = JSON.parse(item.DanhSachNgay);
        } catch {
          // fallback nếu JSON parse lỗi
          danhSachNgay = (item.DanhSachNgay || "")
            .replace(/[\[\]"]/g, "")
            .split(",")
            .map((x) => x.trim());
        }

        // 🔹 Chuẩn hóa toàn bộ ngày
        const ngayKhongGio = danhSachNgay.map(formatDate);
        const isTodayIncluded = ngayKhongGio.includes(dateFormatted);

        // --- Parse danh sách sân ---
        let danhSachSan = [];
        try {
          if (!item.DanhSachSan) danhSachSan = [];
          else if (Array.isArray(item.DanhSachSan))
            danhSachSan = item.DanhSachSan;
          else danhSachSan = JSON.parse(item.DanhSachSan);
        } catch {
          danhSachSan = (item.DanhSachSan || "")
            .replace(/[\[\]"]/g, "")
            .split(",")
            .map((s) => s.trim());
        }

        // --- Lưu toàn bộ dữ liệu để debug ---
        allSanThang.push({
          MaDatSanThang: item.MaDatSanThang,
          DanhSachSan: danhSachSan,
          DanhSachNgay: ngayKhongGio,
          GioBatDau: item.GioBatDau,
          GioKetThuc: item.GioKetThuc,
          TrangThai: item.TrangThai,
          GhiChu: item.GhiChu,
        });

        // --- Chỉ render nếu ngày đang chọn nằm trong danh sách ---
        if (!isTodayIncluded) continue;

        // --- Xác định vị trí slot ---
        const [startH, startM] = (item.GioBatDau || "00:00:00")
          .split(":")
          .map(Number);
        const [endH, endM] = (item.GioKetThuc || "00:00:00")
          .split(":")
          .map(Number);
        const startIndex = Math.floor(
          (startH * 60 + startM - openingHour * 60) / slotMinutes
        );
        const endIndex = Math.floor(
          (endH * 60 + endM - openingHour * 60) / slotMinutes
        );

        danhSachSan.forEach((san) => {
          const courtNum = san.replace(/\D/g, "");
          const ci = courtsArg.findIndex(
            (c) => c.MaSan.replace(/\D/g, "") === courtNum
          );
          if (ci === -1) return;
          if (!mapThang[ci]) mapThang[ci] = [];

          mapThang[ci].push({
            start: startIndex,
            end: endIndex,
            khach: item.GhiChu || "Khách tháng",
            MaDatSanThang: item.MaDatSanThang,
          });
        });
      }

      // 🔹 Cập nhật state (sau khi xử lý toàn bộ)
      setMonthlySlots(mapThang);
      setAllMonthlyData?.(allSanThang);
    } catch (err) {
      console.error("❌ Lỗi khi lấy sân tháng:", err);
    }
  };

  // 🔹 Lấy danh sách sân + sự kiện
  const fetchCourts = async (date) => {
    try {
      const resCourts = await fetch(`${API_BASE}?date=${date}`);
      if (!resCourts.ok) throw new Error("Lỗi khi lấy danh sách sân");
      let courtsData = await resCourts.json();

      // sắp xếp theo thứ tự sân
      const lower = courtsData.filter((c) => +c.MaSan.replace(/\D/g, "") < 10);
      const higher = courtsData.filter(
        (c) => +c.MaSan.replace(/\D/g, "") >= 10
      );
      courtsData = [...lower, ...higher];
      setCourts(courtsData);

      // sự kiện
      const resEvent = await fetch(
        `http://localhost:3000/api/admin/xeve/sukien/date?date=${date}`
      );

      let eventData = [];
      if (resEvent.ok) {
        eventData = await resEvent.json();
        eventData = eventData.filter((ev) => {
          const localDate = new Date(ev.NgayToChuc).toLocaleDateString(
            "sv-SE",
            { timeZone: "Asia/Ho_Chi_Minh" }
          );
          return localDate === date;
        });
      }

      // map sự kiện vào sân
      const eventSlotMap = {};
      eventData.forEach((ev) => {
        const courtNames = ev.DanhSachSan.split(",").map((s) =>
          s.trim().replace(/^S/, "")
        );
        const [startH, startM] = ev.ThoiGianBatDau.split(":").map(Number);
        const [endH, endM] = ev.ThoiGianKetThuc.split(":").map(Number);

        const startIndex = Math.floor(
          (startH * 60 + startM - openingHour * 60) / slotMinutes
        );
        const endIndex = Math.floor(
          (endH * 60 + endM - openingHour * 60) / slotMinutes
        );

        courtsData.forEach((court, ci) => {
          const courtNum = court.MaSan.replace(/\D/g, "");
          if (courtNames.includes(courtNum)) {
            if (!eventSlotMap[ci]) eventSlotMap[ci] = [];
            eventSlotMap[ci].push({
              start: startIndex,
              end: endIndex,
              name: ev.TenSuKien,
              startTime: ev.ThoiGianBatDau,
              endTime: ev.ThoiGianKetThuc,
            });
          }
        });
      });
      setEventSlots(eventSlotMap);

      // map lịch đặt sân
      const booked = {};
      courtsData.forEach((court, ci) => {
        booked[ci] = [];
        if (court.bookedSlots) {
          court.bookedSlots.forEach((slot) => {
            const [startH, startM] = slot.GioVao.split(":").map(Number);
            const [endH, endM] = slot.GioRa.split(":").map(Number);
            const startIndex = Math.floor(
              (startH * 60 + startM - openingHour * 60) / slotMinutes
            );
            const endIndex = Math.floor(
              (endH * 60 + endM - openingHour * 60) / slotMinutes
            );
            for (let i = startIndex; i < endIndex; i++) booked[ci].push(i);
          });
        }
      });
      setBookedSlots(booked);

      await fetchDatSanThang(date, courtsData);
    } catch (err) {
      console.error("❌ Lỗi lấy dữ liệu sân/booked:", err);
    }
  };

  useEffect(() => {
    fetchCourts(selectedDate);
  }, [selectedDate]);

  // ✅ Lấy giá theo giờ
  const getPrice = (court, slotIndex) => {
    const hour = openingHour + slotIndex;
    return hour >= 16
      ? Number(court.GiaThueSau16) || 0
      : Number(court.GiaThueTruoc16) || 0;
  };

  // ✅ Xử lý chọn/hủy slot
  const handleSlotClick = (ci, slotIndex) => {
    const key = `${ci}-${slotIndex}`;
    const court = courts[ci];
    const price = getPrice(court, slotIndex);

    if (bookedSlots[ci]?.includes(slotIndex)) return;
    if (
      eventSlots[ci]?.some((ev) => slotIndex >= ev.start && slotIndex < ev.end)
    )
      return;

    let newSelected = [...selectedSlots];
    let newTotal = total;

    if (newSelected.includes(key)) {
      // Hủy chọn
      newSelected = newSelected.filter((k) => k !== key);
      newTotal -= price;
    } else {
      // Chọn mới
      newSelected.push(key);
      newTotal += price;
    }

    setSelectedSlots(newSelected);
    setTotal(newTotal);
  };

  // 🔹 Vẽ lưới hiển thị sân (gộp booked theo khách + sự kiện)
  const buildGrid = () => {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // yyyy-mm-dd hiện tại
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const gridEl = document.getElementById("grid");
    if (!gridEl) return;
    gridEl.innerHTML = "";

    const slots = timeSlots();

    // Header
    const headWrapper = document.createElement("div");
    headWrapper.className = "grid-head-wrapper";
    const head = document.createElement("div");
    head.className = "grid-head";

    const blank = document.createElement("div");
    blank.className = "hcell side";
    blank.textContent = "Sân / Giờ";
    head.appendChild(blank);

    slots.forEach((i) => {
      const h = document.createElement("div");
      h.className = "hcell";
      h.textContent = slotToLabel(i);
      head.appendChild(h);
    });
    headWrapper.appendChild(head);
    gridEl.appendChild(headWrapper);

    // Rows
    const rowsWrapper = document.createElement("div");
    rowsWrapper.className = "grid-rows-wrapper";

    courts.forEach((court, ci) => {
      const row = document.createElement("div");
      row.className = "row";

      const side = document.createElement("div");
      side.className = "cell side";
      side.textContent = court.TenSan || `Sân ${ci + 1}`;
      row.appendChild(side);

      for (let i = 0; i < slots.length; i++) {
        const key = `${ci}-${i}`;

        // Kiểm tra event
        const ev = eventSlots[ci]?.find((ev) => i >= ev.start && i < ev.end);
        if (ev) {
          if (i === ev.start) {
            const eventCell = document.createElement("div");
            eventCell.className = "cell slot event";
            eventCell.textContent = ev.name;
            eventCell.style.gridColumn = `span ${ev.end - ev.start}`;
            eventCell.style.textAlign = "center";
            eventCell.style.fontWeight = "500";
            eventCell.style.backgroundColor = "#d4b0ff";
            row.appendChild(eventCell);
          }
          continue; // bỏ qua các ô đã hiển thị
        }

        // Kiểm tra sân tháng
        const thangSlot = monthlySlots[ci]?.find(
          (m) => i >= m.start && i < m.end
        );
        if (thangSlot) {
          if (i === thangSlot.start) {
            const thangCell = document.createElement("div");
            thangCell.className = "cell slot month";
            // thangCell.textContent = thangSlot.khach;
            thangCell.textContent =
              role === "khachhang" ? "Sân đặt tháng" : thangSlot.khach;
            thangCell.style.gridColumn = `span ${thangSlot.end - thangSlot.start
              }`;
            thangCell.style.backgroundColor = "#5cc9a7";
            thangCell.style.color = "#fff";
            thangCell.style.textAlign = "center";
            row.appendChild(thangCell);
          }
          continue;
        }

        // Kiểm tra booked
        const bookedSlot = court.bookedSlots?.find((b) => {
          const [startH, startM] = b.GioVao.split(":").map(Number);
          const [endH, endM] = b.GioRa.split(":").map(Number);
          const startIndex = Math.floor(
            (startH * 60 + startM - openingHour * 60) / slotMinutes
          );
          const endIndex = Math.floor(
            (endH * 60 + endM - openingHour * 60) / slotMinutes
          );
          return i >= startIndex && i < endIndex;
        });

        if (bookedSlot) {
          if (i === Math.floor((bookedSlot.GioVao.split(":")[0] * 60 + Number(bookedSlot.GioVao.split(":")[1]) - openingHour * 60) / slotMinutes)) {
            const [startH, startM] = bookedSlot.GioVao.split(":").map(Number);
            const [endH, endM] = bookedSlot.GioRa.split(":").map(Number);
            const startIndex = Math.floor((startH * 60 + startM - openingHour * 60) / slotMinutes);
            const endIndex = Math.floor((endH * 60 + endM - openingHour * 60) / slotMinutes);

            const bookedCell = document.createElement("div");
            bookedCell.className = "cell slot booked";
            bookedCell.style.gridColumn = `span ${endIndex - startIndex}`;
            bookedCell.style.backgroundColor = "#fa4f4fff";
            bookedCell.style.color = "#ffffff";
            bookedCell.style.borderRight = "1px solid #fff";
            bookedCell.style.position = "relative";

            // 🔹 Role khác nhau
            if (role === "khachhang") {
              if (bookedSlot.MaKH !== maNguoiDung) {
                bookedCell.textContent = "Đã đặt";
              } else {
                bookedCell.textContent = bookedSlot.KhachHang || "Bạn";
                bookedCell.style.cursor = "pointer"; // hiện pointer
                bookedCell.addEventListener("click", () =>
                  setSelectedBooking(bookedSlot)
                );
              }
            } else {
              // Nhân viên/quản lý hiển thị tên khách
              bookedCell.textContent = bookedSlot.KhachHang || "";
              bookedCell.style.cursor = "pointer";
              bookedCell.addEventListener("click", () => setSelectedBooking(bookedSlot));
            }


            // 🔔 Icon pending vẫn giữ
            if (bookedSlot.TrangThai === "pending") {
              const warningIcon = document.createElement("span");
              warningIcon.className = "pending-icon";
              warningIcon.innerHTML = "⚠️";
              bookedCell.appendChild(warningIcon);
            }

            row.appendChild(bookedCell);
          }
          continue;
        }


        // Ô trống để chọn
        const cell = document.createElement("div");
        cell.dataset.court = ci;
        cell.dataset.slot = i;

        // Kiểm tra slot quá hạn
        const slotStartMinutes = openingHour * 60 + i * slotMinutes;
        const now = new Date();
        const currentDate = now.toISOString().split("T")[0];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const selected = new Date(selectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // reset giờ phút giây
        selected.setHours(0, 0, 0, 0);

        if (selected < today) {
          // Ngày đã qua, tất cả slot là past
          cell.className = "cell slot past";
          cell.style.backgroundColor = "#cccccc";
        } else if (
          selected.getTime() === today.getTime() &&
          slotStartMinutes <= currentMinutes
        ) {
          // Hôm nay, slot trôi qua
          cell.className = "cell slot past";
          cell.style.backgroundColor = "#cccccc";
        } else {
          // Slot còn chọn được
          cell.className = "cell slot avail";
          cell.addEventListener("click", () => handleSlotClick(ci, i));
          if (selectedSlots.includes(key)) {
            cell.style.backgroundColor = "#f9e07aff";
            cell.style.border = "1px solid black";
          }
        }

        row.appendChild(cell);
      }

      rowsWrapper.appendChild(row);
    });

    gridEl.appendChild(rowsWrapper);
  };

  useEffect(() => {
    if (courts.length > 0) buildGrid();
  }, [courts, bookedSlots, eventSlots, selectedSlots, monthlySlots]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlots([]);
    setTotal(0);
  };

  const handleConfirm = () => {
    if (selectedSlots.length === 0) {
      alert("Vui lòng chọn ít nhất 1 ô sân!");
      return;
    }

    // tạo dữ liệu để gửi sang XacNhanDatSan
    const bookingData = {
      date: selectedDate,
      selectedSlots: selectedSlots.map((key) => {
        const [ci, slotIndex] = key.split("-").map(Number);
        return { courtIndex: ci, slotIndex };
      }),
      bookingType: "Đặt sân ngày",
      role: role,
      maNguoiDung: maNguoiDung,
    };

    // lưu vào localStorage để XacNhanDatSan đọc
    localStorage.setItem("bookingData", JSON.stringify(bookingData));

    // navigate sang trang xác nhận
    navigate("/xacnhansan");
  };

  const handleAccept = (bookingId) => {
    axios
      .put("http://localhost:3000/api/admin/san/accept", { MaDatSan: bookingId }) // ✅ PUT
      .then(() => {
        setPendingBookings((prev) =>
          prev.filter((b) => b.MaDatSan !== bookingId)
        );
        alert("Booking đã được chấp nhận!");
      })
      .catch((err) => {
        console.error(err);
        alert("Có lỗi khi chấp nhận booking");
      });
  };

  const handleBellClick = () => {
    axios
      .get(`${BASE_URL}/api/admin/san?date=${selectedDate}`)
      .then((res) => {
        const pending = res.data
          .flatMap((san) => san.bookedSlots || [])
          .filter((b) => b.TrangThai === "pending")
          .map((b) => ({
            ...b,
            NgayLap: new Date(b.NgayLap).toLocaleDateString("sv-SE", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          }));

        console.log("Pending bookings:", pending);
        setPendingBookings(pending);
        setPendingModalOpen(true);
        setNotificationCount(pending.length);
      })
      .catch((err) => console.log(err));
  };

  const BASE_URL = "http://localhost:3000"; // port backend của bạn

  return (
    <div className="sanngay-container">
      {(role === "Nhân viên" || role === "Quản lý") && <Sidebar />}

      {/* Modal thông tin booking cho quản lý */}
      {selectedBooking && (
        (role === "nhanvien" || selectedBooking.MaKH === maNguoiDung) && (
          <div className="booking-modal" onClick={() => setSelectedBooking(null)}>
            <div
              className="booking-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Thông tin đặt sân</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedBooking(null)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>MaDatSan:</strong> {selectedBooking.MaDatSan}
                </p>
                <p>
                  <strong>MaSan:</strong> {selectedBooking.MaSan}
                </p>
                <p>
                  <strong>Khách hàng:</strong> {selectedBooking.KhachHang}
                </p>
                <p>
                  <strong>Ngày:</strong> {selectedBooking.NgayLap?.split("T")[0]}
                </p>
                <p>
                  <strong>Giờ vào:</strong> {selectedBooking.GioVao}
                </p>
                <p>
                  <strong>Giờ ra:</strong> {selectedBooking.GioRa}
                </p>
                <p>
                  <strong>Tổng tiền:</strong>{" "}
                  {selectedBooking.TongTien?.toLocaleString("vi-VN")} đ
                </p>
                <p>
                  <strong>Trạng thái:</strong> {selectedBooking.TrangThai}
                </p>
                <p>
                  <strong>Ghi chú:</strong> {selectedBooking.GhiChu || "Không có"}
                </p>
                {selectedBooking.PaymentScreenshot && (
                  <img
                    src={`${BASE_URL}/uploads/payments/${selectedBooking.PaymentScreenshot}`}
                    alt="Payment"
                    style={{ width: "100%", marginTop: "10px" }}
                  />
                )}
              </div>
            </div>
          </div>
        )
      )}

      <div className="sanngay-content">
        <header className="datsan-header">
          <div className="left">
            {/* <div className="brand">Pickleball Bồ Đề</div> */}
            <div className="control">
              <label>Ngày</label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
              />
            </div>
          </div>
          {/* 🔔 Nút chuông thông báo */}
          <div className="notification-bell" onClick={handleBellClick}>
            <i className="fa fa-bell"></i>
            {notificationCount > 0 && (
              <span className="badge">{notificationCount}</span>
            )}
          </div>

          {/* Modal pending */}
          {pendingModalOpen && (
            <div className="pending-modal">
              <div className="pending-modal-content">
                <div className="modal-header">
                  <h3>Danh sách sân pending</h3>
                  <button
                    className="close-btn"
                    onClick={() => setPendingModalOpen(false)}
                  >
                    &times; Thoát
                  </button>
                </div>

                <div className="modal-table-wrapper">
                  <table className="pending-table">
                    <thead>
                      <tr>
                        <th>MaDatSan</th>
                        <th>MaSan</th>
                        <th>MaKH</th>
                        <th>NgayLap</th>
                        <th>GioVao</th>
                        <th>GioRa</th>
                        <th>TongTien</th>
                        <th>Payment Screenshot</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(role === "nhanvien" // quản lý/nhân viên
                        ? pendingBookings
                        : pendingBookings.filter((b) => b.MaKH === maNguoiDung)
                      ) // khách hàng
                        .map((b) => (
                          <tr key={b.MaDatSan}>
                            <td>{b.MaDatSan}</td>
                            <td>{b.MaSan}</td>
                            <td>{b.KhachHang || b.MaKH}</td>
                            <td>{b.NgayLap?.split("T")[0]}</td>
                            <td>{b.GioVao}</td>
                            <td>{b.GioRa}</td>
                            <td>{b.TongTien?.toLocaleString("vi-VN")} đ</td>
                            <td>
                              {b.PaymentScreenshot ? (
                                <img
                                  src={`${BASE_URL}/uploads/payments/${b.PaymentScreenshot}`}
                                  className="payment-img"
                                  alt="Payment"
                                  onClick={() =>
                                    setZoomedImage(b.PaymentScreenshot)
                                  }
                                  style={{ cursor: "pointer" }}
                                />
                              ) : (
                                "Chưa có"
                              )}
                            </td>
                            {role === "nhanvien" && (
                              <td>
                                <button
                                  className="accept-btn"
                                  onClick={() => handleAccept(b.MaDatSan)}
                                >
                                  Chấp nhận
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="right legend">
            <span className="dot a"></span>
            <small>Còn trống</small>
            <span className="dot c"></span>
            <small>Đã đặt</small>
            <span className="dot d"></span>
            <small>Sự kiện</small>
            <span className="dot s"></span>
            <small>Đang chọn</small>
            <span className="dot m"></span>
            <small>Đặt tháng</small>
          </div>
        </header>

        <div className="grid-wrapper" id="grid"></div>

        <div className="confirm-area">
          <div className="total">Tổng: {total.toLocaleString("vi-VN")} đ</div>
          <button className="btn-confirm" onClick={handleConfirm}>
            <Link to="/xacnhansan"></Link>
            XÁC NHẬN
          </button>
        </div>

        {/* Modal phóng to ảnh */}
        {zoomedImage && (
          <div
            className="image-modal"
            onClick={() => setZoomedImage(null)} // click ngoài sẽ tắt
          >
            <img
              src={`${BASE_URL}/uploads/payments/${zoomedImage}`}
              alt="Payment"
            />
          </div>
        )}
      </div>
    </div>
  );
}
