/**
 * @see https://stackoverflow.com/a/33206814
 */
export type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white';

const colorMap: Record<Color, number> = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
}

const fgColorOffset = 0;
const bgColorOffset = 10;
const brightColorOffset = 60;

interface ColorStyle {
  color: Color;
  dimmed?: boolean;
}

export default interface ConsoleLogStyle extends ColorStyle {
  background?: ColorStyle;
  italic?: boolean;
  underline?: boolean;
}

export function consoleLogStyleReset() {
  return "\x1b[0m";
}

function fgColorCode(color: Color, dimmed?: boolean) {
  return colorMap[color] + fgColorOffset + (dimmed ? 0 : brightColorOffset);
}

function bgColorCode(color: Color, dimmed?: boolean) {
  return colorMap[color] + bgColorOffset + (dimmed ? 0 : brightColorOffset);
}

export function consoleLogStyleSet(style: ConsoleLogStyle) {
  let code = "\x1b[";

  code += fgColorCode(style.color, style.dimmed);

  if (style.background) {
    code += ";" + bgColorCode(style.background.color, style.background.dimmed);
  }

  if (style.italic) {
    code += ";3";
  }

  if (style.underline) {
    code += ";4";
  }

  return code + "m";
}
