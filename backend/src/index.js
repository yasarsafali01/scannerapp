import "dotenv/config";
import express from "express";
import cors from "cors";
import scanRouter from "./routes/scan.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", scanRouter);

// multer/express hatalarını da JSON olarak döndür ki mobil/web taraf gerçek nedeni görebilsin
app.use((err, req, res, _next) => {
  console.error(`İstek hatası [${req.method} ${req.originalUrl}]:`, err.code || err.name, err.field || "", err.message);

  if (err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ error: "Bir seferde en fazla 60 sayfa ekleyebilirsiniz. Lütfen daha az sayfayla tekrar deneyin." });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Dosya boyutu çok büyük (en fazla 20MB)." });
  }

  res.status(400).json({ error: err.message || "İstek işlenemedi." });
});

const server = app.listen(port, () => {
  console.log(`FreeScanner backend http://localhost:${port} adresinde çalışıyor`);
});

// Coklu sayfa + OCR istekleri birkaç dakika surebilir; Node'un varsayilan
// istek zaman asimi bunu erken kesmesin diye kapatiyoruz.
server.requestTimeout = 0;
server.headersTimeout = 60000;
