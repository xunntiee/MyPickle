import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/DatXeVe.css";

export function DatXeVe() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(""); // 📅 Ngày được chọn

  const navigate = useNavigate(); // ✅ Dùng để chuyển trang

  // 🔹 Gọi API lấy danh sách sự kiện
  useEffect(() => {
    const fetchXeVe = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/admin/xeve/sukien");
        const data = await res.json();
        setEvents(data);
        setFilteredEvents(data); // mặc định hiển thị tất cả
      } catch (err) {
        console.error("Lỗi khi lấy danh sách sự kiện xé vé:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchXeVe();
  }, []);

  // 🔹 Xử lý lọc sự kiện khi chọn ngày
  useEffect(() => {
    if (!selectedDate) {
      setFilteredEvents(events);
      return;
    }

    const today = new Date();
    const target = new Date(selectedDate);
    const filtered = events.filter((e) => {
      const eventDate = new Date(e.NgayToChuc);
      return eventDate >= today && eventDate <= target;
    });

    setFilteredEvents(filtered);
  }, [selectedDate, events]);

  // 🔹 Khi bấm chọn 1 sự kiện
  const handleSelectEvent = (event) => {
    console.log("Sự kiện được chọn:", event);

    // Khởi tạo role và mã khách
    const role = "khach";
    const MaKH = "KH002";

    // Chuyển sang trang chi tiết, kèm theo dữ liệu sự kiện và thông tin khách
    navigate("/chitietve", { state: { event, role, MaKH } });
  };

  if (loading) return <div className="dxv-container">Đang tải dữ liệu...</div>;

  return (
    <div className="dxv-container">
      <div className="dxv-header">
        <h1>Đặt lịch sự kiện</h1>

        {/* 📅 Input chọn ngày */}
        <div className="date-filter">
          <label htmlFor="dateFilter">Xem đến ngày: </label>
          <input
            type="date"
            id="dateFilter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="event-grid">
        {filteredEvents.length === 0 ? (
          <p>Không có sự kiện nào trong khoảng thời gian này.</p>
        ) : (
          filteredEvents.map((item) => {
            const date = new Date(item.NgayToChuc);
            const formattedDate = date.toLocaleDateString("vi-VN");
            const timeStart = item.ThoiGianBatDau?.slice(0, 5);
            const timeEnd = item.ThoiGianKetThuc?.slice(0, 5);

            return (
              <div
                key={item.MaXeVe}
                className="event-card"
                onClick={() => handleSelectEvent(item)}
              >
                <div className="event-header">
                  <span>
                    #{item.MaXeVe}: [{item.TenSuKien}]
                  </span>
                  <span>{formattedDate}</span>
                </div>
                <div className="event-info">
                  <p>
                    {timeStart} - {timeEnd} | {item.DanhSachSan}
                  </p>
                </div>
                <div className="event-footer">
                  <div className="count">
                    {item.TongSoNguoi || 0}/{item.SoLuongToiDa || 0}
                  </div>
                  <button className="btn-price">{item.GiaVe || "100k"}/Vé</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
