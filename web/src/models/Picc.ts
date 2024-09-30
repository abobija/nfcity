export enum PiccState {
    PowerOff = -1,
    Idle = 0,
    Ready,
    Active,
    Halt,
    ReadyH,
    ActiveH,
}

export enum PiccType {
    Unknown = -1,
    Undefined = 0,
    ISO14443_4,
    ISO18092,
    MifareMini,
    Mifare1K,
    Mifare4K,
    MifareUltralight,
    MifarePlus,
    MifareDesfire,
    Tnp3XXX,
}

export enum PiccKeyType {
    A = 0,
    B = 1,
}

export default interface Picc {
    type: PiccType;
    state: PiccState;
    atqa: number;
    sak: number;
    uid: Uint8Array;
}