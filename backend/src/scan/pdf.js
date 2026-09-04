import { PDFDocument } from "pdf-lib";

export async function buildPdfFromJpeg(jpegBuffer, { width, height }) {
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedJpg(jpegBuffer);

  const page = pdfDoc.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });

  return Buffer.from(await pdfDoc.save());
}
