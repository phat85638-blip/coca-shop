from flask import Flask, jsonify, request as flask_request
import json

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"shop": "Coca Shop", "status": "online"})

# Import các route khác từ app.py của mày vào đây
# Ví dụ: từ app import app (nhưng phải sửa lại cho phù hợp)