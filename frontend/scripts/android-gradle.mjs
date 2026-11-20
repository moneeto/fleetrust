import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

export const frontendRoot = path.resolve(scriptsDir, '..');
export const androidDir = path.join(frontendRoot, 'android');

const preferredJdk = '/usr/lib/jvm/java-21-openjdk-amd64';
const linuxSdk = path.join(process.env.HOME || '', 'Android', 'Sdk');

function findJdk21() {
  if (existsSync(preferredJdk)) return preferredJdk;
  const root = '/usr/lib/jvm';
  if (!existsSync(root)) return null;
  const match = readdirSync(root).find((name) => name.startsWith('java-21-openjdk-'));
  return match ? path.join(root, match) : null;
}

function javaBanner(javaBin) {
  const result = spawnSync(javaBin, ['-version'], { encoding: 'utf8' });
  return `${result.stdout || ''}${result.stderr || ''}`;
}

export function gradleEnv(base = process.env) {
  const env = { ...base };
  const current = env.JAVA_HOME ? path.join(env.JAVA_HOME, 'bin', 'java') : 'java';
  if (!javaBanner(current).includes('version "21')) {
    const jdk = findJdk21();
    if (!jdk) {
      console.error('Falta OpenJDK 21. Instalá con: sudo apt-get install -y openjdk-21-jdk');
      process.exit(1);
    }
    env.JAVA_HOME = jdk;
    env.PATH = `${path.join(jdk, 'bin')}${path.delimiter}${env.PATH || ''}`;
  }
  if (!env.ANDROID_HOME && existsSync(path.join(linuxSdk, 'platforms'))) {
    env.ANDROID_HOME = linuxSdk;
    env.ANDROID_SDK_ROOT = linuxSdk;
  }
  return env;
}

export function run(command, args, options) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
