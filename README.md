# fleetrust-backoffice

BackOffice de Fleetrust. Repositorio independiente de `fleetrust-admin` (ver
`../ARCHITECTURE.md`): no comparten código de aplicación. Comparten la misma
base de datos, cuyo esquema es propiedad de `fleetrust-admin` — este repo
nunca escribe una migración.

- `apps/web`: front en Next.js (App Router), `app.fleetrust.io`.
- `apps/api`: API en Express, consumida únicamente por `apps/web` de este
  mismo repo.

## Desarrollo local

```bash
cp .env.example .env   # y ajustar si hace falta
npm install
npm run dev:api         # http://localhost:5001/health
npm run dev:web         # http://localhost:5000
```

Requiere que la base MySQL 8 ya tenga aplicado el esquema de
`../admin/db/init.sql` (ver `../admin/db/README.md`). Este repo apunta a la
misma base que `fleetrust-admin` — nunca a la API del panel de
administración.

## Estado (F0)

Solo existe el healthcheck de cada app. No hay login, ni módulos de
negocio: eso arranca en F1. Ver `../REQUERIMIENTO-FLEETRUST.md` sección 16.
