// Setelah melakukan Deploy > New deployment > Web app pada Google Apps Script,
// tempelkan URL Web App yang berakhiran /exec di apiUrl berikut.
// Spreadsheet sudah ditentukan pada google-apps-script/Code.gs.
window.DONATION_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbzgywu756kPIxWg9yrpLTegsZCKQMZ0aT-XvBJPzCwpXAfq_YpRad3S0r86iINdrLVu/exec',
  apiTimeoutMs: 15000,
  pageSize: 8,
  refreshMs: 120000
};
