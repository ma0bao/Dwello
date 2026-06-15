from flask import Flask, jsonify
import sqlite3
import os

app = Flask(__name__)
DB_FILE = 'dwello.db'

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def hello():
    return 'Hello World'

@app.route('/init')
def init():
    conn = get_db()
    conn.execute('''CREATE TABLE IF NOT EXISTS items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        value TEXT
                    )''')
    conn.commit()
    conn.close()
    return 'Database initialized'

@app.route('/items', methods=['GET'])
def list_items():
    conn = get_db()
    cur = conn.execute('SELECT * FROM items')
    rows = [dict(id=row['id'], name=row['name'], value=row['value']) for row in cur.fetchall()]
    conn.close()
    return jsonify(rows)

if __name__ == '__main__':
    # ensure the DB file exists
    if not os.path.exists(DB_FILE):
        open(DB_FILE, 'w').close()
    app.run(host='0.0.0.0', port=3000)