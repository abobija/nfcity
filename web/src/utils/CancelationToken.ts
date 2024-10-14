import { randomHex } from "@/utils/helpers";

export class OperationCanceledError extends Error {
  constructor() {
    super("Operation canceled");
  }
}

export class CancelationToken {
  readonly id: string = randomHex(4).toLowerCase();
  private _isCanceled = false;
  private readonly cancelHandlers: (() => void)[] = [];
  private _reason?: any;

  get isCanceled(): boolean {
    return this._isCanceled;
  }

  get reason(): any {
    return this._reason;
  }

  cancel(reason?: any): CancelationToken {
    if (this._isCanceled) {
      return this;
    }

    this._isCanceled = true;
    this._reason = reason;
    for (const cancelHandler of this.cancelHandlers) {
      cancelHandler();
    }

    return this;
  }

  onCancel(cancelHandler: () => void): CancelationToken {
    if (this._isCanceled) {
      cancelHandler();
    } else {
      this.cancelHandlers.push(cancelHandler);
    }

    return this;
  }

  offCancel(cancelHandler: () => void): CancelationToken {
    const index = this.cancelHandlers.indexOf(cancelHandler);
    if (index !== -1) {
      this.cancelHandlers.splice(index, 1);
    }

    return this;
  }

  throwIfCanceled(): void {
    if (this._isCanceled) {
      throw new OperationCanceledError();
    }
  }
}
