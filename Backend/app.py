from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import requests
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")}})

db = SQLAlchemy(app)

class Session(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.Column(db.JSON)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        session_id = data.get('session_id')
        messages = data.get('messages', [])
        
        if not messages:
            return jsonify({'error': 'No messages provided'}), 400

        app.logger.debug(f"Received request with session_id: {session_id} and messages: {messages}")

        # Create new session if none provided
        if not session_id:
            new_session = Session(id=str(uuid.uuid4()), messages=messages)
            db.session.add(new_session)
            try:
                db.session.commit()
                session_id = new_session.id
                app.logger.debug(f"Created new session: {session_id}")
            except Exception as db_error:
                app.logger.error(f"Database error: {str(db_error)}")
                return jsonify({'error': 'Failed to create session'}), 500
        else:
            # Update existing session
            session = Session.query.get(session_id)
            if session:
                session.messages = messages
                db.session.commit()
            else:
                new_session = Session(id=str(uuid.uuid4()), messages=messages)
                db.session.add(new_session)
                db.session.commit()
                session_id = new_session.id

        headers = {
            'Authorization': f'Bearer {os.getenv("OPENROUTER_API_KEY")}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://aiscend.com',
            'X-Title': 'AIscend Production'
        }

        # Ensure system message is first in conversation
        payload = {
            'model': 'mistralai/mistral-7b-instruct:free',
            'messages': [{'role': 'system', 'content': 'You are a helpful assistant'}] + messages,
            'temperature': 0.7,
            'max_tokens': 1000
        }

        app.logger.debug(f"Sending to OpenRouter with headers: {headers} and payload: {payload}")
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=30
        )
        
        app.logger.debug(f"OpenRouter response: {response.status_code} {response.text}")
        response.raise_for_status()
        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'API request failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)