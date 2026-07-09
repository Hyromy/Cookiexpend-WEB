import * as React from "react"

export function Excel(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      fill="none"
      viewBox="0 0 192 192"
      {...props}
    >
      <path
        d="M56 30c0-1.662 1.338-3 3-3h108c1.662 0 3 1.338 3 3v132c0 1.662-1.338 3-3 3H59c-1.662 0-3-1.338-3-3v-32m0-68V30"
        style={{
          fillOpacity: 0.1,
          stroke: "currentColor",
          strokeWidth: 12,
          strokeLinecap: "round",
          paintOrder: "stroke fill markers",
        }}
      />
      <rect
        width={68}
        height={68}
        x={-58.1}
        y={40.3}
        rx={3}
        style={{
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 12,
          strokeLinecap: "round",
          strokeLinejoin: "miter",
          strokeDasharray: "none",
          strokeOpacity: 1,
          paintOrder: "stroke fill markers",
        }}
        transform="translate(80.1 21.7)"
      />
      <path
        d="M138.79 164.725V27.175M56.175 58.792H170M170 96H90.328M169 133.21H56.175M44.5 82l23 28m0-28-23 28"
        style={{
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 12,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
      />
    </svg>
  )
}