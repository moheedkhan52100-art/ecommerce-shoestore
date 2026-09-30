const generateOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const isOtpExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
};

module.exports = {
  generateOtp,
  isOtpExpired
};
