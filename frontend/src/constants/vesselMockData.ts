/** Exact Stitch mock values — page1 vessel panel & stats */
export const DISPLAY_VESSELS_MONITORED = 847;
export const DISPLAY_HIGH_RISK = 23;
export const DISPLAY_ACTIVE_ALERTS = 7;
export const DISPLAY_ACTIVE_INVESTIGATIONS = 4;

export const STITCH_VESSEL = {
  name: 'MV ESPERANZA',
  imo: 'IMO 9123456',
  riskLabel: 'Critical Risk',
  lastPhoto: 'Last Photo: 1h ago • Arabian Sea',
  riskScore: 91,
  confidence: 0.73,
  rangeLow: 78,
  rangeHigh: 97,
  confidenceNote: 'Moderate data confidence — AIS gaps detected',
  projection:
    'High probability of abandonment. Vessel behavior consistent with distressed maritime assets in this corridor.',
  daysStationary: '47 days',
  aisGap: '72 h',
};

export const STITCH_VOYAGE = {
  departed: 'PORT SUDAN',
  departedDate: '22 MAY 2024',
  destination: 'JEDDAH',
  eta: 'ETA: -- -- --',
  distanceNm: '142 NM',
  fuelRate: '2.4 mt/day',
  gapLabel: '72H GAP DETECTED',
};

export interface PortCall {
  port: string;
  flag: string;
  arrival: string;
  stay: string;
}

export const STITCH_PORT_CALLS: PortCall[] = [
  { port: 'Port Sudan', flag: '🇸🇩', arrival: '18 May', stay: '4d' },
  { port: 'Djibouti', flag: '🇩🇯', arrival: '02 May', stay: '1d' },
  { port: 'Aden', flag: '🇾🇪', arrival: '24 Apr', stay: '2d' },
  { port: 'Muscat', flag: '🇴🇲', arrival: '12 Apr', stay: '12h' },
  { port: 'Dubai', flag: '🇦🇪', arrival: '28 Mar', stay: '5d' },
];

/** Stitch AIS bar: 4 green, 3 red, 3 green */
export const STITCH_AIS_BLOCKS: ('ok' | 'gap')[] = [
  'ok',
  'ok',
  'ok',
  'ok',
  'gap',
  'gap',
  'gap',
  'ok',
  'ok',
  'ok',
];

export const STITCH_INVESTIGATIONS = [
  { id: 'INV-4429', status: 'MONITORED' as const, date: '02 Jun 2024', riskScore: 88 },
  { id: 'INV-3981', status: 'ESCALATED' as const, date: '18 May 2024', riskScore: 74 },
];

export const STITCH_RISK_TREND = { start: 61, end: 91 };

export const STITCH_STATUS_STYLE = {
  MONITORED: 'text-[#FFB690] border-[#FFB690] bg-[#FFB6901A]',
  ESCALATED: 'text-[#FFB4AB] border-[#FFB4AB] bg-[#FFB4AB1A]',
};

/** Stitch page1 map bottom alert strip */
export const STITCH_MAP_ALERTS = [
  {
    name: 'MV Esperanza',
    badge: 'CRITICAL',
    badgeClass: 'bg-[#FFB4AB1A] text-[#FFB4AB]',
    detail: 'Stationary for 47 days',
    time: '2m ago',
    flex: true,
  },
  {
    name: 'MT Horizon Star',
    badge: 'HIGH',
    badgeClass: 'bg-[#F973161A] text-[#F97316]',
    detail: 'AIS gap for 36 hours',
    time: '15m ago',
    flex: true,
  },
  {
    name: 'MV Ocean Glory',
    badge: null,
    badgeClass: '',
    detail: 'Irregular movement detected',
    time: null,
    flex: false,
  },
] as const;

/** Stitch page4 report stat fallbacks */
export const STITCH_REPORT_STATS = {
  total: 847,
  escalated: 23,
  monitored: 156,
  noAction: 668,
};
