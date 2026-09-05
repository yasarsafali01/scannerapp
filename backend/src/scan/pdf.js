import { PDFDocument } from "pdf-lib";

export async function buildPdfFromJpegs(pages) {
  const pdfDoc = await PDFDocument.create();

  for (const { buffer, width, height } of pages) {
    const image = await pdfDoc.embedJpg(buffer);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }

  return Buffer.from(await pdfDoc.save());
}

export async function buildPdfFromJpeg(jpegBuffer, { width, height }) {
  return buildPdfFromJpegs([{ buffer: jpegBuffer, width, height }]);
}
