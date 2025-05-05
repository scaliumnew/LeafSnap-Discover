# LeafSnap Discover

A plant species identification application built with React and Python. This application allows users to take photos of plants and identify their species using machine learning.

## Features

- Real-time camera capture
- Plant species identification
- Detailed plant information display
- Responsive design
- Cross-platform compatibility

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
- Backend:
  - Python
  - Flask
  - Machine Learning models for plant identification

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- pip

### Integrated Setup (Recommended)

Run both frontend and backend servers with a single command:

```bash
# Install dependencies
npm install
pip install -r plant-species-recognition/requirements.txt

# Start both servers together
npm run start
```

This will start:
- The frontend on http://localhost:8080
- The backend on http://localhost:8000
- All API calls will be proxied automatically

### Separate Setup (Alternative)

If you prefer to run the servers separately:

#### Frontend Setup

1. Navigate to the project directory:
   ```bash
   cd leaf-snap-discover-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd plant-species-recognition/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask server:
   ```bash
   python app.py
   ```

## Usage

1. Open the application in your browser at http://localhost:8080
2. Allow camera access when prompted
3. Point your camera at a plant
4. Click the capture button
5. View the identification results and plant information

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
