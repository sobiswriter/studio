import type { SVGProps } from 'react';

export function PixelTaskIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="square"
      strokeLinejoin="arcs"
      shapeRendering="crispEdges" // Ensures pixelated rendering
      {...props}
    >
      <path d="M2 2H14V14H2V2Z" fill="currentColor" opacity="0.2" />
      <path d="M2 2V3H3V2H2Z M3 3V4H4V3H3Z M4 4V5H5V4H4Z" fill="currentColor" />
      <path d="M2 13V14H3V13H2Z M3 12V13H4V12H3Z M4 11V12H5V11H4Z" fill="currentColor" />
      <path d="M13 2V3H12V2H13Z M12 3V4H11V3H12Z M11 4V5H10V4H11Z" fill="currentColor" />
      <path d="M13 13V14H12V13H13Z M12 12V13H11V12H12Z M11 11V12H10V11H11Z" fill="currentColor" />
      <path d="M5 5H11V6H5V5Z" fill="currentColor" />
      <path d="M5 8H11V9H5V8Z" fill="currentColor" />
      <path d="M5 11H8V12H5V11Z" fill="currentColor" />
    </svg>
  );
}
