import { useRef } from "react";

export default function CornerEditor({ imageUrl, naturalWidth, naturalHeight, corners, onChange }) {
  const svgRef = useRef(null);

  function toSvgPoint(evt) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function makeDragHandler(index) {
    return (evt) => {
      evt.target.setPointerCapture(evt.pointerId);

      const onMove = (moveEvt) => {
        const p = toSvgPoint(moveEvt);
        const next = corners.slice();
        next[index] = {
          x: Math.max(0, Math.min(naturalWidth, p.x)),
          y: Math.max(0, Math.min(naturalHeight, p.y)),
        };
        onChange(next);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };
  }

  const pointsAttr = corners.map((c) => `${c.x},${c.y}`).join(" ");
  const handleRadius = Math.max(naturalWidth, naturalHeight) * 0.014;

  return (
    <div className="corner-editor" style={{ aspectRatio: `${naturalWidth} / ${naturalHeight}` }}>
      <img src={imageUrl} alt="" className="corner-editor-img" draggable={false} />
      <svg
        ref={svgRef}
        className="corner-editor-svg"
        viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
        preserveAspectRatio="none"
      >
        <polygon points={pointsAttr} className="corner-poly" />
        {corners.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={handleRadius}
            className="corner-handle"
            onPointerDown={makeDragHandler(i)}
          />
        ))}
      </svg>
    </div>
  );
}
