import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { warpToRectangle } from "../scan/perspectiveWarp.js";
import { applyScanFilter } from "../scan/applyFilter.js";
import { extractText } from "../scan/ocr.js";
import { buildPdfFromJpeg } from "../scan/pdf.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const router = Router();

router.post("/scan", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Görüntü dosyası bulunamadı ('file' alanı zorunlu)." });
  }

  const mode = req.body.mode || "gray";
  const wantOcr = req.body.ocr === "true" || req.body.ocr === true;

  let corners = null;
  if (req.body.corners) {
    try {
      const parsed = JSON.parse(req.body.corners);
      if (
        Array.isArray(parsed) &&
        parsed.length === 4 &&
        parsed.every((p) => typeof p.x === "number" && typeof p.y === "number")
      ) {
        corners = parsed;
      }
    } catch {
      // ignore malformed corners, fall back to no warp
    }
  }

  try {
    const { data, info } = await sharp(req.file.buffer)
      .rotate() // EXIF yönünü düzelt
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const warped = corners
      ? warpToRectangle({ data, width: info.width, height: info.height }, corners)
      : { data, width: info.width, height: info.height };

    const jpegBuffer = await applyScanFilter(warped, mode);

    const [pdfBuffer, text] = await Promise.all([
      buildPdfFromJpeg(jpegBuffer, { width: warped.width, height: warped.height }),
      wantOcr ? extractText(jpegBuffer) : Promise.resolve(null),
    ]);

    res.json({
      warped: Boolean(corners),
      mode,
      image: `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`,
      pdf: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
      text,
    });
  } catch (err) {
    console.error("Tarama hatası:", err);
    res.status(500).json({ error: "Görüntü işlenirken bir hata oluştu." });
  }
});

export default router;
