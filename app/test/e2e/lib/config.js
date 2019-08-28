const isMobile = process.env.MOBILE_ENV || false

module.exports = {
  testAccountName: 'toruspuppeteer@gmail.com',
  testAccountPassword: 'toruse2e',
  baseUrl: 'https://localhost:3000', // https://dev.to
  ignoreHTTPSErrors: true,
  isHeadless: true,
  slowMo: 0,
  isDevTools: true,
  launchTimeout: 10000,
  waitingTimeout: 40000,
  isMobile: isMobile,
  viewportWidth: isMobile ? 425 : 1200,
  viewportHeight: isMobile ? 650 : 900
}