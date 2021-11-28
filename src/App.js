import { range } from "d3";
import { useRef, useState } from "react";
import "./styles.css";

function useId() {
  return useRef(Math.random().toString(16).split(".")[1]).current;
}

function partitionOnce(total, part) {
  if (total >= part) return [part, total - part];
  else return [total, 0];
}

/**
 * Return an array with cumulative information:
 * - value: the original value
 * - from: the previuos cumulative value
 * - to: the current cumulative value
 *
 * @param {number[]} values Values to cumulate
 */
function cumulate(values) {
  let from = 0;
  return values.map((value) => ({ value, from, to: (from += value) }));
}

export default function App() {
  const [progress, setProgress] = useState(0.5);
  return (
    <div className="App">
      <div>
        <input
          type="range"
          value={progress}
          min={0}
          max={2}
          step={0.001}
          onChange={(e) => setProgress(+e.target.value)}
        />
      </div>
      <SVG progress={progress} />
    </div>
  );
}

const SVG = ({ progress }) => {
  const width = 400;
  const height = 400;

  const angle = progress * Math.PI * 2;
  const innerRadius = 70;
  const ringSpacing = 2;
  const strokeWidth = 30;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "hidden" }}
    >
      <rect width="100%" height="100%" fill="black" />

      <AppleRing
        color="#df355a"
        cx={width / 2}
        cy={height / 2}
        angle={angle}
        radius={innerRadius + (strokeWidth + ringSpacing) * 2}
        strokeWidth={strokeWidth}
      />
      <AppleRing
        color="#c1fb50"
        cx={width / 2}
        cy={height / 2}
        angle={angle}
        radius={innerRadius + strokeWidth + ringSpacing}
        strokeWidth={strokeWidth}
      />
      <AppleRing
        color="#72f9f5"
        cx={width / 2}
        cy={height / 2}
        angle={angle}
        radius={innerRadius}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

const AppleRing = ({
  angle,
  radius,
  strokeWidth,
  cx = 0,
  cy = 0,
  color,
  phase: initialPhase = -Math.PI / 2
}) => {
  const partitionStep = Math.PI * 2 * 0.875;

  const ringAngle = Math.min(angle, Math.PI * 2);
  const rotationAngle = angle - ringAngle;
  const phase = initialPhase + rotationAngle;

  const partitionAngles = partitionOnce(ringAngle, partitionStep).reverse();
  const segments = cumulate(partitionAngles);
  const [gradientSegment, solidSegment] = segments;

  const arcX = (angle) => Math.cos(angle + phase) * radius + cx;
  const arcY = (angle) => Math.sin(angle + phase) * radius + cy;

  const path = (segment) => `
    M ${arcX(segment.from)} ${arcY(segment.from)} 
    A 
      ${radius} ${radius} 
      0 ${segment.value > Math.PI ? 1 : 0} 1 
      ${arcX(segment.to)} ${arcY(segment.to)}`;

  const gradientId = useId();
  const maskId = useId();

  const p1 = {
    x: Math.cos(ringAngle + phase) * 0.5 + 0.5,
    y: Math.sin(ringAngle + phase) * 0.5 + 0.5
  };

  const p2 = {
    x: Math.cos(ringAngle + phase - partitionStep) * 0.5 + 0.5,
    y: Math.sin(ringAngle + phase - partitionStep) * 0.5 + 0.5
  };

  const gradientSide = radius * 2 + strokeWidth;
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}>
          <stop offset="0%" stopColor="black" />
          <stop offset="60%" stopColor={color} />
        </linearGradient>
      </defs>

      <mask id={maskId}>
        <path
          d={path(gradientSegment)}
          strokeWidth={strokeWidth}
          stroke="white"
          fill="none"
          strokeLinecap="round"
        />
      </mask>

      <rect
        x={cx - gradientSide / 2}
        y={cy - gradientSide / 2}
        width={gradientSide}
        height={gradientSide}
        fill={`url(#${gradientId})`}
        mask={`url(#${maskId})`}
      />

      <path
        d={path(solidSegment)}
        strokeWidth={strokeWidth}
        stroke={color}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
};
