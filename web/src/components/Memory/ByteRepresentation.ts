enum ByteRepresentation {
  Hexadecimal,
  Ascii,
  Decimal,
  Binary,
}

const byteRepresentationSingleCharMap = {
  [ByteRepresentation.Hexadecimal]: 'h',
  [ByteRepresentation.Ascii]: 'a',
  [ByteRepresentation.Decimal]: 'd',
  [ByteRepresentation.Binary]: 'b',
};

const byteRepresentationShortNameMap = {
  [ByteRepresentation.Hexadecimal]: 'hex',
  [ByteRepresentation.Ascii]: 'ascii',
  [ByteRepresentation.Decimal]: 'dec',
  [ByteRepresentation.Binary]: 'bin',
};

export function byteRepresentationSingleChar(byteRepresentation: ByteRepresentation): string {
  return byteRepresentationSingleCharMap[byteRepresentation];
}

export function byteRepresentationShortName(byteRepresentation: ByteRepresentation): string {
  return byteRepresentationShortNameMap[byteRepresentation];
}

export default ByteRepresentation;
