/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#20252B',
    tint: '#2457C5',

    // Core surfaces
    background: '#F6F3EE',
    foreground: '#20252B',

    // Cards / elevated surfaces
    card: '#FFFCF8',
    cardForeground: '#20252B',

    // Primary action color (buttons, links, active states)
    primary: '#2457C5',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E7E4DE',
    secondaryForeground: '#20252B',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#ECE9E3',
    mutedForeground: '#6D737A',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#D8EEE9',
    accentForeground: '#126B63',

    // Destructive actions (delete, error states)
    destructive: '#B94A45',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#DDD9D1',
    input: '#D3D0C9',
    success: '#287A55',
    warning: '#A66816',
    risk: '#B94A45',
    info: '#2457C5',
    overlay: '#20252B',
  },

  dark: {
    text: '#F7F3EC',
    tint: '#7F9EFF',
    background: '#181B1F',
    foreground: '#F7F3EC',
    card: '#23282D',
    cardForeground: '#F7F3EC',
    primary: '#7F9EFF',
    primaryForeground: '#101318',
    secondary: '#30363C',
    secondaryForeground: '#F7F3EC',
    muted: '#2B3136',
    mutedForeground: '#B5B8BA',
    accent: '#193C3A',
    accentForeground: '#94E2D7',
    destructive: '#F1847C',
    destructiveForeground: '#1C1110',
    border: '#3A4148',
    input: '#495158',
    success: '#70C795',
    warning: '#E2AF62',
    risk: '#F1847C',
    info: '#9EB5FF',
    overlay: '#000000',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 12,
};

export default colors;
