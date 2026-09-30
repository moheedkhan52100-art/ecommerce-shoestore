const test = require('node:test');
const assert = require('node:assert/strict');

const { generateOtp, isOtpExpired } = require('../config/utils/otpUtils');

test('generateOtp returns a 6-digit numeric code', () => {
  const otp = generateOtp();
  assert.match(String(otp), /^\d{6}$/);
});

test('otp is expired only after the validity window', () => {
  const expiredAt = new Date(Date.now() - 1000);
  const validAt = new Date(Date.now() + 60 * 1000);

  assert.equal(isOtpExpired(expiredAt), true);
  assert.equal(isOtpExpired(validAt), false);
});
