import { interpolateRgb } from "d3";
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
        colors={["#e63754", "#e64c85"]}
        cx={width / 2}
        cy={height / 2}
        angle={angle}
        radius={innerRadius + (strokeWidth + ringSpacing) * 2}
        strokeWidth={strokeWidth}
      />
      <AppleRing
        colors={["#e0fc52", "#b2fb4f"]}
        cx={width / 2}
        cy={height / 2}
        angle={angle}
        radius={innerRadius + strokeWidth + ringSpacing}
        strokeWidth={strokeWidth}
      />
      <AppleRing
        colors={["#75fbb0", "#60d6fa"]}
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
  colors,
  phase: initialPhase = -Math.PI / 2
}) => {
  const partitionStep = Math.PI;

  const ringAngle = Math.min(angle, Math.PI * 2);
  const rotationAngle = angle - ringAngle;
  const phase = initialPhase + rotationAngle;

  const partitionAngles = partitionOnce(ringAngle, partitionStep).reverse();
  const segments = cumulate(partitionAngles);
  const [segmentStart, segmentEnd] = segments;

  const colorInterp = interpolateRgb(...colors);

  const arcX = (angle) => Math.cos(angle + phase) * radius + cx;
  const arcY = (angle) => Math.sin(angle + phase) * radius + cy;

  const path = (segment) => `
    M ${arcX(segment.from)} ${arcY(segment.from)} 
    A 
      ${radius} ${radius} 
      0 ${segment.value > Math.PI ? 1 : 0} 1 
      ${arcX(segment.to)} ${arcY(segment.to)}`;

  const gradientEndId = useId();
  const gradientStartId = useId();
  const maskEndId = useId();
  const maskStartId = useId();
  const gradientShadowId = useId();

  const p1 = {
    x: Math.cos(ringAngle + phase) * 0.5 + 0.5,
    y: Math.sin(ringAngle + phase) * 0.5 + 0.5
  };

  const p2 = {
    x: Math.cos(ringAngle + phase - Math.PI) * 0.5 + 0.5,
    y: Math.sin(ringAngle + phase - Math.PI) * 0.5 + 0.5
  };

  const gradientSide = radius * 2 + strokeWidth;
  return (
    <g>
      <defs>
        <linearGradient
          id={gradientEndId}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
        >
          <stop offset="0%" stopColor={colorInterp(0)} />
          <stop offset="100%" stopColor={colorInterp(0.5)} />
        </linearGradient>

        <linearGradient
          id={gradientStartId}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
        >
          <stop offset="0%" stopColor={colorInterp(1)} />
          <stop offset="100%" stopColor={colorInterp(0.5)} />
        </linearGradient>

        <radialGradient id={gradientShadowId}>
          <stop offset="30%" stopColor="black" />
          <stop offset="100%" stopColor="black" stopOpacity={0} />
        </radialGradient>
      </defs>

      <mask id={maskEndId}>
        <path
          d={path(segmentStart)}
          strokeWidth={strokeWidth}
          stroke="white"
          fill="none"
          strokeLinecap="round"
        />
      </mask>

      <mask id={maskStartId}>
        <path
          d={path(segmentEnd)}
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
        fill={`url(#${gradientEndId})`}
        mask={`url(#${maskEndId})`}
      />

      <circle
        r={strokeWidth / 2 + 6}
        cx={arcX(segmentEnd.to)}
        cy={arcY(segmentEnd.to)}
        fill={`url(#${gradientShadowId})`}
        mask={`url(#${maskEndId})`}
      />

      <rect
        x={cx - gradientSide / 2}
        y={cy - gradientSide / 2}
        width={gradientSide}
        height={gradientSide}
        fill={`url(#${gradientStartId})`}
        mask={`url(#${maskStartId})`}
      />
    </g>
  );
};
