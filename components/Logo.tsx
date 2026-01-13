export function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three ascending bars forming the ROI icon */}
      <g>
        <path d="M0 40 L0 22 L10 12 L10 40 Z" fill="#FF6400" />
        <path d="M14 40 L14 14 L24 4 L24 40 Z" fill="#FF6400" />
        <path d="M28 40 L28 26 L38 16 L38 40 Z" fill="#FF6400" />
      </g>
      {/* Text part */}
      <text
        x="50"
        y="22"
        fill="currentColor"
        fontFamily="Archivo SemiExpanded, sans-serif"
        fontWeight="900"
        fontSize="16"
      >
        ROI
      </text>
      <text
        x="50"
        y="40"
        fill="currentColor"
        fontFamily="Archivo SemiExpanded, sans-serif"
        fontWeight="900"
        fontSize="16"
      >
        WORKS
      </text>
    </svg>
  );
}
