# MedVision AI

MedVision AI is an AI-assisted medical report management and clinical decision-support prototype for physician review of chest X-rays. It combines patient records, DenseNet121 multi-label classification, diagnosis history, and generated PDF reports in a role-protected workspace.

> **Medical disclaimer:** MedVision AI is not a medical device or a definitive diagnostic system. Model output is advisory, has not been presented here as clinically validated, and must be reviewed and interpreted by a qualified healthcare professional before any clinical decision.

## Objectives and features

- Secure physician login using JWT/OAuth2 password flow.
- Physician-owned patient records and diagnosis history.
- DenseNet121 classification across 14 chest X-ray conditions.
- Probability values, top predictions, positive findings, and an explicit human-in-the-loop disclaimer.
- Generated PDF reports for clinical review.
- Admin-only system dashboard, user/physician directory, patient overview, and diagnosis/report overview.
- Public, responsive landing page at `/` and protected application routes.

## Architecture

```text
React + Vite + Tailwind + Axios
              │ JWT Bearer requests
              ▼
FastAPI routers ── SQLAlchemy ── PostgreSQL
       │
       ├── DenseNet121 model service
       └── ReportLab PDF report service
```

Important directories:

- `backend/app/routers`: authentication, physician users/patients, diagnosis, and admin APIs.
- `backend/app/database`: SQLAlchemy models and database connection.
- `backend/app/services`: model inference and PDF generation.
- `backend/alembic/versions`: database migrations.
- `frontend/src/pages`: public, physician, and admin views.
- `frontend/src/components`: protected routing, sidebar, and reusable UI pieces.

## Model

The bundled DenseNet121 model performs multi-label chest X-ray classification for: Atelectasis, Cardiomegaly, Effusion, Infiltration, Mass, Nodule, Pneumonia, Pneumothorax, Consolidation, Edema, Emphysema, Fibrosis, Pleural Thickening, and Hernia. The prototype threshold remains `0.50`; it is not a clinically validated threshold.

## Roles and workflows

New registrations are assigned `PHYSICIAN`. Physicians can create and manage only their own patients, upload X-rays for those patients, view their own diagnoses/reports, and change their password. `ADMIN` is an existing database role and is required for `/admin/*`; administrative endpoints enforce this role on the backend and are not secured by frontend hiding alone.

Physician workflow: login → create/select patient → upload X-ray → review AI-assisted findings → inspect history → download report.

Admin workflow: login → system overview → search users → inspect all patients → inspect diagnoses and available reports.

## API overview

- `POST /auth/register`, `POST /auth/login`
- `GET /users/me`, `GET/POST /users/patients`, `GET /users/patients/{patient_id}`
- `PUT /users/me/password`
- `POST /diagnosis/upload`, `GET /diagnosis/dashboard-stats`, `GET /diagnosis/history`
- `GET /diagnosis/{diagnosis_id}`, `GET /diagnosis/report/{report_id}`
- `GET /admin/dashboard`, `/admin/users`, `/admin/patients`, `/admin/diagnoses`
- `GET /admin/patients/{patient_id}`, `GET /admin/diagnoses/{diagnosis_id}`
- `DELETE /admin/users/{user_id}`, `DELETE /admin/patients/{patient_id}` (administrator only)
- `GET /health`

Admin list endpoints accept `search`, optional filters, and `skip`/`limit` pagination parameters. They return 403 to authenticated non-admin users.

## Configuration

Create `backend/.env` (never commit it):

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=choose-a-secret-password
```

For a deployed frontend, set `frontend/.env`:

```env
VITE_API_URL=https://your-api.example.com
```

## Run locally

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

The frontend normally runs at `http://localhost:5173`; FastAPI runs at `http://127.0.0.1:8000`. Keep the model at `backend/models/MedVisionAI_DenseNet121_best.pth`.

Migration commands:

```powershell
cd backend
alembic current
alembic history
alembic upgrade head
```

After PostgreSQL is available, provision the fixed administrator with the deployment-controlled password:

```powershell
cd backend
$env:ADMIN_PASSWORD="admin1234"
python -m scripts.seed_admin
```

The administrator signs in with `admin@example.com` and that password. Admin registration is disabled, and the normal password-change endpoint rejects administrator accounts. Re-running the seed intentionally resets this deployment-managed credential.

## Testing and deployment notes

`npm run lint` and `npm run build` validate the frontend. Python sources can be checked with `python -m compileall -q app`; API smoke tests should run with a configured PostgreSQL database. Before deployment, provide a strong secret, production CORS origins, PostgreSQL connectivity, persistent storage for `uploads/` and `reports/`, and a production API URL. Do not expose password hashes, model secrets, or unrestricted file paths.
