# Client Flow

Client Flow es una aplicación diseñada para gestionar clientes y automatizar el registro de pagos pendientes de cobro de manera mensual. Construida con AdonisJS versión 7, utiliza SQLite como base de datos y está preparada para ejecutarse con Node.js versión 22.0.0.

## Requisitos previos

- **Node.js**: Asegúrate de tener instalada la versión 22.0.0 de Node.js. Puedes verificar tu versión actual con:

  ```bash
  node -v
  ```

  Si necesitas instalar o actualizar Node.js, descárgalo desde la [página oficial](https://nodejs.org/).

- **npm**: Viene incluido con Node.js. Verifica su versión con:

  ```bash
  npm -v
  ```

- **SQLite**: Esta aplicación utiliza SQLite como base de datos.

## Instalación

1. **Clona el repositorio**:

   ```bash
   git clone https://github.com/jhonriv/client-flow.git
   cd client-flow
   ```

2. **Instala las dependencias**:

   ```bash
   npm install
   ```

3. **Configura las variables de entorno**:

   Copia el archivo de ejemplo `.env.example` y renómbralo a `.env`.

   ```bash
   cp .env.example .env
   ```

   Asegúrate de que las configuraciones en `.env` sean correctas, especialmente las relacionadas con la base de datos SQLite.

## Uso de SQLite

La aplicación está configurada para utilizar SQLite como base de datos por defecto. No se requiere configuración adicional si estás utilizando SQLite. Asegúrate de que el archivo de base de datos (`database.sqlite`) esté presente en la carpeta `database` o que la configuración en el archivo `.env` apunte correctamente a su ubicación.

## Migraciones de base de datos

Antes de ejecutar la aplicación, es necesario ejecutar las migraciones para configurar las tablas de la base de datos:

```bash
node ace migration:run
```

## Ejecución de la aplicación

Una vez configurada la base de datos y ejecutadas las migraciones, inicia el servidor de desarrollo:

```bash
node ace serve --watch
```

La aplicación estará disponible en `http://localhost:3333`.

## Tareas programadas

Client Flow está diseñada para ejecutar tareas programadas que registran automáticamente los pagos pendientes de cobro mensualmente. Estas tareas se configuran utilizando `node-cron` y se ejecutan según la programación definida en el código. No se requiere configuración adicional para esta funcionalidad.

## Contribuciones

Si deseas contribuir al desarrollo de Client Flow, por favor, realiza un fork del repositorio, crea una rama con tus cambios y envía un pull request para su revisión.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

Para más información o soporte, por favor, contacta al desarrollador principal.
