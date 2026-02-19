# Sampark Clone

A privacy-focused vehicle tagging and communication system built with React Native (Expo) and Node.js.

## Features

- **Authentication**: Phone number OTP login flow.
- **Home Dashboard**: View registered tags, quick actions, and recent activity.
- **Tag Management**: Register new tags (mock NFC/Manual), toggle privacy settings (masked call, WhatsApp).
- **Shop**: Browse and buy new tags/stickers.
- **Public Scan**: Scan a tag code to contact the vehicle owner without revealing numbers.
- **Theme**: Dark/Light mode support with glassmorphism UI.

## Project Structure

- `app/`: Expo Router screens.
- `components/`: Reusable UI components.
- `store/`: Zustand state management (Auth, Tag, Shop, Theme).
- `backend/`: Node.js Express server with MongoDB.

## Getting Started

### Prerequisites

- Node.js installed.
- MongoDB installed locally or a cloud URI.
- Expo Go app on your phone.

### 1. Backend Setup

Open a terminal in the `backend` folder:

```bash
cd backend
npm install
# Ensure MongoDB is running locally
npm run dev
```

The server runs on `http://localhost:5000`.

### 2. Frontend Setup

Open a new terminal in the root folder:

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android/iOS).

### Important Note

- The app connects to the backend at `http://10.0.2.2:5000` (Android Emulator) or `http://localhost:5000` (iOS Simulator). 
- If running on a physical device, update `services/api.ts` with your machine's local IP address (e.g., `http://192.168.1.X:5000`).

## Usage

1. **Login**: Enter any 10-digit phone number. OTP is mocked (any 6 digits work, or check console/alert).
2. **Register Tag**: Go to "Add New" -> Enter details. Mock NFC tap available.
3. **Public Scan**: To simulate a scan, navigate to `sampark://scan/TAG-123` or use the in-app navigation if available (currently simulated via URL scheme or deep link).
# CarCard
