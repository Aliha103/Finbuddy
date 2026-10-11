// "Every group is its own card": the five cards of the fan, their poses, and how a card is drawn.
// Shared by the three.js scene (as CanvasTextures) and the SVG fallback, so both show the same
// cards. Every figure comes from lib/sample (the engine over createSampleData).
import { formatMoney, type Money } from '@finbuddy/shared';

import { CURRENT_MONTH, GROUPS, OVERVIEW, SAMPLE_LOCALE, SPENDING } from './sample';

export interface FanLine {
  readonly label: string;
  readonly amounts: readonly string[];
}
export interface FanCard {
  readonly key: string;
  readonly kind: 'home' | 'group' | 'personal';
  readonly name: string;
  readonly meta: string;
  readonly members: readonly string[];
  /** Leading-edge band and name chip: the group's line colour. Null for the tinted home card. */
  readonly line: { readonly fill: string; readonly on: string } | null;
  readonly lines: readonly FanLine[];
}

const fmt = (m: Money) => formatMoney(m, { locale: SAMPLE_LOCALE });
const abs = (m: Money): Money => ({ amountMinor: Math.abs(m.amountMinor), currency: m.currency });

const monthName = new Intl.DateTimeFormat(SAMPLE_LOCALE, { month: 'long', timeZone: 'UTC' }).format(new Date(`${CURRENT_MONTH}-01T00:00:00Z`));
const thisMonth = SPENDING.at(-1);

const groupCards: FanCard[] = GROUPS.map((g) => ({
  key: g.id,
  kind: 'group',
  name: g.name,
  meta: g.currency,
  members: g.members,
  line: { fill: g.line.fill, on: g.line.on },
  lines: [
    {
      label: g.myNet.amountMinor < 0 ? 'You owe' : g.myNet.amountMinor > 0 ? "You're owed" : 'Settled up',
      amounts: g.myNet.amountMinor === 0 ? [] : [fmt(abs(g.myNet))],
    },
  ],
}));

const home: FanCard = {
  key: 'home',
  kind: 'home',
  name: 'FinBuddy',
  meta: 'All groups',
  members: [],
  line: null,
  lines: [
    ...(OVERVIEW.owe.length ? [{ label: 'You owe', amounts: OVERVIEW.owe.map(fmt) }] : []),
    ...(OVERVIEW.owed.length ? [{ label: "You're owed", amounts: OVERVIEW.owed.map(fmt) }] : []),
  ],
};

const personal: FanCard = {
  key: 'personal',
  kind: 'personal',
  name: 'Personal',
  meta: thisMonth?.total.currency ?? '',
  members: ['You'],
  line: { fill: '#B9AFBE', on: '#1A1420' },
  lines: thisMonth ? [{ label: `Your share, ${monthName}`, amounts: [fmt(thisMonth.total)] }] : [],
};

/** Back to front: the FinBuddy card (every balance, per currency) is the one in front. */
export const FAN_CARDS: readonly FanCard[] = [groupCards[0], groupCards[1], groupCards[2], personal, home].filter((c): c is FanCard => Boolean(c));

/**
 * The fan in world units. Cards cascade down and to the right, each showing the top strip that
 * carries its name and readout, so every balance stays legible; the camera distance is solved
 * from the stage's aspect so the open fan fills it. Wide stages (5:4) spread sideways more than
 * the tall phone stage (4:5).
 */
export interface FanLayout {
  readonly aspect: number;
  readonly cardW: number;
  readonly cardH: number;
  readonly dx: number;
  readonly dy: number;
  readonly tilt: number;
  readonly fov: number;
  readonly cameraZ: number;
}

export function fanLayout(wide: boolean): FanLayout {
  const aspect = wide ? 5 / 4 : 4 / 5;
  const cardW = 3.2;
  const cardH = cardW / 1.586;
  const dx = wide ? 0.34 : 0.1;
  const dy = cardH * 0.37;
  const fov = 35;
  const n = 5;
  const fanW = cardW + (n - 1) * dx + 0.5;
  const fanH = cardH + (n - 1) * dy + 0.4;
  const visibleH = Math.max(fanH, fanW / aspect) * 1.06;
  const cameraZ = visibleH / (2 * Math.tan(((fov / 2) * Math.PI) / 180));
  return { aspect, cardW, cardH, dx, dy, tilt: 0.035, fov, cameraZ };
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  rotZ: number;
}

/** progress 0: a stacked wallet. progress 1: the open fan. */
export function pose(i: number, count: number, p: number, layout: FanLayout): Pose {
  const k = i - (count - 1) / 2;
  return {
    x: k * layout.dx * p,
    y: -k * layout.dy * p - (1 - p) * i * 0.035,
    z: i * 0.06,
    rotZ: -k * layout.tilt * p,
  };
}

