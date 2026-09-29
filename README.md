# OA Sathi — Osteoarthritis Support Platform

This repository contains the OA Sathi frontend and API backend, including the sensor inference service and model artifacts supplied in the project bundle.

## Repository layout

- `frontend/` — React + Vite client
- `backend/` — Node.js API, SQL schema, sensor inference service and supplied model files

## Local setup

1. Install Node.js (LTS) and Python 3.10+ (for the sensor service).
2. In `backend/`, copy `.env.example` to `.env` and set local database and service settings.
3. In `frontend/`, copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the backend API URL.
4. Install dependencies with `npm install` in each Node project and follow `backend/README.md` for database and sensor setup.

Never commit real credentials, patient data, or local `.env` files. The provided frontend `.env` was excluded; the `.env.example` templates are retained.

## Deployment note

The frontend and backend are separate services. Deploy the frontend with `frontend/` as its root directory and deploy the API/sensor components to an environment that supports their runtime and database. Verify the gait and X-ray model endpoints and configure environment variables before presenting the service as production-ready.
