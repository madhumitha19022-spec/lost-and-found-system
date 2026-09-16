# Campus Lost & Found

A full-stack Lost & Found Management System for a college campus. Students and
staff can report lost items, register found items, browse/search/filter all
reports, and edit or delete their own entries.

- **Frontend:** HTML, CSS, vanilla JavaScript (no build step, no framework)
- **Backend:** Django REST Framework
- **Database:** SQLite
- **API style:** REST (JSON), with image upload support

```
campus-lost-found/
├── backend/                 Django REST Framework project
│   ├── lostfound/           Project settings, urls, wsgi/asgi
│   ├── items/                App: model, serializer, views, filters, tests
│   │   └── management/commands/load_sample_data.py
│   ├── media/                Uploaded item photos (created at runtime)
│   ├── db.sqlite3            SQLite database (created by migrate)
│   ├── manage.py
│   └── requirements.txt
├── frontend/                 Static frontend (served independently)
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── API_DOCUMENTATION.md
└── README.md
```

---

## 1. Prerequisites

- Python 3.10+
- pip
- A modern web browser
- (Optional) Git, if you want to version-control the project

---

## 2. Backend setup (Django REST Framework)

```bash
cd campus-lost-found/backend

# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply database migrations (creates db.sqlite3)
python manage.py migrate

# 4. (Optional but recommended) Load sample data for testing
python manage.py load_sample_data

# 5. (Optional) Create an admin user for the Django admin panel
python manage.py createsuperuser

# 6. Run the development server
python manage.py runserver
```

The API is now live at **http://127.0.0.1:8000/api/items/**
The Django admin panel is at **http://127.0.0.1:8000/admin/**

To wipe and reload sample data at any point:

```bash
python manage.py load_sample_data --clear
```

To run the backend test suite:

```bash
python manage.py test items
```

---

## 3. Frontend setup

The frontend is static (no build tools needed). It calls the API at
`http://127.0.0.1:8000/api` by default — see `frontend/js/app.js`, line 7
(`const API_BASE = ...`) if your backend runs elsewhere.

Serve it with any static file server, for example:

```bash
cd campus-lost-found/frontend
python -m http.server 5500
```

Then open **http://127.0.0.1:5500** in your browser.

> You can also just double-click `frontend/index.html` to open it directly in
> a browser. Since CORS is enabled on the backend (`CORS_ALLOW_ALL_ORIGINS =
> True` in `settings.py`, for local development), the frontend can reach the
> API either way as long as the Django server is running.

---

## 4. Using the app

- **Home** — landing page with an overview and live stats.
- **Report Lost** — form to report something you lost.
- **Report Found** — form to register something you found.
- **Browse Items** — search by item name, filter by category/status, sort by
  date, switch between card and table view, edit or delete any item.
- **About** — project info.

All create/update/delete actions show a success or error toast, and deleting
an item asks for confirmation first.

---

## 5. Database model

`items.Item`:

| Field          | Type                          | Notes                              |
|----------------|--------------------------------|-------------------------------------|
| id             | AutoField (PK)                | |
| item_name      | CharField(150)                 | required |
| category       | CharField, choices             | Electronics, Documents, Accessories, Books & Stationery, Clothing, Bags, ID Cards, Keys, Other |
| status         | CharField, choices             | `Lost` or `Found` |
| location       | CharField(150)                 | required |
| date           | DateField                      | required, cannot be in the future |
| description    | TextField                      | optional |
| contact_name   | CharField(100)                 | required |
| contact_email  | EmailField                     | required, validated |
| image          | ImageField                     | optional |
| created_at     | DateTimeField (auto_now_add)   | set automatically |

See `API_DOCUMENTATION.md` for full endpoint details.

---

## 6. Notes on configuration

- `SECRET_KEY` and `DEBUG=True` in `backend/lostfound/settings.py` are set
  for **local development only**. Change these before any real deployment.
- CORS is wide open (`CORS_ALLOW_ALL_ORIGINS = True`) to keep local setup
  simple — restrict `CORS_ALLOWED_ORIGINS` before deploying.
- Uploaded images are stored under `backend/media/items/` and served at
  `/media/...` while `DEBUG=True`.

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| Frontend shows "Could not reach the server" | Make sure `python manage.py runserver` is running and `API_BASE` in `app.js` matches its address. |
| `ModuleNotFoundError: No module named 'rest_framework'` | Activate your virtualenv and re-run `pip install -r requirements.txt`. |
| CORS errors in the browser console | Confirm `corsheaders` is in `INSTALLED_APPS` and `CorsMiddleware` is near the top of `MIDDLEWARE` (already configured by default). |
| Images not showing | Confirm `Pillow` is installed and the backend server (not just the frontend) is running, since images are served from it. |
