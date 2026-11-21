import type { ReactNode } from "react";

/** Theme objects drawn in the four corners of a themed pitch. They sit below the player layer,
    inside the outer touchline margin, so faces, names and slot buttons always stay on top. */
const SCENERY: Record<string, { top: ReactNode; bottom: ReactNode }> = {
  myth: {
    top: <>
      <path d="M6 10h28l-3 6H9Z" fill="#e9dcb4" stroke="#9c7f3d"/>
      <path d="M8 5h24v5H8Z" fill="#d8c48d" stroke="#9c7f3d"/>
      <path d="M11 16h18v60H11Z" fill="#f3ecd6" stroke="#a88b48"/>
      <path d="M15 18v56m5-56v56m5-56v56" stroke="#c7b07a"/>
      <path d="M7 76h26v4H7Z" fill="#d8c48d" stroke="#9c7f3d"/>
    </>,
    bottom: <>
      <path d="M5 66h30v8H5Z" fill="#d8c48d" stroke="#9c7f3d"/>
      <path d="M11 22h18v44H11Z" fill="#f3ecd6" stroke="#a88b48"/>
      <path d="M15 24v40m5-40v40m5-40v40" stroke="#c7b07a"/>
      <path d="M10 22 13 12h14l3 10Z" fill="#e9dcb4" stroke="#9c7f3d"/>
      <path d="M20 4c-6 4-8 8-6 8 3 0 4-4 6-8Zm0 0c6 4 8 8 6 8-3 0-4-4-6-8Z" fill="#d9b44a"/>
    </>,
  },
  engineering: {
    top: <>
      <g className="scenery-spin" style={{ transformOrigin: "18px 22px" }}>
        <circle cx="18" cy="22" r="11" fill="#123642" stroke="#6ff3e2" strokeWidth="1.5"/>
        <path d="M18 7v6m0 18v6M3 22h6m18 0h6M7.4 11.4l4.2 4.2m12.8 12.8 4.2 4.2m0-21.2-4.2 4.2M11.6 28.4l-4.2 4.2" stroke="#6ff3e2" strokeWidth="3"/>
        <circle cx="18" cy="22" r="4" fill="#6ff3e2"/>
      </g>
      <path d="M30 40h6v38h-6zM24 48h18" stroke="#3fb8b0" strokeWidth="2" fill="#0b2a33"/>
      <circle cx="33" cy="60" r="2" fill="#ffe36b"/>
    </>,
    bottom: <>
      <path d="M4 78V50h12l6-8h14v36Z" fill="#0f2f3a" stroke="#4fd8cc" strokeWidth="1.5"/>
      <path d="M8 56h8m-8 6h8m-8 6h8M24 50h8v20h-8Z" stroke="#4fd8cc"/>
      <circle cx="28" cy="56" r="1.8" className="scenery-blink" fill="#ffe36b"/>
      <circle cx="28" cy="63" r="1.8" fill="#6ff3e2"/>
    </>,
  },
  christmas: {
    top: <>
      <path d="M20 6 31 24h-5l9 15h-6l10 17H1l10-17H5l9-15H9Z" fill="#1d6b4c" stroke="#e9f5ec" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M20 1l1.6 3.4L25 5l-3 2 1 4-3-2-3 2 1-4-3-2 3.4-.6Z" className="scenery-blink" fill="#ffd95a"/>
      <circle cx="16" cy="28" r="1.8" fill="#e9483f"/><circle cx="25" cy="38" r="1.8" fill="#ffd95a"/><circle cx="13" cy="48" r="1.8" fill="#ffd95a"/><circle cx="28" cy="51" r="1.8" fill="#e9483f"/>
      <path d="M17 56h6v8h-6Z" fill="#6b4226"/>
    </>,
    bottom: <>
      <path d="M2 72q18-10 36 0v8H2Z" fill="#f4f7f2"/>
      <path d="M6 54h16v16H6Z" fill="#c63c37" stroke="#fff" strokeWidth="1"/>
      <path d="M14 54v16M6 62h16" stroke="#ffd95a" strokeWidth="2"/>
      <path d="M24 60h12v11H24Z" fill="#2f7a59" stroke="#fff"/>
      <path d="M30 60v11" stroke="#fff" strokeWidth="2"/>
      <path d="M10 54q4-6 4 0 0-6 4 0" stroke="#ffd95a" strokeWidth="1.5"/>
    </>,
  },
  volcano: {
    top: <>
      <path d="M0 4h40L33 18l5 12-11 6 3 14-14-8-6 12L0 44Z" fill="#231b1d" stroke="#4a3330"/>
      <path d="M10 8l6 10-4 8 9 6m6-24-3 9 7 6" stroke="#ff7a35" strokeWidth="1.6" className="scenery-glow"/>
    </>,
    bottom: <>
      <path d="M2 80 8 52l8 6 6-22 8 14 5-6 4 36Z" fill="#2a2023" stroke="#4a3330"/>
      <path d="M22 36l-2 14 6 8-3 12m-11-18 2 12" stroke="#ff7a35" strokeWidth="1.6" className="scenery-glow"/>
      <circle cx="30" cy="28" r="1.6" fill="#ffb35a" className="scenery-ember"/>
      <circle cx="14" cy="40" r="1.3" fill="#ff7a35" className="scenery-ember"/>
    </>,
  },
  cosmos: {
    top: <>
      <circle cx="18" cy="22" r="11" fill="#7b5cc7"/>
      <path d="M11 14a11 11 0 0 1 15 2" stroke="#d9ccff" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="18" cy="22" rx="19" ry="5" transform="rotate(-18 18 22)" stroke="#c9d6ff" strokeWidth="1.6"/>
      <path d="M33 46l1.2 2.8L37 50l-2.8 1.2L33 54l-1.2-2.8L29 50l2.8-1.2Z" className="scenery-blink" fill="#fff"/>
    </>,
    bottom: <>
      <path d="M24 46a14 14 0 1 0 8 25 11 11 0 1 1-8-25Z" fill="#e9e3ff"/>
      <path d="M8 60l1 2.4 2.4 1-2.4 1L8 67l-1-2.6-2.4-1L7 62.4Z" className="scenery-blink" fill="#b6f2ff"/>
      <path d="M4 30l16 9" stroke="#b6f2ff" strokeWidth="1.4" strokeLinecap="round" opacity=".6"/>
      <circle cx="21" cy="40" r="2" fill="#fff"/>
    </>,
  },
};

export function PitchScenery({ theme }: { theme: string }) {
  const art = SCENERY[theme];
  if (!art) return null;
  return (
    <span className={`pitch-scenery scenery-${theme}`} aria-hidden="true">
      {(["tl", "tr", "bl", "br"] as const).map(corner => (
        <svg key={corner} className={`scenery-${corner}`} viewBox="0 0 40 80" fill="none" focusable="false">
          {corner[0] === "t" ? art.top : art.bottom}
        </svg>
      ))}
    </span>
  );
}
