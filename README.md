# NNNLocker
NNNlocker v1.0

“Stay focused, stay strong — because willpower deserves a dashboard.”

NNNlocker is a local-first self-accountability system designed to help you build focus and discipline. It combines a daily tracker, a willpower analytics dashboard, and an AI-powered accountability partner to help you stay on track.

This project is built in three main parts:

React Frontend: The main dashboard you see and interact with.

Flask Backend: A Python server that manages your database and connects to the AI.

Ollama (Local AI): A local AI model that runs as your accountability coach, ensuring 100% privacy.

How to Run NNNlocker

You will need three separate terminals running at the same time for the app to function fully.

Prerequisites

Node.js: For the React frontend. Download from nodejs.org.

Python: For the Flask backend. Download from python.org.

Ollama: For the AI Coach. Download from ollama.com.

Step 1: Install and Run the AI (Ollama)

This is your local, private AI accountability coach. You only need to do this setup once.

Install Ollama on your computer.

Open a new terminal and run the following command to download the AI model:

ollama run llama3.1:8b


After the model downloads and you see a prompt like >>> Send a message..., you can close this terminal. Ollama will continue running in the background.

Step 2: Run the Backend (Flask Server)

This server is the "brain" that connects to your database and the AI.

Open your first terminal window.

Navigate to the backend folder:

cd path/to/NNNlocker_Project/NNNlocker_Backend


Create and activate a Python virtual environment:

# Create the environment (only once)
python -m venv venv

# Activate the environment (every time you start)
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate


Install the required packages:

pip install -r requirements.txt


Initialize the Database (One-Time Setup):
Run this command once to create your nnnlocker.db file and all the tables:

flask init-db


You should see it print Initialized the database.

Run the Server:
Now, start the backend server:

flask run


You will see it running on http://127.0.0.1:5000. Leave this terminal running.

Step 3: Run the Frontend (React App)

This is the dashboard you will see in your browser.

Open a second, new terminal window. (Keep the first one running!)

Navigate to the frontend folder:

cd path/to/NNNlocker_Project/nnnlocker-frontend


Install Packages (One-Time Setup):
If you haven't already, install the required node modules:

npm install


Run the App:

npm run dev


Your default browser will automatically open to the app (e.g., http://localhost:5173).

You now have the full NNNlocker application running!

(Optional) Step 4: Load the Chrome/Edge Extension

This extension (from the PRD) detects distracting sites.

Open your browser (Chrome or Edge).

Go to the extensions page:

Edge: edge://extensions

Chrome: chrome://extensions

Turn on "Developer mode" (usually a toggle in the corner).

Click the "Load unpacked" button.

Select the NNNlocker_Project/NNNlocker_Extension folder.

The "NNNlocker Companion" extension is now active.
