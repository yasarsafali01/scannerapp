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

app.listen(port, () => {
  console.log(`FreeScanner backend http://localhost:${port} adresinde çalışıyor`);
});
