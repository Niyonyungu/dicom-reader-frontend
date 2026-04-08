# Backend Local Setup (No Docker)

This guide shows how to run the backend locally on your computer without Docker. It is written for beginners and includes exact commands for Windows PowerShell.

## 1. Prerequisites

- Install Python 3.11 or newer from https://www.python.org/downloads/
- During installation, check **Add Python to PATH**
- Install Git if you need to clone or manage code: https://git-scm.com/downloads

## 2. Locate or create the backend folder

Your backend should be in a folder named `dicom-reader-backend` inside the repository root.

If that folder does not exist yet, create it:

```powershell
cd D:\dicom-reader-frontend
mkdir dicom-reader-backend
cd dicom-reader-backend
```

If you already have backend code, open PowerShell in that folder.

## 3. Create a Python virtual environment

A virtual environment keeps backend packages separate from other projects.

```powershell
cd D:\dicom-reader-frontend\dicom-reader-backend
python -m venv venv
```

## 4. Activate the environment

```powershell
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks execution, use this command once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then activate again:

```powershell
.\venv\Scripts\Activate.ps1
```

## 5. Install backend dependencies

Make sure you have a `requirements.txt` file in the backend folder.

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If `requirements.txt` is not present, you will need it from the backend project or the implementation instructions.

## 6. Create the environment configuration file

Copy the example environment file and open it for editing:

```powershell
Copy-Item .env.example .env
notepad .env
```

### Example local settings

In `.env`, use a simple SQLite database for development:

```text
DATABASE_URL=sqlite:///./dev.db
```

If your backend needs other values, set them in the `.env` file as required.

## 7. Run database migrations

This creates the local database schema.

```powershell
python -m alembic upgrade head
```

If migrations are not available, skip this step and use the database file directly.

## 8. Start the backend server

Run the backend locally:

```powershell
uvicorn app.main:app --reload --port 8000
```

Your backend should now be available at:

```text
http://localhost:8000
```

Open the interactive API docs in your browser:

```text
http://localhost:8000/docs
```

## 9. Optional: Run background tasks (Celery)

If the backend uses Celery, open a second terminal and run:

```powershell
cd D:\dicom-reader-frontend\dicom-reader-backend
.\venv\Scripts\Activate.ps1
celery -A app.tasks.celery_app worker -l info
```

This is only needed if the project uses Celery for asynchronous work.

## 10. Connect the frontend

In your frontend project, set the backend URL to:

```text
http://localhost:8000
```

If the frontend has an `.env` file, update any backend API base URL settings there.

## 11. Troubleshooting

- If `python` is not found, make sure Python is installed and added to PATH.
- If `uvicorn` is not found, make sure the virtual environment is activated and dependencies are installed.
- If `.env.example` is missing, ask for the backend config file or use a simple `.env` with `DATABASE_URL`.
- If migrations fail, check the backend folder for `alembic.ini` and the `alembic` directory.

## 12. If you want Docker later

You do not need Docker now. This file is for local development only.

If you want to use Docker later, use the `docker-compose.yml` and `Dockerfile` in the backend project, but only after the local setup is working.
