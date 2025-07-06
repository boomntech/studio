import * as React from 'react';

export function BoomnLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Wings */}
        <path d="M37,25 l11,-6 v12 l-11,6 Z" />
        <path d="M27,25 l-11,-6 v12 l11,6 Z" />

        {/* Wing details */}
        <path d="M38,27 l8,-4" fill="none" stroke="hsl(var(--card))" />
        <circle cx="47" cy="22.5" r="1.5" stroke="none" fill="hsl(var(--card))" />
        <circle cx="47" cy="22.5" r="0.75" stroke="none" fill="currentColor" />

        <path d="M26,27 l-8,-4" fill="none" stroke="hsl(var(--card))" />
        <circle cx="17" cy="22.5" r="1.5" stroke="none" fill="hsl(var(--card))" />
        <circle cx="17" cy="22.5" r="0.75" stroke="none" fill="currentColor" />
        
        {/* Body */}
        <path stroke="none" d="M32,24 l-6,3 v10 l6,3 l6,-3 V27 l-6,-3 Z" />
        <path stroke="none" d="M32,40 l-5,2 v6 l5,2 l5,-2 v-6 l-5,-2 Z" />
        <path stroke="none" d="M32,50 l-4,1.5 v3 l4,2 l4,-2 v-3 l-4,-1.5 Z" />
        <path d="M27,45 h10" fill="none" stroke="hsl(var(--card))" strokeWidth="2.5" />

        {/* Head */}
        <path stroke="none" d="M32,14.5 l-4.5,3.5 v5 l4.5,3.5 l4.5,-3.5 v-5 l-4.5,-3.5 Z" />

        {/* Antennae */}
        <path d="M27.5,18 l-4,-4" fill="none" />
        <circle cx="22.5" cy="13" r="2.5" stroke="none" />
        <path d="M36.5,18 l4,-4" fill="none" />
        <circle cx="41.5" cy="13" r="2.5" stroke="none" />
      </g>
    </svg>
  );
}
