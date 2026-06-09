import { createHmac } from 'crypto';

const _k = [
  67, 121, 98, 101, 114, 67, 97, 102,
  101, 95, 68, 111, 117, 109, 98, 105,
  97, 95, 76, 105, 99, 95, 50, 48,
  50, 53, 95, 83, 101, 99, 114, 51,
  116, 95, 75, 51, 121
];

const SECRET = Buffer.from(_k);

export function hmacSign(data: string): string {
  return createHmac('sha256', SECRET)
    .update(data)
    .digest('hex');
}