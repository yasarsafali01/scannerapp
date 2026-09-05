import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { warpToRectangle, rotateRaw } from "../scan/perspectiveWarp.js";
import { applyScanFilter } from "../scan/applyFilter.js";
import { extractText } from "../scan/ocr.js";
import { buildPdfFromJpeg, buildPdfFromJpegs } from "../scan/pdf.js";

const MAX_PAGES = 60;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const router = Router();

function parseCorners(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length === 4 &&
      parsed.every((p) => typeof p.x === "number" && typeof p.y === "number")
    ) {
      return parsed;
    }
  } catch {
    // ignore malformed corners, fall back to no warp
  }
  return null;
}

function parseRotation(raw) {
  const n = Number(raw);
  return [0, 90, 180, 270].includes(n) ? n : 0;
}

function clampAdjust(n) {
  return Math.max(-50, Math.min(50, Number(n) || 0));
}

function parseAdjust(body) {
  return { brightness: clampAdjust(body.brightness), contrast: clampAdjust(body.contrast) };
}

function parseJsonArray(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function processPage(fileBuffer, { corners, rotation, mode, adjust }) {
  const { data, info } = await sharp(fileBuffer)
    .rotate() // EXIF yönünü düzelt
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let page = corners
    ? warpToRectangle({ data, width: info.width, height: info.height }, corners)
    : { data, width: info.width, height: info.height };

  page = await rotateRaw(page, rotation);

  const jpegBuffer = await applyScanFilter(page, mode, adjust);
  return { jpegBuffer, width: page.width, height: page.height };
}

router.post("/scan", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Görüntü dosyası bulunamadı ('file' alanı zorunlu)." });
  }

  const mode = req.body.mode || "gray";
  const wantOcr = req.body.ocr === "true" || req.body.ocr === true;
  const corners = parseCorners(req.body.corners);
  const rotation = parseRotation(req.body.rotation);
  const adjust = parseAdjust(req.body);

  try {
    const { jpegBuffer, width, height } = await processPage(req.file.buffer, {
      corners,
      rotation,
      mode,
      adjust,
    });

    const [pdfBuffer, text] = await Promise.all([
      buildPdfFromJpeg(jpegBuffer, { width, height }),
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

router.post("/scan/multi", upload.array("files", MAX_PAGES), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Görüntü dosyası bulunamadı ('files' alanı zorunlu)." });
  }

  const mode = req.body.mode || "gray";
  const wantOcr = req.body.ocr === "true" || req.body.ocr === true;

  const cornersList = parseJsonArray(req.body.corners);
  const rotationsList = parseJsonArray(req.body.rotations);
  const brightnessList = parseJsonArray(req.body.brightnesses);
  const contrastList = parseJsonArray(req.body.contrasts);

  try {
    const pages = [];
    for (let i = 0; i < req.files.length; i++) {
      const corners = parseCorners(JSON.stringify(cornersList[i] || null));
      const rotation = parseRotation(rotationsList[i]);
      const adjust = { brightness: clampAdjust(brightnessList[i]), contrast: clampAdjust(contrastList[i]) };
      pages.push(await processPage(req.files[i].buffer, { corners, rotation, mode, adjust }));
    }

    const pdfBuffer = await buildPdfFromJpegs(pages.map((p) => ({ buffer: p.jpegBuffer, width: p.width, height: p.height })));

    let text = null;
    if (wantOcr) {
      const texts = [];
      for (let i = 0; i < pages.length; i++) {
        texts.push(await extractText(pages[i].jpegBuffer));
      }
      text = texts.map((t, i) => `--- Sayfa ${i + 1} ---\n${t}`).join("\n\n");
    }

    res.json({
      mode,
      pageCount: pages.length,
      images: pages.map((p) => `data:image/jpeg;base64,${p.jpegBuffer.toString("base64")}`),
      pdf: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
      text,
    });
  } catch (err) {
    console.error("Çoklu sayfa tarama hatası:", err);
    res.status(500).json({ error: "Görüntüler işlenirken bir hata oluştu." });
  }
});

export default router;
