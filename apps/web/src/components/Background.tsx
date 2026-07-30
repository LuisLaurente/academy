import React from 'react';

export function Background() {
  return (
    <div className="bg-background bg-grid-pattern absolute inset-0 -z-10 transition-colors duration-300">
      {/* Monochromatic styled vector landscape at the bottom */}
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-64 overflow-hidden opacity-80 select-none dark:opacity-30">
        <svg
          className="absolute bottom-0 h-full w-full min-w-[1200px]"
          viewBox="0 0 1440 256"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Far Mountains */}
          <path
            d="M0 180 L200 100 L450 200 L700 80 L950 180 L1200 90 L1440 210 V256 H0 Z"
            fill="var(--sage-pale)"
            opacity="0.25"
          />

          {/* Mid Mountains & Hills */}
          <path
            d="M0 210 L150 150 L400 230 L650 140 L900 210 L1150 130 L1440 220 V256 H0 Z"
            fill="var(--sage-pale)"
            opacity="0.5"
          />

          {/* Foreground Hills */}
          <path
            d="M0 235 Q300 200 600 240 T1200 220 T1440 240 V256 H0 Z"
            fill="var(--sage-pale)"
            opacity="0.8"
          />

          {/* Pine Trees Silhouettes - Left Group */}
          <g fill="var(--sage-pale)" opacity="0.9" transform="translate(80, 180) scale(0.6)">
            {/* Tree 1 */}
            <polygon points="50,0 20,60 80,60" />
            <polygon points="50,20 10,90 90,90" />
            <polygon points="50,45 0,130 100,130" />
            <rect x="45" y="130" width="10" height="30" />
          </g>
          <g fill="var(--sage-pale)" opacity="0.9" transform="translate(130, 195) scale(0.5)">
            {/* Tree 2 */}
            <polygon points="50,0 20,60 80,60" />
            <polygon points="50,20 10,90 90,90" />
            <polygon points="50,45 0,130 100,130" />
            <rect x="45" y="130" width="10" height="30" />
          </g>

          {/* Pine Trees Silhouettes - Right Group */}
          <g fill="var(--sage-pale)" opacity="0.9" transform="translate(1250, 175) scale(0.7)">
            {/* Tree 3 */}
            <polygon points="50,0 20,60 80,60" />
            <polygon points="50,20 10,90 90,90" />
            <polygon points="50,45 0,130 100,130" />
            <rect x="45" y="130" width="10" height="30" />
          </g>
          <g fill="var(--sage-pale)" opacity="0.9" transform="translate(1310, 190) scale(0.55)">
            {/* Tree 4 */}
            <polygon points="50,0 20,60 80,60" />
            <polygon points="50,20 10,90 90,90" />
            <polygon points="50,45 0,130 100,130" />
            <rect x="45" y="130" width="10" height="30" />
          </g>
        </svg>
      </div>
    </div>
  );
}
