# LeafSnap Discover - Starting the Application

This document explains how to start the LeafSnap Discover application with both frontend and backend servers running together.

## Quick Start Guide

### 1. Run everything with a single command

```bash
npm run start
```

This command will start both:
- The backend Flask server on http://localhost:8000
- The frontend Vite server on http://localhost:8080

Both logs will appear in the same terminal window with color coding to distinguish them. Press Ctrl+C to shut down both servers.

### 2. For developers (running separately)

If you need to run the servers separately:

#### Start the backend server:
```bash
cd plant-species-recognition/backend
python app.py
```

#### Start the frontend server:
```bash
npm run dev
```

## How It Works

The project uses Vite's proxy configuration to direct API requests from the frontend to the backend server. This means:

1. The frontend makes requests to `/api/...` and `/predict`
2. Vite's development server automatically forwards these requests to the backend server at http://localhost:8000
3. You only need to interact with http://localhost:8080 in your browser

## Troubleshooting

If you encounter any issues:

1. Make sure Python and all required dependencies are installed:
   ```bash
   pip install -r plant-species-recognition/requirements.txt
   ```

2. Make sure Node.js dependencies are installed:
   ```bash
   npm install
   ```

3. Check that port 8000 is not already in use by another application
   - If needed, you can modify the port in the backend app.py file

4. Check that port 8080 is not already in use
   - If needed, you can modify the port in vite.config.ts 