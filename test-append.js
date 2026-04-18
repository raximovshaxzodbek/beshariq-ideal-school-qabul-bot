require('dotenv').config();
const sheets = require('./sheets');

async function run() {
  try {
    const res = await sheets.appendRow([new Date().toISOString(),'TEST_NAME','IZOH','MANBA','MANZIL','+998900000000','qiziqish','sinf','username', 12345]);
    console.log('Append result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Append failed:');
    console.error(err);
    if (err && err.response && err.response.data) console.error('Response data:', JSON.stringify(err.response.data, null, 2));
  }
}

run();
