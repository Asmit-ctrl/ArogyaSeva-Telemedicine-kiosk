# eArogyaSeva Telemedicine Kiosk Backend

Node.js + Express + MongoDB backend for the telemedicine kiosk workflow, now upgraded for MongoDB Atlas, OpenAI-based triage, and Twilio video-room token generation.

## Features Implemented

- Patient kiosk intake with mobile-based lookup/upsert
- AI-assisted symptom triage with rule-based emergency overrides
- Doctor allocation by specialty, language, wait time, and rating
- Vitals capture and consultation-room creation
- Twilio video access token generation for live consultation rooms
- Centralized consultation history, vitals, and prescription retrieval
- Kiosk device tracking (register, list, heartbeat)
- JWT authentication with roles: patient, doctor, admin

## Integration Notes

- MongoDB Atlas: set `MONGO_URI` to your `mongodb+srv://...` connection string
- OpenAI: set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`
- Twilio Video: set `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, and `TWILIO_API_SECRET`
- If OpenAI or Twilio credentials are absent, the kiosk still works with rule-based triage and local camera preview fallback

## Folder Structure

```text
backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── config/
├── server.js
└── package.json
```

## Setup (Local)

1. Install Node.js
2. Create `.env` from `.env.example`
3. Add your MongoDB Atlas, OpenAI, and Twilio credentials
4. Install dependencies and start server

```bash
cd backend
npm install
npm start
```

Server URL: `http://localhost:5000`

## Main Endpoints

### Kiosk Flow
- `POST /api/kiosk-flow/intake`
- `POST /api/kiosk-flow/triage`
- `GET /api/kiosk-flow/patients/:patientId/records`
- `GET /api/kiosk-flow/consultations/:consultationId`
- `POST /api/kiosk-flow/consultations/:consultationId/complete`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Patients
- `POST /api/patients/register`
- `GET /api/patients`
- `GET /api/patients/:id`

### Doctors
- `POST /api/doctors/register`
- `GET /api/doctors`
- `GET /api/doctors/:id`

### Vitals
- `POST /api/vitals`
- `GET /api/vitals/:patientId`

### Consultations
- `POST /api/consultations/start`
- `POST /api/consultations/end`
- `GET /api/consultations`

### Prescriptions
- `POST /api/prescriptions`
- `GET /api/prescriptions/:patientId`

### Kiosks
- `POST /api/kiosks/register`
- `GET /api/kiosks`
- `GET /api/kiosks/:kioskId`
- `PATCH /api/kiosks/:kioskId/ping`

### Video
- `POST /api/video/start`
- `GET /api/video/status`
