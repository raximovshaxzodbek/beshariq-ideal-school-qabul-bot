const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.warn('Warning: One of SHEET_ID, GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY is not set in env. sheets.appendRow will fail until these are provided.');
}

if (PRIVATE_KEY) {
  // If key contains literal \n sequences (from .env), convert to real newlines
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
  // Remove surrounding quotes that some .env editors keep ("..." or '...')
  PRIVATE_KEY = PRIVATE_KEY.trim();
  if ((PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) || (PRIVATE_KEY.startsWith("'") && PRIVATE_KEY.endsWith("'"))) {
    PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
  }
}

async function appendRow(rowValues) {
  if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing Google Sheets credentials or SHEET_ID in environment.');
  }

  // Use object form to avoid positional-arg issues across library versions
  const jwt = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth: jwt });

  const resource = {
    values: [rowValues]
  };

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource
  });

  return res.data;
}

module.exports = { appendRow };
