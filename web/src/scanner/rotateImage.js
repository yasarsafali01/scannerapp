export async function rotateImageFile(file, degrees) {
  const bitmap = await createImageBitmap(file);
  const swap = Math.abs(degrees % 180) === 90;
  const width = swap ? bitmap.height : bitmap.width;
  const height = swap ? bitmap.width : bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.translate(width / 2, height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  const rotatedFile = new File([blob], file.name || "photo.jpg", { type: "image/jpeg" });
  return { file: rotatedFile, width, height };
}
