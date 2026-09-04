import sharp from "sharp";

const MODES = new Set(["color", "gray", "bw"]);

/**
 * Applies the "scanned document" look to a raw RGBA buffer and encodes it as JPEG.
 * mode: "color" (light cleanup), "gray" (grayscale + contrast), "bw" (high-contrast black & white)
 */
export async function applyScanFilter({ data, width, height }, mode = "gray") {
  const chosenMode = MODES.has(mode) ? mode : "gray";

  let pipeline = sharp(Buffer.from(data), {
    raw: { width, height, channels: 4 },
  });

  if (chosenMode === "color") {
    pipeline = pipeline.normalize().modulate({ saturation: 1.1 }).sharpen();
  } else if (chosenMode === "gray") {
    pipeline = pipeline.grayscale().normalize().linear(1.15, -10).sharpen();
  } else {
    pipeline = pipeline.grayscale().normalize().threshold(150);
  }

  return pipeline.jpeg({ quality: 92 }).toBuffer();
}
