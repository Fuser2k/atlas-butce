export default () => ({
  nodeEnv: process.env.NODE_ENV || 'dev',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  adminJwt: {
    // Mobil kullanıcı JWT'sinden tamamen ayrı bir secret — mobil token'ların
    // admin endpoint'lerine erişememesi bu ayrımla garanti edilir.
    secret: process.env.ADMIN_JWT_SECRET,
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
  },
  adminSeed: {
    email: process.env.ADMIN_SEED_EMAIL,
    password: process.env.ADMIN_SEED_PASSWORD,
  },
});
