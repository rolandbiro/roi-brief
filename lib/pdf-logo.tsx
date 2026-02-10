import { Svg, Path } from "@react-pdf/renderer";

export function PdfLogo({ width = 120 }: { width?: number }) {
  const aspectRatio = 40 / 38;
  const height = width * aspectRatio;

  return (
    <Svg width={width} height={height} viewBox="0 0 38 40">
      <Path d="M0 40 L0 22 L10 12 L10 40 Z" fill="#FF6400" />
      <Path d="M14 40 L14 14 L24 4 L24 40 Z" fill="#FF6400" />
      <Path d="M28 40 L28 26 L38 16 L38 40 Z" fill="#FF6400" />
    </Svg>
  );
}
