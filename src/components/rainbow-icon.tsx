import * as React from 'react';

export function RainbowIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 30 20"
      {...props}
    >
      <path fill="#FF0000" d="M0 0h30v3.33h-30z" />
      <path fill="#FF7F00" d="M0 3.33h30v3.33h-30z" />
      <path fill="#FFFF00" d="M0 6.66h30v3.33h-30z" />
      <path fill="#00FF00" d="M0 9.99h30v3.33h-30z" />
      <path fill="#0000FF" d="M0 13.32h30v3.33h-30z" />
      <path fill="#8B00FF" d="M0 16.65h30v3.33h-30z" />
    </svg>
  );
}
