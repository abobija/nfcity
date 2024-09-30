interface Message {
    kind: string;
}

export interface DeviceMessage extends Message { }

export interface WebMessage extends Message { }
