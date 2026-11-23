Si no está configurado el rol, por mas que intentes crear el usuario no te vas a poder logear. asegurate de asignar el rol.

## Notificaciones push

Código en `src/notifications/`. Desde cualquier parte del backend:

```js
const { notify, notifyAdmins } = require('../notifications');

notify(idUser, 'Título', 'Mensaje');          // a un usuario (cualquier rol)
notifyAdmins(idAccount, 'Título', 'Mensaje'); // a todos los admins de la cuenta
// 5º parámetro opcional: notifyAdmins(idAccount, título, mensaje, data, idUsuarioExcluido)
```

Se envían (reserva nueva y cancelación no le llegan a quien la hizo): reserva nueva, cancelación, recordatorio 1 hora antes y resumen diario (hora configurable por cuenta en Settings). Cada usuario puede apagarlas en Settings. Para agregar una nueva, escribí una función en `src/notifications/events.js` y llamala donde ocurre el evento.

Puesta en marcha:

1. Base de datos existente: `sudo docker exec -i fleetrust-mysql mariadb -uadmin -p fleetrust < backend/sql/push-notifications.sql` (las bases nuevas ya lo traen en `init.sql`).
2. Firebase: crear un proyecto, agregar la app Android `com.fleetrust.app` y bajar `google-services.json` a `frontend/android/app/`.
3. Firebase > Configuración > Cuentas de servicio > Generar clave privada. Guardar el json fuera de git y poner su ruta en `backend/.env` como `FIREBASE_SERVICE_ACCOUNT_PATH`.
4. Regenerar la APK (`npm run cap:apk` en `frontend/`) e instalarla.

Prueba rápida de los textos: `node src/notifications/notifications.check.js`.

### En producción

No se repite todo: el proyecto de Firebase (`fleetrust-37936`) y el `google-services.json` son los mismos para desarrollo y producción. Solo falta:

1. **Base de datos de producción:** correr `backend/sql/push-notifications.sql` una vez (`init.sql` solo se aplica a bases nuevas).
2. **Clave del servidor:** copiar el json de la cuenta de servicio al servidor de producción, fuera del repo y con `chmod 600`, y poner su ruta en el `.env` de producción como `FIREBASE_SERVICE_ACCOUNT_PATH`. La ruta es de cada entorno: en local es `/home/moneeto/secrets/firebase-service-account.json`, en el servidor puede ser cualquiera (por ejemplo `/etc/fleetrust/firebase-service-account.json`). El código solo lee lo que diga esa variable. Si preferís una clave distinta para producción, generala de nuevo en Firebase > Configuración del proyecto > Cuentas de servicio > SDK de Firebase Admin > Generar nueva clave privada.
3. **APK/AAB:** generarlo con `npm run cap:aab`. Ya incluye el `google-services.json` que está en `frontend/android/app/`. El paquete tiene que seguir siendo `com.fleetrust.app`; si algún día cambia, hay que registrar la app nueva en Firebase y bajar otro `google-services.json`.
4. **Un solo backend con jobs:** los recordatorios y el resumen diario corren dentro del API. Por eso el ecosystem de PM2 usa `fork` con una sola instancia (como el backoffice, no como tours en cluster). El API tiene que estar encendido las 24 horas.

### PM2 en el VPS

El repo se clona en `/var/www/fleetrust`. Los `.env` se pegan a mano y no se commitean.

- Backend: `backend/.env` con `NODE_ENV` lo fuerza el ecosystem a `production`. Definí `API_PORT=8110`, `API_MODE=prod`, `API_WHITELIST=https://fleetrust.app`, `COOKIE_DOMAIN=.fleetrust.app`, `FRONTEND_URL=https://fleetrust.app`, `WEBAUTHN_RP_ID=fleetrust.app`, `WEBAUTHN_ORIGINS=https://fleetrust.app` y `FIREBASE_SERVICE_ACCOUNT_PATH` con la ruta real del servidor (por ejemplo `/home/ubuntu/secrets/firebase-service-account.json`).
- Frontend: `frontend/.env` antes del build, con `NEXT_PUBLIC_API_ENDPOINT=https://api.fleetrust.app` y las claves públicas de Google y reCAPTCHA. Esas variables quedan adentro del build.

```bash
cd /var/www/fleetrust/backend && npm install && pm2 start ecosystem.config.js
cd /var/www/fleetrust/frontend && npm install && npm run build && pm2 start ecosystem.config.js
pm2 save
```

Nginx: `deploy/nginx-fleetrust.conf`. La web queda en el puerto 3010 y la API en el 8110, las dos solo en `127.0.0.1`.

Si las notificaciones no llegan, mirá los logs del backend: los errores de envío empiezan con `[push]`.
