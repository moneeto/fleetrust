import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { androidDir, frontendRoot, gradleEnv, run } from './android-gradle.mjs';

const serverUrl = process.env.CAP_SERVER_URL || '';
if (!serverUrl.startsWith('https://')) {
  console.error('cap:aab necesita CAP_SERVER_URL con https://');
  process.exit(1);
}

const keystoreProperties = path.join(androidDir, 'keystore.properties');
if (!existsSync(keystoreProperties)) {
  console.error(`Falta ${keystoreProperties}`);
  console.error('Creá la upload key desde frontend/:');
  console.error('keytool -genkeypair -v -keystore fleetrust-upload.keystore -alias fleetrust -keyalg RSA -keysize 2048 -validity 10000');
  console.error('');
  console.error('Después escribí frontend/android/keystore.properties (storeFile es relativo a frontend/android/app):');
  console.error('storePassword=...');
  console.error('keyPassword=...');
  console.error('keyAlias=fleetrust');
  console.error('storeFile=../../fleetrust-upload.keystore');
  process.exit(1);
}

const gradleFile = path.join(androidDir, 'app', 'build.gradle');
const gradle = readFileSync(gradleFile, 'utf8');
const match = gradle.match(/versionCode\s*=?\s*(\d+)/);
if (!match) {
  console.error(`No encontré versionCode en ${gradleFile}`);
  process.exit(1);
}
const nextCode = Number(match[1]) + 1;
writeFileSync(gradleFile, gradle.replace(match[0], match[0].replace(match[1], String(nextCode))));
console.log(`versionCode ${match[1]} -> ${nextCode}`);

const env = gradleEnv({ ...process.env, CAP_SERVER_URL: serverUrl });
const cap = path.join(frontendRoot, 'node_modules', '.bin', 'cap');

run(cap, ['sync', 'android'], { cwd: frontendRoot, env });
run(path.join(androidDir, 'gradlew'), ['bundleRelease'], { cwd: androidDir, env });

console.log(path.join(androidDir, 'app/build/outputs/bundle/release/app-release.aab'));
