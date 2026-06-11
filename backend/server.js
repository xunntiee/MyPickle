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

  function parseOrigins(value) {
    return String(value || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  const defaultCorsOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://my-pickle-bay.vercel.app',
  ];
  const corsOrigins = parseOrigins(process.env.CORS_ORIGINS);

  app.use(cors({
    origin: corsOrigins.length > 0 ? corsOrigins : defaultCorsOrigins,
    credentials: true,
  }));

  app.use(express.json());

  // Middleware để phục vụ file tĩnh từ thư mục 'uploads'
  // Điều này rất quan trọng để hiển thị hình ảnh sản phẩm
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Định tuyến API
  app.use("/api", apiRouter);

  // Redirect /products to /api/client/products for backward compatibility
  app.get("/products", (req, res) => {
    res.redirect(`/api/client/products${req.url.substring('/products'.length)}`);
  });

  // Kiểm tra server
  app.get("/", (req, res) => {
    res.send("✅ Pickleball Backend đang chạy!");
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server chạy tại http://0.0.0.0:${PORT}`);
  });
