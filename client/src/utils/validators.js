export const CNIC_RE = /^\d{5}-\d{7}-\d$/;
export const CNIC_ERROR = 'A CNIC is 13 digits as 00000-0000000-0. Check the number on the card.';

export function isValidCnic(value) {
  return CNIC_RE.test(value);
}
