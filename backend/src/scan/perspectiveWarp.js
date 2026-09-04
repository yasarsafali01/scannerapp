function orderCorners(points) {
  const sums = points.map((p) => p.x + p.y);
  const diffs = points.map((p) => p.x - p.y);
  const topLeft = points[sums.indexOf(Math.min(...sums))];
  const bottomRight = points[sums.indexOf(Math.max(...sums))];
  const topRight = points[diffs.indexOf(Math.max(...diffs))];
  const bottomLeft = points[diffs.indexOf(Math.min(...diffs))];
  return [topLeft, topRight, bottomRight, bottomLeft];
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Solves the 8x8 linear system for the homography that maps dstPts[i] -> srcPts[i].
// This is the same closed-form 4-point solve OpenCV's getPerspectiveTransform uses.
function solveHomography(srcPts, dstPts) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = dstPts[i];
    const { x: X, y: Y } = srcPts[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }

  const n = 8;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const pivotVal = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= pivotVal;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }
  return M.map((row) => row[n]); // [a, b, c, d, e, f, g, h]
}

function sampleBilinear(data, width, height, x, y) {
  if (x < -0.5 || y < -0.5 || x > width - 0.5 || y > height - 0.5) return null;
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const dx = x - x0;
  const dy = y - y0;
  const idx = (xx, yy) => (yy * width + xx) * 4;

  const out = new Array(4);
  for (let c = 0; c < 4; c++) {
    const p00 = data[idx(x0, y0) + c];
    const p10 = data[idx(x1, y0) + c];
    const p01 = data[idx(x0, y1) + c];
    const p11 = data[idx(x1, y1) + c];
    const top = p00 * (1 - dx) + p10 * dx;
    const bottom = p01 * (1 - dx) + p11 * dx;
    out[c] = top * (1 - dy) + bottom * dy;
  }
  return out;
}

/**
 * Warps the quadrilateral defined by `corners` (4 {x,y} points in the source
 * image's pixel space, any order) into an upright rectangle, as if the
 * document had been scanned flat. Returns a new RGBA buffer.
 */
export function warpToRectangle({ data, width, height }, rawCorners) {
  const [tl, tr, br, bl] = orderCorners(rawCorners);

  const widthTop = distance(tl, tr);
  const widthBottom = distance(bl, br);
  const heightLeft = distance(tl, bl);
  const heightRight = distance(tr, br);

  const outWidth = Math.max(1, Math.round(Math.max(widthTop, widthBottom)));
  const outHeight = Math.max(1, Math.round(Math.max(heightLeft, heightRight)));

  const srcPts = [tl, tr, br, bl];
  const dstPts = [
    { x: 0, y: 0 },
    { x: outWidth - 1, y: 0 },
    { x: outWidth - 1, y: outHeight - 1 },
    { x: 0, y: outHeight - 1 },
  ];

  const h = solveHomography(srcPts, dstPts);
  const out = new Uint8ClampedArray(outWidth * outHeight * 4);

  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      const denom = h[6] * x + h[7] * y + 1;
      const srcX = (h[0] * x + h[1] * y + h[2]) / denom;
      const srcY = (h[3] * x + h[4] * y + h[5]) / denom;

      const pixel = sampleBilinear(data, width, height, srcX, srcY);
      const destIdx = (y * outWidth + x) * 4;
      if (pixel) {
        out[destIdx] = pixel[0];
        out[destIdx + 1] = pixel[1];
        out[destIdx + 2] = pixel[2];
        out[destIdx + 3] = pixel[3];
      } else {
        out[destIdx] = 255;
        out[destIdx + 1] = 255;
        out[destIdx + 2] = 255;
        out[destIdx + 3] = 255;
      }
    }
  }

  return { data: out, width: outWidth, height: outHeight };
}
