// Set ikon custom KANASA: sudut membulat, garis 1.9, lapisan isi lembut (duotone) dengan opasitas rendah.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}
const soft = { fill: "currentColor", stroke: "none", opacity: 0.16 } as const;

export const IconOffice = (p: P) => (
  <Svg {...p}>
    <path d="M4 20V9.5a2 2 0 0 1 .9-1.7l6-3.9a2 2 0 0 1 2.2 0l6 3.9a2 2 0 0 1 .9 1.7V20" {...soft} />
    <path d="M4 20V9.5a2 2 0 0 1 .9-1.7l6-3.9a2 2 0 0 1 2.2 0l6 3.9a2 2 0 0 1 .9 1.7V20" />
    <path d="M3 20h18" /><rect x="9.5" y="14" width="5" height="6" rx="1.2" /><path d="M8 10.5h.01M16 10.5h.01" strokeWidth={2.6} />
  </Svg>
);
export const IconDashboard = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" {...soft} />
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><path d="M8 15.5v-3M12 15.5V8.5M16 15.5v-5" />
  </Svg>
);
export const IconCeo = (p: P) => (
  <Svg {...p}>
    <path d="M5 9.5 7.5 12 12 6l4.5 6L19 9.5 18 17H6z" {...soft} />
    <path d="M5 9.5 7.5 12 12 6l4.5 6L19 9.5 18 17H6z" /><path d="M6.5 20h11" />
  </Svg>
);
export const IconTeam = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.3" {...soft} /><circle cx="9" cy="8.5" r="3.3" />
    <path d="M3.5 19.5c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.6 14.9c1.5.6 2.6 2.1 2.9 4.6" />
  </Svg>
);
export const IconDepartments = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="7" height="7" rx="2" {...soft} /><rect x="3.5" y="4" width="7" height="7" rx="2" />
    <rect x="13.5" y="4" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" {...soft} /><rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </Svg>
);
export const IconTasks = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="4.5" width="14" height="16" rx="3" {...soft} /><rect x="5" y="4.5" width="14" height="16" rx="3" />
    <path d="M9 3.5h6v2.5H9z" /><path d="m8.8 13 2.2 2.2 4.4-4.6" />
  </Svg>
);
export const IconIntel = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" {...soft} /><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" />
    <path d="M12 12 17.5 6.5" /><path d="M12 4v1.5M20 12h-1.5" />
  </Svg>
);
export const IconCreative = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 1.9-1 1.4-2.1-.6-1.3.2-2.6 1.6-2.6H17a3.5 3.5 0 0 0 3.5-3.5c0-4.9-3.8-8.8-8.5-8.8Z" {...soft} />
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 1.9-1 1.4-2.1-.6-1.3.2-2.6 1.6-2.6H17a3.5 3.5 0 0 0 3.5-3.5c0-4.9-3.8-8.8-8.5-8.8Z" />
    <path d="M8 11h.01M11 7.5h.01M15.5 8.5h.01" strokeWidth={2.8} />
  </Svg>
);
export const IconFinance = (p: P) => (
  <Svg {...p}>
    <ellipse cx="12" cy="7" rx="7" ry="3" {...soft} /><ellipse cx="12" cy="7" rx="7" ry="3" />
    <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" /><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
  </Svg>
);
export const IconMemory = (p: P) => (
  <Svg {...p}>
    <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" {...soft} />
    <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" /><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v3H7.5" /><path d="M9.5 8h5M9.5 11.5h3" />
  </Svg>
);
export const IconBell = (p: P) => (
  <Svg {...p}>
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z" {...soft} /><path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Svg>
);
export const IconKey = (p: P) => (
  <Svg {...p}>
    <circle cx="8.5" cy="12" r="4.5" {...soft} /><circle cx="8.5" cy="12" r="4.5" /><circle cx="8.5" cy="12" r="1.3" />
    <path d="M13 12h8M18 12v3M21 12v2" />
  </Svg>
);
export const IconSettings = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 14 5l2.5-.3.9 2.3 2.1 1.4-.6 2.4.6 2.4-2.1 1.4-.9 2.3L14 19l-2 1.5L10 19l-2.5.3-.9-2.3-2.1-1.4.6-2.4-.6-2.4 2.1-1.4.9-2.3L10 5z" {...soft} />
    <path d="M12 3.5 14 5l2.5-.3.9 2.3 2.1 1.4-.6 2.4.6 2.4-2.1 1.4-.9 2.3L14 19l-2 1.5L10 19l-2.5.3-.9-2.3-2.1-1.4.6-2.4-.6-2.4 2.1-1.4.9-2.3L10 5z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const IconMusic = (p: P) => (
  <Svg {...p}>
    <circle cx="7" cy="17.5" r="2.7" {...soft} /><circle cx="17" cy="15.5" r="2.7" {...soft} />
    <circle cx="7" cy="17.5" r="2.7" /><circle cx="17" cy="15.5" r="2.7" /><path d="M9.7 17.5V6.2L19.7 4v11.5M9.7 9.5l10-2.2" />
  </Svg>
);
export const IconMore = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="2.2" {...soft} /><rect x="4" y="4" width="6.5" height="6.5" rx="2.2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="2.2" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="2.2" /><circle cx="16.75" cy="16.75" r="3.4" />
  </Svg>
);
export const IconSun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.2" {...soft} /><circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.8v1.8M12 19.4v1.8M2.8 12h1.8M19.4 12h1.8M5.5 5.5l1.3 1.3M17.2 17.2l1.3 1.3M5.5 18.5l1.3-1.3M17.2 6.8l1.3-1.3" />
  </Svg>
);
export const IconMoon = (p: P) => (
  <Svg {...p}>
    <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" {...soft} /><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />
    <path d="M16.5 4.5v2M15.5 5.5h2" />
  </Svg>
);
export const IconSound = ({ muted, ...p }: P & { muted?: boolean }) => (
  <Svg {...p}>
    <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" {...soft} /><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
    {muted ? <path d="m16 9.5 5 5M21 9.5l-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18.2 6.5a7.5 7.5 0 0 1 0 11" />}
  </Svg>
);
export const IconPlus = (p: P) => (<Svg {...p}><path d="M12 5v14M5 12h14" strokeWidth={2.4} /></Svg>);
export const IconChat = (p: P) => (
  <Svg {...p}>
    <path d="M5 5.5h14a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-7l-4.5 3.5V17H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z" {...soft} />
    <path d="M5 5.5h14a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-7l-4.5 3.5V17H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z" />
    <path d="M8 11.3h.01M12 11.3h.01M16 11.3h.01" strokeWidth={2.8} />
  </Svg>
);
export const IconCoffee = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 9h11v5.5a4.5 4.5 0 0 1-4.5 4.5H9a4.5 4.5 0 0 1-4.5-4.5z" {...soft} /><path d="M4.5 9h11v5.5a4.5 4.5 0 0 1-4.5 4.5H9a4.5 4.5 0 0 1-4.5-4.5z" />
    <path d="M15.5 10.5h1.7a2.3 2.3 0 0 1 0 4.6h-1.9M8 3.5c-.6.8-.6 1.7 0 2.5M11.5 3.5c-.6.8-.6 1.7 0 2.5" />
  </Svg>
);
export const IconWave = (p: P) => (
  <Svg {...p}>
    <path d="M7.5 12.5V6.8a1.4 1.4 0 0 1 2.8 0v4.7-6.6a1.4 1.4 0 0 1 2.8 0v6.6-5a1.4 1.4 0 0 1 2.8 0v6.2-3.4a1.4 1.4 0 0 1 2.8 0v4.3c0 4-2.6 6.9-6.4 6.9-2.6 0-4.3-1.2-5.6-3.3l-2.2-3.5a1.4 1.4 0 0 1 2.3-1.6z" {...soft} />
    <path d="M7.5 12.5V6.8a1.4 1.4 0 0 1 2.8 0v4.7-6.6a1.4 1.4 0 0 1 2.8 0v6.6-5a1.4 1.4 0 0 1 2.8 0v6.2-3.4a1.4 1.4 0 0 1 2.8 0v4.3c0 4-2.6 6.9-6.4 6.9-2.6 0-4.3-1.2-5.6-3.3l-2.2-3.5a1.4 1.4 0 0 1 2.3-1.6z" />
  </Svg>
);
export const IconCookie = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.8 3 3 0 0 1-3.3-3 3 3 0 0 1-3.2-3.1A3 3 0 0 1 12 3.5Z" {...soft} />
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.8 3 3 0 0 1-3.3-3 3 3 0 0 1-3.2-3.1A3 3 0 0 1 12 3.5Z" />
    <path d="M8.5 10h.01M9 15h.01M13.5 14h.01M12 18h.01" strokeWidth={2.8} />
  </Svg>
);
export const IconSpark = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" {...soft} />
    <path d="M12 3.5c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" /><path d="M19 17v3M17.5 18.5h3" />
  </Svg>
);
export const IconPlug = (p: P) => (
  <Svg {...p}>
    <path d="M7 9h10v3a5 5 0 0 1-10 0z" {...soft} /><path d="M7 9h10v3a5 5 0 0 1-10 0z" />
    <path d="M9.5 9V4.5M14.5 9V4.5M12 17v3.5" />
  </Svg>
);
export const IconCube = (p: P) => (
  <Svg {...p}>
    <path d="m12 3.5 7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z" {...soft} /><path d="m12 3.5 7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z" />
    <path d="M4.5 7.7 12 12l7.5-4.3M12 12v8.5" />
  </Svg>
);
export const IconGrid = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" {...soft} /><rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" />
  </Svg>
);
