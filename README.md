# Jornada Laboral

Control de horas y pagos del equipo de trabajo. Solo el admin puede editar; todos los demás pueden ver.

---

## Despliegue en Vercel (paso a paso)

### 1. Sube el código a GitHub

1. Ve a [github.com](https://github.com) e inicia sesión (o crea cuenta gratis).
2. Pulsa **New repository** → ponle nombre (ej: `jornada-laboral`) → **Create repository**.
3. En tu ordenador, abre una terminal en la carpeta del proyecto y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "primer commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/jornada-laboral.git
   git push -u origin main
   ```

### 2. Despliega en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Pulsa **Add New → Project**.
3. Selecciona el repositorio `jornada-laboral`.
4. Pulsa **Deploy** (sin cambiar nada más).
5. Espera ~1 minuto. Vercel te dará una URL como `jornada-laboral.vercel.app`.

### 3. Conecta la base de datos (Vercel KV)

1. En el dashboard de Vercel, entra a tu proyecto.
2. Ve a la pestaña **Storage**.
3. Pulsa **Create Database → KV**.
4. Ponle nombre (ej: `jornada-kv`) y pulsa **Create**.
5. Pulsa **Connect Project** y selecciona tu proyecto.
6. Las variables de entorno (`KV_URL`, etc.) se añaden automáticamente.

### 4. Configura las variables de entorno

1. En Vercel, ve a **Settings → Environment Variables**.
2. Añade estas variables:

   | Variable | Valor |
   |----------|-------|
   | `ADMIN_USERNAME` | el usuario que quieras (ej: `capataz`) |
   | `ADMIN_PASSWORD` | contraseña segura (ej: `Cuadrilla#2026!`) |
   | `AUTH_SECRET` | cadena larga aleatoria (ej: `abc123xyz789...`) |

3. Pulsa **Save** en cada una.

### 5. Redespliega

1. Ve a **Deployments → Redeploy** para que los cambios tomen efecto.
2. ¡Listo! Tu app está en línea.

---

## Uso

- **Ver datos:** cualquier persona con la URL puede ver las horas y pagos.
- **Editar:** pulsa el botón **Admin** arriba a la derecha, introduce usuario y contraseña.
- **Añadir día:** entra como admin → abre el trabajador → pulsa **+ Añadir día**.
- **Formato de horas:** usa H.MM (ej: `7.30` = 7h 30min, `8` = 8 horas exactas).

---

## Credenciales por defecto (cámbialas en Vercel)

```
Usuario:    capataz
Contraseña: Cuadrilla#2026!
```
