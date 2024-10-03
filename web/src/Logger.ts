const red = "\x1b[31m";
const orange = "\x1b[33m";
const green = "\x1b[32m";
const pink = "\x1b[95m";
const cyan = "\x1b[36m";
const resetColor = "\x1b[0m";

enum LogLevel {
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
  [LogLevel.VERBOSE]: pink
};

class Logger {
  readonly level: LogLevel;

  constructor(level: LogLevel) {
    this.level = level;
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

  private log(level: LogLevel, message?: any, ...optionalParams: any[]): void {
    if (level > this.level) {
      return;
    }

    let format = `${levelColor[level]}[nfcity][${LogLevel[level].at(0)}]${resetColor}`;

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

export const logger = new Logger(
  LogLevel[import.meta.env.VITE_LOG_LEVEL as keyof typeof LogLevel] || LogLevel.ERROR
);
