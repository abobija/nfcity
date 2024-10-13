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

export function byteRepresentationSingleChar(byteRepresentation: ByteRepresentation): string {
  return byteRepresentationSingleCharMap[byteRepresentation];
}

export default ByteRepresentation;
