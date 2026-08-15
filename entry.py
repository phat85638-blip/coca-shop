from flask import Flask, jsonify, request, render_template
import json
import os
import uuid
from datetime import datetime, timezone

app = Flask(__name__)
app.secret_key = 'bfx_secret_key_2026'

# ===== Import các route từ app.py của mày =====
# Cách nhanh nhất: copy toàn bộ nội dung file app.py của mày vào đây
# HOẶC dùng import (nếu mày đã có app.py)
from app import app as original_app

# Gán lại app cho entry point
app = original_app

# ===== Entry point cho Cloudflare Workers =====
def fetch(request):
    # Chuyển request Flask thành response
    with app.test_request_context(
        path=request.url.split('/')[3:] or '/',
        method=request.method,
        data=request.body
    ):
        response = app.full_dispatch_request()
        return response
