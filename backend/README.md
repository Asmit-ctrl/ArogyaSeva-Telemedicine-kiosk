# eArogyaSeva Telemedicine Kiosk Backend

Node.js + Express + MongoDB backend for local development of core telemedicine kiosk workflows.

## Features Implemented

- Patient registration and listing
- Doctor registration and listing
- Vitals data storage and retrieval
- Consultation start/end and listing
- Digital prescription creation and retrieval by patient
- Kiosk device tracking (register, list, heartbeat)
- JWT authentication with roles: patient, doctor, admin
- Local MongoDB storage

## Coming Soon Placeholders

- Video consultation API placeholders under `/api/video/*`
- Cloud deployment
- File upload/storage for reports
- SMS notifications
- AI diagnosis

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

1. Install Node.js and MongoDB
2. Start local MongoDB service
3. Create `.env` from `.env.example`
4. Install dependencies and start server

```bash
cd backend
npm install
npm start
```

Server URL: `http://localhost:5000`

## Main Endpoints

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

### Video (Coming Soon)
- `POST /api/video/start`
- `GET /api/video/status`
