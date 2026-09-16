# Campus Lost & Found — API Documentation

Base URL (local development): `http://127.0.0.1:8000/api`

All request/response bodies are JSON, except `POST`/`PUT` with an image file,
which should be sent as `multipart/form-data`.

---

## Item object

```json
{
  "id": 1,
  "item_name": "Black Dell Laptop",
  "category": "Electronics",
  "status": "Lost",
  "location": "Computer Science Lab, Block C",
  "date": "2026-09-01",
  "description": "14-inch Dell Inspiron with a college sticker on the lid.",
  "contact_name": "Arjun Kumar",
  "contact_email": "arjun.kumar@college.edu",
  "image": null,
  "created_at": "2026-09-16T15:12:43.669607+05:30"
}
```

`category` choices: `Electronics`, `Documents`, `Accessories`,
`Books & Stationery`, `Clothing`, `Bags`, `ID Cards`, `Keys`, `Other`

`status` choices: `Lost`, `Found`

---

## Endpoints

### `GET /api/items/`
List items. Supports pagination, search, filtering, and ordering.

**Query parameters**

| Param | Example | Description |
|---|---|---|
| `search` | `?search=laptop` | Case-insensitive search across `item_name`, `description`, `location` |
| `category` | `?category=Electronics` | Exact match (case-insensitive) |
| `status` | `?status=Lost` | `Lost` or `Found` |
| `date_from` | `?date_from=2026-09-01` | Items on/after this date |
| `date_to` | `?date_to=2026-09-15` | Items on/before this date |
| `ordering` | `?ordering=-date` | `date`, `-date`, `created_at`, `-created_at`, `item_name` |
| `page` | `?page=2` | Page number |
| `page_size` | `?page_size=20` | Items per page (default 12, max 100) |

**Response `200 OK`**
```json
{
  "count": 12,
  "next": "http://127.0.0.1:8000/api/items/?page=2",
  "previous": null,
  "results": [ { "...item object..." } ]
}
```

---

### `POST /api/items/`
Create a new item. Send as `application/json` (no image) or
`multipart/form-data` (with an image file under the `image` field).

**Request body**
```json
{
  "item_name": "Blue Water Bottle",
  "category": "Other",
  "status": "Found",
  "location": "Library, 2nd floor",
  "date": "2026-09-03",
  "description": "Steel bottle with a dent on the base.",
  "contact_name": "Priya Raj",
  "contact_email": "priya.raj@college.edu"
}
```

**Response `201 Created`**
```json
{
  "success": true,
  "message": "Item reported successfully.",
  "data": { "...item object..." }
}
```

**Response `400 Bad Request`** (validation failed)
```json
{
  "success": false,
  "errors": {
    "contact_email": ["Enter a valid email address."],
    "status": ["Status must be one of ['Lost', 'Found']."]
  }
}
```

---

### `GET /api/items/{id}/`
Retrieve a single item.

**Response `200 OK`**
```json
{ "success": true, "data": { "...item object..." } }
```

**Response `404 Not Found`** — item does not exist.

---

### `PUT /api/items/{id}/`
Replace an item's fields (all required fields must be sent).

**Response `200 OK`**
```json
{
  "success": true,
  "message": "Item updated successfully.",
  "data": { "...item object..." }
}
```

**Response `400 Bad Request`** — same shape as create validation errors.

### `PATCH /api/items/{id}/`
Partially update an item (only send the fields you want to change).
Same response shape as `PUT`.

---

### `DELETE /api/items/{id}/`
Delete an item permanently.

**Response `200 OK`**
```json
{ "success": true, "message": "\"Blue Water Bottle\" was deleted successfully." }
```

**Response `404 Not Found`** — item does not exist.

---

## Validation rules

| Field | Rule |
|---|---|
| `item_name` | Required, non-empty |
| `category` | Required, must be one of the defined choices |
| `status` | Required, must be `Lost` or `Found` |
| `location` | Required, non-empty |
| `date` | Required, cannot be a future date |
| `contact_name` | Required, non-empty |
| `contact_email` | Required, must be a valid email address |
| `description`, `image` | Optional |

All validation errors are returned together in a single `400` response under
the `errors` key, keyed by field name, so the frontend can highlight every
invalid field at once.

---

## Example requests (curl)

```bash
# List all Lost items, newest first
curl "http://127.0.0.1:8000/api/items/?status=Lost&ordering=-date"

# Search
curl "http://127.0.0.1:8000/api/items/?search=id+card"

# Create
curl -X POST "http://127.0.0.1:8000/api/items/" \
  -H "Content-Type: application/json" \
  -d '{"item_name":"Umbrella","category":"Other","status":"Lost","location":"Gate 1","date":"2026-09-10","contact_name":"Tester","contact_email":"tester@college.edu"}'

# Update
curl -X PUT "http://127.0.0.1:8000/api/items/1/" \
  -H "Content-Type: application/json" \
  -d '{"item_name":"Black Dell Laptop","category":"Electronics","status":"Found","location":"CS Lab","date":"2026-09-01","contact_name":"Arjun Kumar","contact_email":"arjun.kumar@college.edu"}'

# Delete
curl -X DELETE "http://127.0.0.1:8000/api/items/1/"
```
