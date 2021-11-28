import { range, scaleLinear } from "d3";
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
 * @param {string[]} colors
 */
function interpolateColor(colors) {
  const length = colors.length;
  const domain = range(length).map((i) => i / (length - 1));
  return scaleLinear().domain(domain).range(colors);
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

/**
 * Computes properties x1, y1, x2 and y2 of linearGradient
 * to render a linear gradient with `angle`
 *
 * @param {number} angle
 */
function computeGradientRotation(angle) {
  return {
    x1: Math.cos(angle) * 0.5 + 0.5,
    y1: Math.sin(angle) * 0.5 + 0.5,
    x2: Math.cos(angle - Math.PI) * 0.5 + 0.5,
    y2: Math.sin(angle - Math.PI) * 0.5 + 0.5
  };
}

export default function App() {
  const [progress, setProgress] = useState(1.05);
  return (
    <div className="App">
      <AppleWatch progress={progress} />
      <div className="layer" style={{ alignItems: "start", padding: 30 }}>
        <input
          type="range"
          value={progress}
          min={0}
          max={2}
          step={0.001}
          onChange={(e) => setProgress(+e.target.value)}
        />
      </div>
    </div>
  );
}

const AppleWatch = ({ progress }) => {
  const width = 400;
  const height = 400;

  const angle = progress * Math.PI * 2;
  const innerRadius = 70;
  const ringSpacing = 2;
  const strokeWidth = 35;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div class="layer">
        <img
          alt="watch"
          src="https://mockuphone.com/static/images/devices/apple-applewatch44mm-darktitanium-cyprusgreensololoop-portrait.png"
          style={{
            width: width + 450,
            height: height + 450,
            objectFit: "scale-down"
          }}
        />
      </div>
      <div className="layer">
        <div style={{ width, height }}>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ overflow: "hidden" }}
          >
            <AppleRing
              colors={["#e63754", "#e64c85"]}
              cx={width / 2}
              cy={height / 2}
              angle={angle}
              radius={innerRadius + (strokeWidth + ringSpacing) * 2}
              strokeWidth={strokeWidth}
            />
            <AppleRing
              colors={["#b2fb4f", "#e0fc52"]}
              cx={width / 2}
              cy={height / 2}
              angle={angle * 0.8}
              radius={innerRadius + strokeWidth + ringSpacing}
              strokeWidth={strokeWidth}
            />
            <AppleRing
              colors={["#60d6fa", "#75fbb0"]}
              cx={width / 2}
              cy={height / 2}
              angle={angle * 0.9}
              radius={innerRadius}
              strokeWidth={strokeWidth}
            />
          </svg>
        </div>
      </div>
    </div>
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

  const singleLapAngle = Math.min(angle, Math.PI * 2);
  const ringRotationAngle = angle - singleLapAngle;
  const phase = initialPhase + ringRotationAngle;

  const partitionAngles = partitionOnce(singleLapAngle, partitionStep);
  const [segmentStart, segmentEnd] = cumulate(partitionAngles);

  const colorInterp = interpolateColor(colors.slice(0, 3));

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

  const gradientAngle = Math.max(0, angle - Math.PI * 2) + initialPhase;
  const gradientRotation = computeGradientRotation(gradientAngle);
  const gradientSide = radius * 2 + strokeWidth;
  return (
    <g>
      <defs>
        <linearGradient id={gradientStartId} {...gradientRotation}>
          <stop offset="15%" stopColor={colorInterp(0)} />
          <stop offset="85%" stopColor={colorInterp(0.5)} />
        </linearGradient>

        <linearGradient id={gradientEndId} {...gradientRotation}>
          <stop offset="15%" stopColor={colorInterp(1)} />
          <stop offset="85%" stopColor={colorInterp(0.5)} />
        </linearGradient>

        <radialGradient id={gradientShadowId}>
          <stop offset="40%" stopColor="black" />
          <stop offset="100%" stopColor="black" stopOpacity={0} />
        </radialGradient>
      </defs>

      <mask id={maskStartId}>
        <path
          d={path(segmentStart)}
          strokeWidth={strokeWidth}
          stroke="white"
          fill="none"
          strokeLinecap="round"
        />
      </mask>

      <mask id={maskEndId}>
        <path
          d={path(segmentEnd)}
          strokeWidth={strokeWidth}
          stroke="white"
          fill="none"
          strokeLinecap="round"
        />
      </mask>

      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={colorInterp(0.5)}
        opacity={0.25}
        strokeWidth={strokeWidth}
      />

      <rect
        x={cx - gradientSide / 2}
        y={cy - gradientSide / 2}
        width={gradientSide}
        height={gradientSide}
        fill={`url(#${gradientStartId})`}
        mask={`url(#${maskStartId})`}
      />

      <circle
        r={strokeWidth / 2 + 6}
        cx={arcX(segmentEnd.to)}
        cy={arcY(segmentEnd.to)}
        fill={`url(#${gradientShadowId})`}
        mask={`url(#${maskStartId})`}
        opacity={angle > Math.PI * 1.5 ? 1 : 0}
      />

      {angle >= Math.PI && (
        <rect
          x={cx - gradientSide / 2}
          y={cy - gradientSide / 2}
          width={gradientSide}
          height={gradientSide}
          fill={`url(#${gradientEndId})`}
          mask={`url(#${maskEndId})`}
        />
      )}
    </g>
  );
};
