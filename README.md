# SAI Logistics – Full Stack Website

Frontend (HTML/CSS) + Backend (Node.js) + Database (SQLite).

## Chalavvu kevi rite

1. **Node.js 22.13 ke tena karta navi version** install karo: https://nodejs.org (LTS ke Current). Check: `node -v`
2. Aa folder ma terminal kholo ane lakho:

   ```
   node server.js
   ```
   (npm install ni jarur nathi, koi extra package nathi.)
3. Browser ma kholo: http://localhost:3000

## Pages

| Address | Shu che |
|---|---|
| `/` | Homepage (tamari original design) |
| `/services.html` | Services, database ma thi load thay che |
| `/contact.html` | Contact / quote form, database ma save thay che |
| `/admin` | Admin panel: inquiries jovi, status badalvo, delete karvi |

## Admin password

Default password `admin123` che. **Live karva pehla jarur badlo:**

- Windows (PowerShell): `$env:ADMIN_PASSWORD="tamaro-majboot-password"; node server.js`
- Mac / Linux: `ADMIN_PASSWORD="tamaro-majboot-password" node server.js`

Port badalvo hoy to `PORT=8080` pan aaj rite set thay.

## Folder structure

```
server.js      backend: API + static files + admin login
db.js          database tables ane services nu seed data
data/sai.db    database file (pehli var chalavta automatic bane che)
public/        frontend: index.html, style.css, app.css, contact.html, services.html, admin.html
```

## API

- `GET  /api/services` – services ni list
- `POST /api/inquiries` – form save (validation + spam protection sathe)
- `POST /api/admin/login`, `POST /api/admin/logout`
- `GET  /api/admin/inquiries[?status=new|contacted|closed]`
- `PATCH /api/admin/inquiries/:id` – status badalvo
- `DELETE /api/admin/inquiries/:id`

## Backup

Badho data `data/sai.db` ek file ma che. Tena copy lai lo etle backup thai gayo.

## Live hosting mate

Aa server koi VPS / Render / Railway jeva Node hosting par chale che. Live karta pehla:
1. `ADMIN_PASSWORD` jarur set karo.
2. HTTPS vapro (hosting provider ke Nginx/Cloudflare thi) – admin login mate jaruri che.
3. Hosting ma `data/` folder permanent storage ma hovo joie, nahi to database delete thai jashe.
