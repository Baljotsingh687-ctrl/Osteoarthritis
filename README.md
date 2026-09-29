# OA Sathi frontend

Configured for the supplied OA-backend-main API.

## Local connection\n1. Start the OA Sathi backend and PostgreSQL using the backend project's setup instructions.\n2. Keep `VITE_API_BASE_URL=http://localhost:4000/api` in frontend `.env` for local development.\n3. Run `npm install` and `npm run dev` in this frontend folder.\n4. Open the Vite URL (usually `http://localhost:5173`).\n\nFor deployment, set `VITE_API_BASE_URL` to the public HTTPS backend API URL and configure backend CORS for the frontend origin.\n\n## Auth
The supplied backend uses its own JWT auth (`POST /api/auth/register`, `POST /api/auth/login`) with email/password. This frontend no longer uses Supabase Auth or SMS OTP.

## API
Set `VITE_API_BASE_URL`, defaulting to `http://localhost:4000/api`. The frontend sends the backend JWT as `Authorization: Bearer ...`.

## ML ownership
The frontend never calls gait, sensor, or X-ray ML services directly. It sends the gait video/X-ray image to the backend; the backend calls the configured model services and stores the result.

## Screening permissions
The supplied backend protects assessments, gait, sensor, X-ray, and risk endpoints with `requireHealthWorker`. Therefore this frontend makes the patient dashboard read-only and routes actual screening through healthcare-worker intake.
