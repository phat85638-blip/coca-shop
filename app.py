import json
import os
import re
import shutil
import uuid
import logging
from datetime import datetime, timezone

from flask import Flask, jsonify, render_template, request, session

app = Flask(__name__)
app.secret_key = 'bfx_secret_key_2026'
app.config.update(
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False
)

logging.basicConfig(level=logging.DEBUG)

USER_FILE = 'users.json'
ORDER_FILE = 'orders.json'
USED_CARDS_FILE = 'used_cards.json'
VOUCHER_FILE = 'vouchers.json'

ADMIN_USERNAME = 'phat'
ADMIN_PASSWORD = 'taodepzai'
ADMIN_OTP = 'phathuy1234567890'
ADMIN_AUTH = 'phathuybin'

def load_users():
    if os.path.exists(USER_FILE):
        try:
            with open(USER_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except json.JSONDecodeError:
            shutil.copy(USER_FILE, USER_FILE + '.bak')
            return {}
    return {}

def save_users(users):
    with open(USER_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def load_orders():
    if os.path.exists(ORDER_FILE):
        try:
            with open(ORDER_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return []
                return json.loads(content)
        except json.JSONDecodeError:
            shutil.copy(ORDER_FILE, ORDER_FILE + '.bak')
            return []
    return []

def save_orders(orders):
    with open(ORDER_FILE, 'w', encoding='utf-8') as f:
        json.dump(orders, f, ensure_ascii=False, indent=2)

def load_used_cards():
    if os.path.exists(USED_CARDS_FILE):
        try:
            with open(USED_CARDS_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return []
                return json.loads(content)
        except json.JSONDecodeError:
            return []
    return []

def save_used_card(card_serial, card_code):
    used = load_used_cards()
    # Kiểm tra trùng lặp theo serial hoặc mã thẻ
    for item in used:
        if item.get('card_serial') == card_serial or item.get('card_code') == card_code:
            return False
    used.append({'card_serial': card_serial, 'card_code': card_code})
    with open(USED_CARDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(used, f, ensure_ascii=False, indent=2)
    return True

def load_vouchers():
    if os.path.exists(VOUCHER_FILE):
        try:
            with open(VOUCHER_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except json.JSONDecodeError:
            return {}
    return {}

def save_vouchers(vouchers):
    with open(VOUCHER_FILE, 'w', encoding='utf-8') as f:
        json.dump(vouchers, f, ensure_ascii=False, indent=2)

def validate_card_code(card_name, card_code):
    if not card_code or not card_code.strip():
        return False, '⚠️ Vui lòng nhập mã thẻ!'
    card_code_clean = re.sub(r'\s+', '', card_code.strip())
    if not card_code_clean.isdigit():
        return False, '⚠️ Mã thẻ chỉ được chứa chữ số!'
    length = len(card_code_clean)
    if card_name.lower() == 'zing':
        if length not in [12, 15]:
            return False, f'⚠️ Mã thẻ Zing phải có 12 hoặc 15 chữ số (hiện tại {length} chữ số)!'
    elif card_name.lower() == 'mobifone':
        if length not in [12, 14]:
            return False, f'⚠️ Mã thẻ Mobifone phải có 12 hoặc 14 chữ số (hiện tại {length} chữ số)!'
    elif card_name.lower() == 'garena':
        if length not in [12, 16]:
            return False, f'⚠️ Mã thẻ Garena phải có 12 hoặc 16 chữ số (hiện tại {length} chữ số)!'
    else:
        return False, '⚠️ Loại thẻ không hợp lệ!'
    # Không kiểm tra used ở đây vì sẽ kiểm tra sau khi có serial
    return True, '✅ Mã thẻ hợp lệ!'

def get_user_data(username):
    users = load_users()
    return users.get(username)

def update_user_data(username, data):
    users = load_users()
    if username in users:
        password = users[username].get('password')
        users[username] = data
        users[username]['password'] = password
        save_users(users)
        return True
    return False

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    print(f"Register attempt: {username}")
    users = load_users()
    if username in users:
        return jsonify({'success': False, 'message': '⚠️ Tên đăng nhập đã tồn tại!'})
    users[username] = {
        'password': password,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'total_recharged': 0,
        'orders': [],
        'recharge_history': [],
        'info': {'fullname': '', 'phone': '', 'email': ''}
    }
    save_users(users)
    return jsonify({'success': True, 'message': '✅ Đăng ký thành công!'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    print(f"Login attempt: {username}")
    users = load_users()
    if username in users and users[username]['password'] == password:
        session['user'] = username
        return jsonify({'success': True, 'message': '✅ Đăng nhập thành công!'})
    return jsonify({'success': False, 'message': '❌ Sai tên đăng nhập hoặc mật khẩu!'})

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    otp = data.get('otp')
    auth = data.get('auth')
    print(f"Admin login attempt: {username}")

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD and otp == ADMIN_OTP and auth == ADMIN_AUTH:
        session['admin'] = True
        session['user'] = ADMIN_USERNAME
        return jsonify({'success': True, 'message': '✅ Đăng nhập admin thành công!'})

    if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
        return jsonify({'success': False, 'message': '❌ Sai tên đăng nhập hoặc mật khẩu!'})
    if otp != ADMIN_OTP:
        return jsonify({'success': False, 'message': '❌ Sai mã OTP!'})
    if auth != ADMIN_AUTH:
        return jsonify({'success': False, 'message': '❌ Sai mã xác thực!'})
    return jsonify({'success': False, 'message': '❌ Sai thông tin!'})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    session.pop('admin', None)
    return jsonify({'success': True, 'message': '✅ Đã đăng xuất!'})

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    if 'admin' in session:
        return jsonify({'logged_in': True, 'is_admin': True, 'username': session.get('user', 'Admin')})
    if 'user' in session:
        user_data = get_user_data(session['user'])
        return jsonify({
            'logged_in': True,
            'is_admin': False,
            'username': session['user'],
            'user_data': user_data
        })
    return jsonify({'logged_in': False})

@app.route('/api/user/data', methods=['GET'])
def get_user_info():
    if 'user' not in session:
        return jsonify({'success': False, 'message': '❌ Chưa đăng nhập!'})
    user_data = get_user_data(session['user'])
    if not user_data:
        return jsonify({'success': False, 'message': '❌ Không tìm thấy dữ liệu!'})
    return jsonify({'success': True, 'data': user_data})

@app.route('/api/user/update', methods=['POST'])
def update_user_info():
    if 'user' not in session:
        return jsonify({'success': False, 'message': '❌ Chưa đăng nhập!'})
    data = request.json
    username = session['user']
    user_data = get_user_data(username)
    if not user_data:
        return jsonify({'success': False, 'message': '❌ Không tìm thấy dữ liệu!'})
    user_data['info'] = {
        'fullname': data.get('fullname', ''),
        'phone': data.get('phone', ''),
        'email': data.get('email', '')
    }
    update_user_data(username, user_data)
    return jsonify({'success': True, 'message': '✅ Cập nhật thành công!'})

@app.route('/api/order/create', methods=['POST'])
def create_order():
    if 'user' not in session:
        return jsonify({'success': False, 'message': '❌ Chưa đăng nhập!'})
    data = request.json
    service = data.get('service')
    card_type = data.get('card_type') or 'N/A'
    amount = data.get('amount') or '0'
    game_username = data.get('game_username', '')
    game_password = data.get('game_password', '')
    username = session['user']

    user_data = get_user_data(username)
    if not user_data:
        return jsonify({'success': False, 'message': '❌ Không tìm thấy dữ liệu user!'})

    balance = user_data.get('total_recharged', 0)
    price = int(amount)
    if balance < price:
        return jsonify({
            'success': False,
            'message': f'❌ Số dư không đủ! Cần {price}K, hiện có {balance}K. Vui lòng nạp thêm!'
        })

    order = {
        'id': str(uuid.uuid4())[:8],
        'username': username,
        'service': service,
        'card_type': card_type,
        'amount': amount,
        'status': 'pending',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'estimated_time': '24h',
        'game_username': game_username,
        'game_password': game_password
    }
    orders = load_orders()
    orders.append(order)
    save_orders(orders)

    user_data['total_recharged'] = balance - price
    if 'orders' not in user_data:
        user_data['orders'] = []
    user_data['orders'].append(order['id'])
    update_user_data(username, user_data)

    return jsonify({
        'success': True,
        'message': f'✅ Đặt hàng thành công! Số dư còn lại: {balance - price}K',
        'order': order
    })

@app.route('/api/orders', methods=['GET'])
def get_orders():
    if 'admin' in session:
        orders = load_orders()
        return jsonify({'success': True, 'orders': orders})
    elif 'user' in session:
        username = session['user']
        orders = load_orders()
        user_orders = [o for o in orders if o.get('username') == username]
        return jsonify({'success': True, 'orders': user_orders})
    return jsonify({'success': False, 'message': '❌ Chưa đăng nhập!'})

@app.route('/api/order/update', methods=['POST'])
def update_order():
    if 'admin' not in session:
        return jsonify({'success': False, 'message': '❌ Chỉ admin mới có quyền!'})
    data = request.json
    order_id = data.get('order_id')
    new_status = data.get('status')
    orders = load_orders()
    for order in orders:
        if order.get('id') == order_id:
            order['status'] = new_status
            order['updated_at'] = datetime.now(timezone.utc).isoformat()
            save_orders(orders)
            return jsonify({'success': True, 'message': '✅ Cập nhật trạng thái thành công!'})
    return jsonify({'success': False, 'message': '❌ Không tìm thấy đơn hàng!'})

@app.route('/api/order/delete', methods=['POST'])
def delete_order():
    if 'admin' not in session:
        return jsonify({'success': False, 'message': '❌ Chỉ admin mới có quyền!'})
    data = request.json
    order_id = data.get('order_id')
    orders = load_orders()
    for i, order in enumerate(orders):
        if order.get('id') == order_id:
            del orders[i]
            save_orders(orders)
            return jsonify({'success': True, 'message': '✅ Xóa đơn hàng thành công!'})
    return jsonify({'success': False, 'message': '❌ Không tìm thấy đơn hàng!'})

@app.route('/api/recharge', methods=['POST'])
def recharge():
    if 'user' not in session:
        return jsonify({'success': False, 'message': '❌ Chưa đăng nhập!'})
    data = request.json
    card_name = data.get('card_name')
    card_serial = data.get('card_serial')
    card_code = data.get('card_code')
    amount = data.get('amount')
    username = session['user']

    if not card_serial or not card_serial.strip():
        return jsonify({'success': False, 'message': '⚠️ Vui lòng nhập số serial!'})

    is_valid, msg = validate_card_code(card_name, card_code)
    if not is_valid:
        return jsonify({'success': False, 'message': msg})

    card_code_clean = re.sub(r'\s+', '', card_code.strip())
    card_serial_clean = re.sub(r'\s+', '', card_serial.strip())

    # Kiểm tra serial và mã thẻ đã dùng chưa
    if not save_used_card(card_serial_clean, card_code_clean):
        return jsonify({'success': False, 'message': '⚠️ Serial hoặc mã thẻ này đã được sử dụng!'})

    user_data = get_user_data(username)
    if not user_data:
        return jsonify({'success': False, 'message': '❌ Không tìm thấy dữ liệu!'})

    user_data['total_recharged'] = user_data.get('total_recharged', 0) + int(amount)
    if 'recharge_history' not in user_data:
        user_data['recharge_history'] = []
    user_data['recharge_history'].append({
        'card_name': card_name,
        'card_serial': card_serial_clean,
        'card_code': card_code_clean[:4] + '****',
        'amount': amount,
        'time': datetime.now(timezone.utc).isoformat()
    })
    update_user_data(username, user_data)
    return jsonify({'success': True, 'message': '✅ Nạp thẻ thành công!'})

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    if 'admin' not in session:
        return jsonify({'success': False, 'message': '❌ Unauthorized'})
    users = load_users()
    orders = load_orders()
    total_revenue = sum([int(o.get('amount', 0)) for o in orders if o.get('status') == 'completed'])
    return jsonify({
        'success': True,
        'total_users': len(users),
        'total_orders': len(orders),
        'total_revenue': total_revenue,
        'pending_orders': len([o for o in orders if o.get('status') == 'pending'])
    })

@app.route('/api/voucher/create', methods=['POST'])
def create_voucher():
    if 'admin' not in session:
        return jsonify({'success': False, 'message': '❌ Chỉ admin mới có quyền!'})
    data = request.json
    code = data.get('code', '').upper().strip()
    discount = data.get('discount', 0)
    max_uses = data.get('max_uses', 1)
    expires_at = data.get('expires_at', '')

    if not code or discount <= 0:
        return jsonify({'success': False, 'message': '❌ Vui lòng nhập mã và % giảm giá!'})

    vouchers = load_vouchers()
    if code in vouchers:
        return jsonify({'success': False, 'message': '❌ Mã đã tồn tại!'})

    vouchers[code] = {
        'discount': discount,
        'max_uses': max_uses,
        'used_count': 0,
        'expires_at': expires_at,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    save_vouchers(vouchers)
    return jsonify({'success': True, 'message': f'✅ Tạo mã {code} thành công!'})

@app.route('/api/voucher/apply', methods=['POST'])
def apply_voucher():
    if 'user' not in session:
        return jsonify({'success': False, 'message': '❌ Chưa đăng nhập!'})
    data = request.json
    code = data.get('code', '').upper().strip()
    price = data.get('price', 0)

    vouchers = load_vouchers()
    if code not in vouchers:
        return jsonify({'success': False, 'message': '❌ Mã giảm giá không hợp lệ!'})

    v = vouchers[code]
    if v['expires_at'] and v['expires_at'] < datetime.now(timezone.utc).isoformat():
        return jsonify({'success': False, 'message': '❌ Mã giảm giá đã hết hạn!'})
    if v['used_count'] >= v['max_uses']:
        return jsonify({'success': False, 'message': '❌ Mã giảm giá đã hết lượt sử dụng!'})

    discount_amount = int(price * v['discount'] / 100)
    final_price = price - discount_amount

    return jsonify({
        'success': True,
        'discount': v['discount'],
        'discount_amount': discount_amount,
        'final_price': final_price,
        'code': code
    })

@app.route('/api/voucher/use', methods=['POST'])
def use_voucher():
    if 'user' not in session:
        return jsonify({'success': False, 'message': '❌ Chưa đăng nhập!'})
    data = request.json
    code = data.get('code', '').upper().strip()

    vouchers = load_vouchers()
    if code not in vouchers:
        return jsonify({'success': False, 'message': '❌ Mã không hợp lệ!'})

    vouchers[code]['used_count'] += 1
    save_vouchers(vouchers)
    return jsonify({'success': True, 'message': '✅ Áp dụng mã thành công!'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)