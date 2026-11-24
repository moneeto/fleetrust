This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Demo login: `jpalmeyro` / `123`.

## APK de Android

La app abre `http://localhost:3000`. Next tiene que estar en el puerto 3000 y la API en el 8101. El APK no hace falta regenerarlo si solo cambió el código web.

1. Generar el APK, desde `frontend/` (hace falta JDK 21 y el Android SDK en `~/Android/Sdk`):

```bash
npm run cap:apk
```

Queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

2. En PowerShell, con el teléfono conectado por depuración inalámbrica:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices
& $adb reverse tcp:3000 tcp:3000
& $adb reverse tcp:8101 tcp:8101
& $adb reverse --list
& $adb install -r "\\wsl.localhost\Ubuntu\home\moneeto\frassi_enlatado\frontend\android\app\build\outputs\apk\debug\app-debug.apk"
```

`devices` tiene que mostrar el teléfono como `device`. `--list` tiene que mostrar los dos puertos. Si la lista queda vacía, la sesión de adb se cortó: repetí `devices` y los dos `reverse`.

## AAB para Play Store

El AAB abre el sitio publicado, no el localhost. Se genera desde `frontend/`. El keystore y `android/keystore.properties` no se suben al repo: hacé una copia del keystore fuera de la máquina.

1. Una sola vez, crear la clave de firma:

```bash
keytool -genkeypair -v -keystore fleetrust-upload.keystore -alias fleetrust -keyalg RSA -keysize 2048 -validity 10000
```

2. Crear `android/keystore.properties`. `storeFile` es relativo a `android/app/`:

```properties
storePassword=...
keyPassword=...
keyAlias=fleetrust
storeFile=../../fleetrust-upload.keystore
```

3. Generar el paquete. `CAP_SERVER_URL` solo vale para ese comando:

```bash
CAP_SERVER_URL=https://fleetrust.app npm run cap:aab
```

Cada corrida sube el `versionCode`. El archivo queda en `android/app/build/outputs/bundle/release/app-release.aab`. Ese es el que se sube a Play Console, en Prueba interna.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
