require('dotenv').config();
const { google } = require('googleapis');

async function testAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !rawKey) {
    console.error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in .env');
    process.exit(2);
  }

  // Normalize private key the same way as sheets.js does
  let privateKey = rawKey.replace(/\\n/g, '\n');
  privateKey = privateKey.trim();
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }

  // Diagnostic logs (safe): don't print the key itself, just checks
  console.log('GOOGLE_CLIENT_EMAIL present?', !!clientEmail);
  console.log('PRIVATE_KEY length:', privateKey ? privateKey.length : 0);
  console.log('PRIVATE_KEY startsWith BEGIN:', privateKey.startsWith('-----BEGIN'));
  console.log('PRIVATE_KEY endsWith END:', privateKey.trim().endsWith('-----END PRIVATE KEY-----'));

  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  // Try to authorize and print a short result
  try {
    const tokens = await jwt.authorize();
    console.log('Auth OK — got tokens. Access token present:', !!tokens.access_token);
  } catch (err) {
    console.error('Auth failed. Error message:');
    console.error(err && err.message ? err.message : err);
    if (err && err.response && err.response.data) {
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(3);
  }
}

testAuth();
