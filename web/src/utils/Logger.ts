import { colorReset, cyan, green, orange, pink, red } from "@/utils/terminalColors";

export enum LogLevel {
  ERROR,
  WARNING,
  INFO,
  DEBUG,
  VERBOSE
}

const levelColor = {
  [LogLevel.ERROR]: red,
  [LogLevel.WARNING]: orange,
  [LogLevel.INFO]: green,
  [LogLevel.DEBUG]: cyan,
  [LogLevel.VERBOSE]: pink,
};

const envLevel = LogLevel[import.meta.env.VITE_APP_LOG_LEVEL as keyof typeof LogLevel]
  || LogLevel.ERROR;

export class Logger {
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

    let format = `${levelColor[level]}`;
    format += '[nfcity]';
    if (this.name) {
      format += `[${this.name}]`;
    }
    format += `[${LogLevel[level].at(0)}]`;
    format += colorReset;

    if (typeof (message) === 'string') {
      format += ` ${message}`;
    } else {
      optionalParams = [message, ...optionalParams];
    }

    console.log(
      format,
      ...optionalParams
    );
  }
}

export const logger = Logger.from(envLevel);
