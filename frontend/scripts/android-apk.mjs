import path from 'node:path';
import { androidDir, frontendRoot, gradleEnv, run } from './android-gradle.mjs';

const serverUrl = process.env.CAP_SERVER_URL || 'http://localhost:3000';
const env = gradleEnv({ ...process.env, CAP_SERVER_URL: serverUrl });
const cap = path.join(frontendRoot, 'node_modules', '.bin', 'cap');

run(cap, ['sync', 'android'], { cwd: frontendRoot, env });
run(path.join(androidDir, 'gradlew'), ['assembleDebug'], { cwd: androidDir, env });

console.log(path.join(androidDir, 'app/build/outputs/apk/debug/app-debug.apk'));
