// Keepsake drawings for the Friends journal's shelf: ink line art in the field journal's hand.

const S = `fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;

const ART: Record<string, string> = {
  // a page torn from the ledger, a recipe in tiny writing
  ledger: `<path ${S} d="M14 10h28l8 8v36H14z"/><path ${S} d="M42 10v8h8"/><path ${S} d="M20 26h22M20 32h18M20 38h22M20 44h12" opacity=".7"/>`,
  // a few bars of a tune on a scrap of paper
  song: `<path ${S} d="M10 20h44M10 26h44M10 32h44M10 38h44"/><path ${S} d="M22 38V16M36 32V12"/><ellipse cx="18.5" cy="38" rx="4" ry="3" fill="currentColor"/><ellipse cx="32.5" cy="32" rx="4" ry="3" fill="currentColor"/><path ${S} d="M22 16l14-4"/>`,
  // a red string tied in a bow
  string: `<path ${S} d="M32 30c-8-10-18-8-18-2s10 8 18 2zM32 30c8-10 18-8 18-2s-10 8-18 2z" stroke="#b8463a"/><path ${S} d="M30 32l-8 20M34 32l8 20" stroke="#b8463a"/><circle cx="32" cy="31" r="3" fill="#b8463a" stroke="none"/>`,
  // a pressed thimbleflower
  flower: `<path ${S} d="M32 56V30"/><path ${S} d="M32 44c-6-1-10-5-11-10M32 40c6-1 9-4 10-8"/><path ${S} d="M24 16c0 8 3 14 8 14s8-6 8-14l-4 3-4-6-4 6z" fill="#9b7bc4" fill-opacity=".45"/>`,
  // a mug with a little snake painted on it, for the seat at the head of the table
  seat: `<path ${S} d="M16 18h26v30a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z"/><path ${S} d="M42 24h4a6 6 0 0 1 0 12h-4"/><path ${S} d="M22 38c3-4 6 4 9 0s6 4 9 0" stroke="#5e9a3a"/>`,
};

export const keepsakeArt = (icon: string) => `<svg class="keepsake-art" viewBox="0 0 64 64" aria-hidden="true">${ART[icon] ?? ART.ledger}</svg>`;
