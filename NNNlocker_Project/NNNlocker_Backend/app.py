import os
import sqlite3
import requests
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATABASE = 'nnnlocker.db'

# --- Database Functions ---

def get_db():
    """
    Connects to the specific database.
    'g' is a special Flask object that is unique for each request.
    """
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row # Allows accessing columns by name
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Closes the database connection at the end of the request."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """
    Initializes the database and creates the tables.
    """
    print("--- Initializing Database... ---")
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()
    print("--- Database Initialized Successfully. ---")
    print(f"--- '{DATABASE}' file created. ---")


# --- NEW FIX: FLASK CLI COMMAND ---
@app.cli.command('init-db')
def init_db_command():
    """Creates the database tables. Run this with `flask init-db`"""
    init_db()
    print('Initialized the database.')

# --- API Endpoints ---

@app.route('/get-stats', methods=['GET'])
def get_stats():
    """
    Fetches the current streak, total fails, and chart data.
    """
    conn = get_db()
    
    # Get current streak and fail count
    # We add an error check in case the table is empty
    profile = conn.execute('SELECT streak_days, fail_count FROM user_profile WHERE id = 1').fetchone()
    
    if profile is None:
        # This is a fallback for the very first run
        return jsonify({
            "streakDays": 0,
            "failCount": 0,
            "chart": {"labels": [], "data": []}
        })

    # Get chart data (fails per day for the last 7 days)
    rows = conn.execute('''
        SELECT 
            DATE(timestamp) as date, 
            COUNT(*) as fails
        FROM 
            fail_events
        WHERE 
            timestamp >= DATE('now', '-7 days')
        GROUP BY 
            date
        ORDER BY 
            date
    ''').fetchall()

    chart_labels = [row['date'] for row in rows]
    chart_data = [row['fails'] for row in rows]

    return jsonify({
        "streakDays": profile['streak_days'],
        "failCount": profile['fail_count'],
        "chart": {
            "labels": chart_labels,
            "data": chart_data
        }
    })

@app.route('/fail-event', methods=['POST'])
def log_fail_event():
    """
    Logs a fail event and resets the streak.
    """
    conn = get_db()
    conn.execute('BEGIN')
    try:
        # Log the specific event
        conn.execute('INSERT INTO fail_events (reason, video_url) VALUES (?, ?)', 
                     ('User manual fail report', request.json.get('video_url', '')))
        
        # Update the user_profile (reset streak, increment fail count)
        conn.execute('''
            UPDATE user_profile 
            SET 
                streak_days = 0, 
                fail_count = fail_count + 1 
            WHERE 
                id = 1
        ''')
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error logging fail event: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    
    return jsonify({"status": "success", "message": "Fail event logged"}), 201

@app.route('/log-success', methods=['POST'])
def log_success():
    """
    Increments the user's streak.
    """
    conn = get_db()
    try:
        conn.execute('''
            UPDATE user_profile 
            SET 
                streak_days = streak_days + 1 
            WHERE 
                id = 1
        ''')
        conn.commit()
    except Exception as e:
        print(f"Error logging success: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
        
    return jsonify({"status": "success", "message": "Streak updated"}), 201

# --- AI Coach Endpoint (Ollama) ---

@app.route('/coach/message', methods=['POST'])
def coach_message():
    """
    Endpoint for the AI Accountability Coach, using a local Ollama server.
    """
    data = request.get_json()
    if not data or 'user_input' not in data:
        return jsonify({"error": "Missing user_input"}), 400

    user_input = data.get("user_input")
    streak = data.get("streak", 0)
    
    # System prompt to guide the AI
    system_prompt = "You are a supportive but assertive accountability coach. A user is on a focus and discipline challenge. Respond to their message in 2-3 concise sentences. Give them a short, actionable tip. Do not be overly friendly."
    
    # Ollama's API endpoint (runs on http://127.0.0.1:11434 by default)
    OLLAMA_URL = "http://127.0.0.1:11434/api/chat"

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": "llama3.1:8b", # The model you downloaded
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"I'm on a {streak}-day streak. {user_input}"}
            ],
            "stream": False
        })
        
        response.raise_for_status() # Raise an exception for bad status codes
        ollama_data = response.json()
        
        coach_reply = ollama_data.get('message', {}).get('content', "I'm processing that. Stay strong.")

        return jsonify({"coach_reply": coach_reply})

    except requests.exceptions.ConnectionError:
        print("--- OLLAMA CONNECTION ERROR ---")
        return jsonify({
            "coach_reply": "I can't connect to the AI. Is the Ollama server running?"
        })
    except Exception as e:
        print(f"--- OLLAMA ERROR: {e} ---")
        return jsonify({
            "coach_reply": "I had an error processing that. Let's just refocus. What's your next small step?"
        })

# --- Database Schema File ---
# We need a schema.sql file for the init_db function to read.
# I will create this file for you.

