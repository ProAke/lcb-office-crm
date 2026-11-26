// Run only by the hosting administrator, from the web directory.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dir = path.join(__dirname, '..', 'data', 'private');
fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
const code = crypto.randomBytes(24).toString('base64url');
const data = { state: 'pending', codeHash: crypto.createHash('sha256').update(code).digest('hex'), codeExpires: Date.now() + 15 * 60 * 1000, sessionSecret: crypto.randomBytes(48).toString('base64url') };
try {
  fs.writeFileSync(path.join(dir, 'setup.json'), JSON.stringify(data), { flag: 'wx', mode: 0o600 });
  console.log('One-time setup code (expires in 15 minutes; do not share):', code);
  console.log('Open the private HTTPS site at /setup.');
} catch (error) {
  if (error.code === 'EEXIST') console.error('Setup already exists. No changes made. Contact the administrator.');
  else console.error('Unable to create private setup file. Check hosting permissions.');
  process.exitCode = 1;
}
