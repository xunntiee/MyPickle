import 'dotenv/config';

import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from "./api/index.js";

// Cần thiết để lấy __dirname trong ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Thay thế dòng app.use(cors()); bằng đoạn code này
app.use(cors({
  origin: 'https://my-pickle-bay.vercel.app' // <-- THAY BẰNG DOMAIN BẠN VỪA COPY
}));

app.use(express.json());

// Middleware để phục vụ file tĩnh từ thư mục 'uploads'
// Điều này rất quan trọng để hiển thị hình ảnh sản phẩm
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Định tuyến API
app.use("/api", apiRouter);

// Kiểm tra server
app.get("/", (req, res) => {
  res.send("✅ Pickleball Backend đang chạy!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