export interface CardTheme {
  readonly surface: string;
  readonly label: string;
  readonly label2: string;
  readonly separator: string;
  readonly tint: string;
  readonly onTint: string;
  readonly fill: string;
}
export const CARD_THEMES: Record<'light' | 'dark', CardTheme> = {
  light: { surface: '#FFFFFF', label: '#1A1420', label2: '#5F5564', separator: '#E4DEE6', tint: '#4A4652', onTint: '#FFFFFF', fill: '#EFEAF1' },
  dark: { surface: '#2A252F', label: '#F6F2F7', label2: '#B9AFBE', separator: '#3A3340', tint: '#CFC8D6', onTint: '#1A1420', fill: '#3A3340' },
};

export const FONT_STACK = '"Mona Sans Variable", "Mona Sans Fallback", system-ui, sans-serif';

/** Card geometry on a 320-unit-wide card (the ID-1 card at 320 pt): corner 12, band 6. */
export const CARD_UNITS = { w: 320, h: 320 / 1.586, radius: 12, band: 6, pad: 18 } as const;

/**
 * Draws one card into a 2D context whose drawing space is CARD_UNITS scaled by `scale`.
 * Used for the three.js textures; the SVG fallback mirrors the same positions.
 */
export function drawCard(g: CanvasRenderingContext2D, card: FanCard, theme: CardTheme, scale: number): void {
  const { w, h, radius, band, pad } = CARD_UNITS;
  g.save();
  g.scale(scale, scale);
  g.clearRect(0, 0, w, h);
  g.beginPath();
  g.roundRect(0, 0, w, h, radius);
  g.closePath();
  g.save();
  g.clip();
  const home = card.kind === 'home';
  g.fillStyle = home ? theme.tint : theme.surface;
  g.fillRect(0, 0, w, h);
  if (card.line) {
    g.fillStyle = card.line.fill;
    g.fillRect(0, 0, band, h);
  }
  g.restore();
  if (!home) {
    g.strokeStyle = theme.separator;
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(0.5, 0.5, w - 1, h - 1, radius);
    g.stroke();
  }
  const ink = home ? theme.onTint : theme.label;
  const soft = home ? theme.onTint : theme.label2;
  const left = pad + (card.line ? band : 0);

  // Top strip: the name (a chip in the line colour, or the mark's bars on the FinBuddy card).
  g.textBaseline = 'middle';
  if (card.line) {
    g.font = `600 13px ${FONT_STACK}`;
    const tw = g.measureText(card.name).width;
    g.fillStyle = card.line.fill;
    g.beginPath();
    g.roundRect(left, pad, tw + 20, 24, 12);
    g.fill();
    g.fillStyle = card.line.on;
    g.fillText(card.name, left + 10, pad + 12.5);
  } else {
    g.fillStyle = ink;
    g.beginPath();
    g.roundRect(left, pad + 4, 22, 5, 2.5);
    g.roundRect(left, pad + 13, 9.8, 5, 2.5);
    g.roundRect(left + 12.2, pad + 13, 9.8, 5, 2.5);
    g.fill();
    g.font = `700 15px ${FONT_STACK}`;
    g.fillText(card.name, left + 30, pad + 11.5);
  }

  g.textBaseline = 'alphabetic';
  if (!home) {
    // The readout sits in the strip that stays visible when the cards fan out.
    const line = card.lines[0];
    g.textAlign = 'right';
    if (line) {
      g.fillStyle = soft;
      g.font = `500 12px ${FONT_STACK}`;
      g.fillText(line.label, w - pad, pad + 10);
      g.fillStyle = ink;
      g.font = `700 26px ${FONT_STACK}`;
      g.fillText(line.amounts[0] ?? '', w - pad, pad + 40);
    }
    g.font = `600 12px ${FONT_STACK}`;
    g.fillStyle = soft;
    g.fillText(`${card.meta}  ·  Sample`, w - pad, h - pad);
    g.textAlign = 'left';
  } else {
    g.textAlign = 'right';
    g.fillStyle = soft;
    g.font = `600 12px ${FONT_STACK}`;
    g.fillText(card.meta, w - pad, pad + 16);
    g.textAlign = 'left';
    const columns = card.lines.length;
    const colW = (w - left - pad) / Math.max(1, columns);
    const big = Math.max(0, ...card.lines.map((l) => l.amounts.length)) <= 1 ? 30 : 22;
    card.lines.forEach((line, c) => {
      const x = left + c * colW;
      let y = h - pad - (line.amounts.length - 1) * (big + 4);
      g.fillStyle = soft;
      g.font = `500 12px ${FONT_STACK}`;
      g.fillText(line.label, x, y - big - 6);
      g.fillStyle = ink;
      g.font = `700 ${big}px ${FONT_STACK}`;
      for (const a of line.amounts) {
        g.fillText(a, x, y);
        y += big + 4;
      }
    });
  }

  // Members as initials, bottom left.
  card.members.slice(0, 4).forEach((m, i) => {
    if (home) return;
    const cx = left + 11 + i * 18;
    const cy = h - pad - 7;
    g.fillStyle = theme.fill;
    g.strokeStyle = theme.surface;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, 11, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = theme.label;
    g.font = `600 10px ${FONT_STACK}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(m.slice(0, 1).toUpperCase(), cx, cy + 0.5);
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
  });
  g.restore();
}
