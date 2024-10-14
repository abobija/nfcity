/**
 * @see https://stackoverflow.com/a/33206814
 */
type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white';

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

interface ConsoleLogStyle extends ColorStyle {
  background?: ColorStyle;
  italic?: boolean;
  underline?: boolean;
}

function consoleLogStyleReset() {
  return "\x1b[0m";
}

function fgColorCode(color: Color, dimmed?: boolean) {
  return colorMap[color] + fgColorOffset + (dimmed ? 0 : brightColorOffset);
}

function bgColorCode(color: Color, dimmed?: boolean) {
  return colorMap[color] + bgColorOffset + (dimmed ? 0 : brightColorOffset);
}

function consoleLogStyleSet(style: ConsoleLogStyle) {
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

export enum LogLevel {
  ERROR,
  WARNING,
  INFO,
  DEBUG,
  VERBOSE
}

interface LogLevelProps {
  style: ConsoleLogStyle;
  logFn: (message?: any, ...optionalParams: any[]) => void;
}

const logLevelProps: Record<LogLevel, LogLevelProps> = {
  [LogLevel.ERROR]: { style: { color: 'red' }, logFn: console.error },
  [LogLevel.WARNING]: { style: { color: 'yellow' }, logFn: console.warn },
  [LogLevel.INFO]: { style: { color: 'green' }, logFn: console.info },
  [LogLevel.DEBUG]: { style: { color: 'magenta' }, logFn: console.debug },
  [LogLevel.VERBOSE]: { style: { color: 'cyan' }, logFn: console.debug },
};

const envLevel = LogLevel[import.meta.env.VITE_APP_LOG_LEVEL as keyof typeof LogLevel]
  || LogLevel.ERROR;

class Logger {
  constructor(
    readonly level: LogLevel,
    readonly name?: string,
  ) {
    this.level = level;
    this.name = name;
  }

  error(message?: any, ...optionalParams: any[]): void {
    this.log(LogLevel.ERROR, message, ...optionalParams);
  }

  warning(message?: any, ...optionalParams: any[]): void {
    this.log(LogLevel.WARNING, message, ...optionalParams);
  }

  info(message?: any, ...optionalParams: any[]): void {
    this.log(LogLevel.INFO, message, ...optionalParams);
  }

  debug(message?: any, ...optionalParams: any[]): void {
    this.log(LogLevel.DEBUG, message, ...optionalParams);
  }

  verbose(message?: any, ...optionalParams: any[]): void {
    this.log(LogLevel.VERBOSE, message, ...optionalParams);
  }

  log(level: LogLevel, message?: any, ...optionalParams: any[]): void {
    if (level > this.level) {
      return;
    }

    let format = consoleLogStyleSet(logLevelProps[level].style);

    const now = new Date();
    format += `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')} `;
    format += `[${LogLevel[level].at(0)}]`;
    format += '[nfcity]';
    if (this.name) {
      format += `[${this.name}]`;
    }
    format += consoleLogStyleReset();

    if (typeof (message) === 'string') {
      format += ` ${message}`;
    } else {
      optionalParams = [message, ...optionalParams];
    }

    logLevelProps[level].logFn(
      format,
      ...optionalParams
    );
  }
}

const defaultLogger = new Logger(envLevel);

export const log = defaultLogger.log.bind(defaultLogger);
export const loge = defaultLogger.error.bind(defaultLogger);
export const logw = defaultLogger.warning.bind(defaultLogger);
export const logi = defaultLogger.info.bind(defaultLogger);
export const logd = defaultLogger.debug.bind(defaultLogger);
export const logv = defaultLogger.verbose.bind(defaultLogger);

export default function makeLogger(name: string): Logger {
  return new Logger(envLevel, name);
}
