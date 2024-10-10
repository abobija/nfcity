import ConsoleLogStyle, { consoleLogStyleReset, consoleLogStyleSet } from "@/utils/ConsoleLogStyle";

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
  readonly level: LogLevel;
  readonly name?: string;

  protected constructor(level: LogLevel, name?: string) {
    this.level = level;
    this.name = name;
  }

  static from(level: LogLevel, name?: string): Logger {
    return new Logger(level, name);
  }

  static fromName(name: string): Logger {
    return new Logger(envLevel, name);
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

const defaultLogger = Logger.from(envLevel);

export const log = defaultLogger.log.bind(defaultLogger);
export const loge = defaultLogger.error.bind(defaultLogger);
export const logw = defaultLogger.warning.bind(defaultLogger);
export const logi = defaultLogger.info.bind(defaultLogger);
export const logd = defaultLogger.debug.bind(defaultLogger);
export const logv = defaultLogger.verbose.bind(defaultLogger);

export default function makeLogger(name: string): Logger {
  return Logger.from(envLevel, name);
}
