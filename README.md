# fleetrust-backoffice

BackOffice de Fleetrust. Repositorio independiente de `fleetrust-admin` (ver
`../ARCHITECTURE.md`): no comparten código de aplicación. Comparten la misma
base de datos, cuyo esquema es propiedad de `fleetrust-admin` — este repo
nunca escribe una migración.

- `apps/web`: front en Next.js (App Router), `app.fleetrust.io`.
- `apps/api`: API en Express, consumida únicamente por `apps/web` de este
  mismo repo.

## Desarrollo local

Todo (MySQL + API + Web) se levanta con un solo comando, desde `fleetrust/`
o desde `fleetrust/backoffice/` (Docker Compose busca el archivo en
directorios padres si no lo encuentra en el actual):

```bash
docker compose up
```

- Web: http://localhost:5000
- API: http://localhost:5001/health
- Panel de administración (mismo `docker compose up`): http://localhost:4000

La primera vez descarga la imagen de MySQL, instala las dependencias de
Node dentro de los contenedores (`node_modules` vive en volúmenes propios,
no se mezcla con el host) y aplica el esquema completo (`admin/db/init.sql`)
más el seed de demo de este repo (`db/seed/001-f1-demo.sql`) — ambos
corren automáticamente la primera vez que el volumen de datos está vacío.
`api`/`web` corren en modo desarrollo (hot-reload sobre el código montado).

```bash
docker compose down       # apaga todo, conserva los datos
docker compose down -v    # apaga todo y borra los datos (reset total)
docker compose logs -f api
```

Si el puerto 3306 ya está en uso por un MySQL nativo instalado en la
máquina, hay que pararlo antes (`sudo systemctl stop mysql`), porque
Docker necesita ese puerto libre para el `mysql` de este `docker-compose.yml`.

Este repo apunta a la misma base que `fleetrust-admin` — nunca a la API del
panel de administración.

### Usuarios de prueba (seed F1)

| Email | Password | Rol |
|---|---|---|
| `owner@demo.fleetrust.io` | `Fleetrust2026!` | OWNER |
| `operador@demo.fleetrust.io` | `Fleetrust2026!` | OPERATOR |

## Estado (F3 — en curso)

F1 y F2 están cerradas. F3 ya tiene, en el backoffice, flota (tipos, atributos
dinámicos y unidades), profesionales con invitación, horarios y reservas
cargadas a mano. Falta cerrar la fase: agenda del profesional como pantalla
de aterrizaje pulida, exportación de reservas y el resto de criterios de
RF-510/520/530/560. El asistente de disponibilidad es F4.

Login con sesión (access token 15 min + refresh rotable 30 días, cookies
httpOnly), aislamiento por `idAccount`, motor de permisos (contrato ∩
autorización), menú de navegación dinámico según permisos reales, pantalla
de perfil (nombre/idioma), i18n completo (es-AR/en-US/pt-BR) sin URLs por
locale. Todavía sin módulos de negocio (reservas, flota, etc.): eso es F3+.
Ver `../REQUERIMIENTO-FLEETRUST.md` sección 16 y `../ARCHITECTURE.md`
sección 8.
