# SAI Logistics – Full Stack Website
## How to Run

1. Install **Node.js version 22.13 or later** from https://nodejs.org (LTS or Current). Check your installed version using:

   ```bash
   node -v
   ```

2. Open a terminal in this project folder and run:

   ```bash
   node server.js
   ```

   (No `npm install` is required. There are no extra packages to install.)

3. Open your browser and visit:

   http://localhost:3000

## Pages

| Route | Description |
|---|---|
| `/` | Homepage (your original design) |
| `/services.html` | Services page, loaded from the database |
| `/contact.html` | Contact / quote request form, with submissions saved to the database |
| `/admin` | Admin panel to view inquiries, update their status, and delete them |

## Admin Password

The default admin password is `admin123`.

**Make sure to change it before deploying the application to a live server.**

- **Windows (PowerShell):**

  ```powershell
  $env:ADMIN_PASSWORD="your-strong-password"; node server.js
  ```

- **Mac / Linux:**

  ```bash
  ADMIN_PASSWORD="your-strong-password" node server.js
  ```

To change the port, set the `PORT` environment variable in the same way. For example, to use port `8080`:

```bash
PORT=8080 node server.js
```

If you need to set both the admin password and the port, configure both environment variables before starting the server.

## Folder Structure

```text
server.js      Backend: API, static files, and admin login
db.js          Database tables and initial service data
data/sai.db    Database file (created automatically on first run)
public/        Frontend files: index.html, style.css, app.css,
               contact.html, services.html, admin.html
```

## API Endpoints

- `GET /api/services` — Returns the list of services.
- `POST /api/inquiries` — Saves contact form submissions with validation and spam protection.
- `POST /api/admin/login` — Admin login.
- `POST /api/admin/logout` — Admin logout.
- `GET /api/admin/inquiries?status=new|contacted|closed` — Retrieves inquiries, optionally filtered by status.
- `PATCH /api/admin/inquiries/:id` — Updates the status of an inquiry.
- `DELETE /api/admin/inquiries/:id` — Deletes an inquiry.

## Database Backup

All application data is stored in a single file:

```text
data/sai.db
```

To back up your data, simply make a copy of this file.

**Important:** Stop the server before copying the database file to help ensure that the backup is consistent.

## Live Hosting / Deployment

This application can run on a Node.js hosting platform or VPS, such as Render or Railway.

Before deploying to production, make sure to:

1. **Set a strong admin password:** Configure the `ADMIN_PASSWORD` environment variable. Never use the default password in production.
2. **Enable HTTPS:** Use HTTPS through your hosting provider or configure it with Nginx or Cloudflare. HTTPS is essential for protecting admin login credentials and data in transit.
3. **Configure persistent storage:** Ensure the `data/` directory is stored on a persistent disk or volume. Otherwise, the database may be lost when the hosting platform restarts or redeploys the application.
4. **Verify production settings:** Confirm that the `PORT` environment variable is configured correctly and that the application works as expected in the production environment.

