// ============================================
// BFX // BOOSTING SYSTEM - FULL SCRIPT
// ============================================

console.log('🔍 BFX Script loaded');

// ============================================
// NOTIFICATION BAR - XỬ LÝ ĐÓNG CHÍNH XÁC
// ============================================
(function() {
    const bar = document.getElementById('notification-bar');
    const closeBtn = document.getElementById('notification-bar-close');

    if (!bar) {
        console.warn('Không tìm thấy notification-bar');
        return;
    }
    if (!closeBtn) {
        console.warn('Không tìm thấy notification-bar-close');
        return;
    }

    // Luôn hiển thị
    bar.style.display = 'block';

    // Sự kiện đóng
    closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        bar.style.display = 'none';
        console.log('Notification bar closed');
        // Lưu thời gian đóng (không dùng)
        try { localStorage.setItem('notificationBarClosed', Date.now().toString()); } catch(err) {}
    });

    // Thêm kiểm tra nếu có sự kiện khác chặn
    console.log('✅ Notification bar ready');
})();

// ---- SMOOTH SCROLL ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ---- USERS ONLINE ----
const usersEl = document.querySelector('.users-count');
if (usersEl) {
    let count = 27;
    setInterval(() => {
        const change = Math.floor(Math.random() * 7) - 3;
        count = Math.max(8, Math.min(45, count + change));
        usersEl.textContent = count;
    }, 8000);
}

// ============================================
// AUTH PANEL - ĐĂNG KÝ HIỆN TRƯỚC
// ============================================
let authPanelOpen = false;

function createAuthPanel() {
    console.log('🔐 createAuthPanel');
    const overlay = document.getElementById('auth-overlay');
    const panel = document.getElementById('auth-panel');

    if (!overlay || !panel) {
        console.error('❌ Không tìm thấy auth-overlay hoặc auth-panel');
        return;
    }

    const registerTab = document.querySelector('[data-tab="register"]');
    const loginTab = document.querySelector('[data-tab="login"]');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if (!registerTab || !loginTab || !registerForm || !loginForm) {
        console.error('❌ Không tìm thấy các element auth');
        return;
    }

    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const target = this.dataset.tab;
            if (target === 'register') {
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            } else {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            }
            document.getElementById('login-msg').textContent = '';
            document.getElementById('reg-msg').textContent = '';
        });
    });

    document.getElementById('auth-panel-close').addEventListener('click', closeAuthPanel);
    overlay.addEventListener('click', closeAuthPanel);

    // Đăng ký
    document.getElementById('register-btn').addEventListener('click', function() {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;
        const msg = document.getElementById('reg-msg');

        if (!username || !password || !confirm) {
            msg.textContent = '⚠️ Điền đầy đủ!';
            msg.className = 'auth-msg error';
            return;
        }
        if (password !== confirm) {
            msg.textContent = '⚠️ Mật khẩu không khớp!';
            msg.className = 'auth-msg error';
            return;
        }

        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => {
            console.log('Register status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('Register data:', data);
            msg.textContent = data.message;
            msg.className = 'auth-msg ' + (data.success ? 'success' : 'error');
            if (data.success) {
                setTimeout(() => {
                    document.querySelector('[data-tab="login"]').click();
                    document.getElementById('login-username').value = username;
                    document.getElementById('login-msg').textContent = '✅ Đăng ký thành công, vui lòng đăng nhập!';
                    document.getElementById('login-msg').className = 'auth-msg success';
                }, 1000);
            }
        })
        .catch(err => {
            console.error('Fetch error:', err);
            msg.textContent = '⚠️ Lỗi kết nối! Kiểm tra server!';
            msg.className = 'auth-msg error';
        });
    });

    // Đăng nhập
    document.getElementById('login-btn').addEventListener('click', function() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const msg = document.getElementById('login-msg');

        if (!username || !password) {
            msg.textContent = '⚠️ Vui lòng nhập tên đăng nhập và mật khẩu!';
            msg.className = 'auth-msg error';
            return;
        }

        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => {
            console.log('Login status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('Login data:', data);
            msg.textContent = data.message;
            msg.className = 'auth-msg ' + (data.success ? 'success' : 'error');

            if (data.success) {
                sessionStorage.setItem('bfx_user', username);
                closeAuthPanel();
                updateAuthUI(username);
                loadUserData();
                document.getElementById('dashboard').classList.remove('hidden');
                showNotification('✅ Đăng nhập thành công!', 'success');
            }
        })
        .catch(err => {
            console.error('Fetch error:', err);
            msg.textContent = '⚠️ Lỗi kết nối đến server!';
            msg.className = 'auth-msg error';
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        fetch('/api/logout', { method: 'POST' })
            .then(() => {
                sessionStorage.removeItem('bfx_user');
                closeAuthPanel();
                updateAuthUI(null);
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('admin-panel').classList.add('hidden');
                document.querySelector('#home').scrollIntoView({ behavior: 'smooth' });
                showNotification('✅ Đã đăng xuất!', 'success');
            })
            .catch(e => console.error('Logout error:', e));
    });
}

function openAuthPanel() {
    console.log('🔓 openAuthPanel');
    const overlay = document.getElementById('auth-overlay');
    const panel = document.getElementById('auth-panel');
    if (overlay) overlay.classList.add('active');
    if (panel) panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    authPanelOpen = true;
    document.getElementById('login-msg').textContent = '';
    document.getElementById('reg-msg').textContent = '';
}

function closeAuthPanel() {
    console.log('🔒 closeAuthPanel');
    const overlay = document.getElementById('auth-overlay');
    const panel = document.getElementById('auth-panel');
    if (overlay) overlay.classList.remove('active');
    if (panel) panel.classList.remove('open');
    document.body.style.overflow = '';
    authPanelOpen = false;
}

// ============================================
// UPDATE AUTH UI
// ============================================
function updateAuthUI(username) {
    console.log('🔄 updateAuthUI, username:', username);
    const loginStatus = document.getElementById('login-status');
    const registerHeaderBtn = document.getElementById('register-header-btn');
    const logoutHeaderBtn = document.getElementById('logout-header-btn');
    const adminLink = document.getElementById('admin-link');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const authForms = document.querySelectorAll('.auth-form');
    const userInfo = document.getElementById('user-info');

    fetch('/api/check_auth')
        .then(res => res.json())
        .then(data => {
            const isAdmin = data.logged_in && data.is_admin;
            console.log('isAdmin:', isAdmin);

            if (username) {
                loginStatus.textContent = '👤 ' + username;
                loginStatus.className = 'status-user logged-in';
                loginStatus.style.cursor = 'pointer';
                loginStatus.onclick = () => {
                    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
                };

                registerHeaderBtn.classList.add('hidden');
                logoutHeaderBtn.classList.remove('hidden');
                logoutHeaderBtn.onclick = function() {
                    fetch('/api/logout', { method: 'POST' })
                        .then(() => {
                            sessionStorage.removeItem('bfx_user');
                            closeAuthPanel();
                            updateAuthUI(null);
                            document.getElementById('dashboard').classList.add('hidden');
                            document.querySelector('#home').scrollIntoView({ behavior: 'smooth' });
                            showNotification('✅ Đã đăng xuất!', 'success');
                        });
                };

                authForms.forEach(f => f.style.display = 'none');
                userInfo.classList.add('show');
                document.getElementById('display-username').textContent = username;
                document.querySelector('.pay-btn').disabled = false;
                document.querySelector('.pay-btn').style.opacity = 1;
                document.getElementById('dashboard').classList.remove('hidden');

                if (isAdmin) {
                    adminLink.classList.remove('hidden');
                    adminLink.onclick = () => { toggleAdminPanel(); };
                    if (adminLoginBtn) adminLoginBtn.classList.add('hidden');
                } else {
                    adminLink.classList.add('hidden');
                    if (adminLoginBtn) adminLoginBtn.classList.remove('hidden');
                }
                loadUserData();
            } else {
                loginStatus.textContent = '🔐 LOGIN';
                loginStatus.className = 'status-user';
                loginStatus.onclick = openAuthPanel;

                registerHeaderBtn.classList.remove('hidden');
                registerHeaderBtn.onclick = function() {
                    openAuthPanel();
                    document.querySelector('[data-tab="register"]').click();
                };

                logoutHeaderBtn.classList.add('hidden');
                adminLink.classList.add('hidden');
                if (adminLoginBtn) adminLoginBtn.classList.remove('hidden');

                authForms.forEach(f => f.style.display = 'flex');
                userInfo.classList.remove('show');
                document.querySelector('.pay-btn').disabled = true;
                document.querySelector('.pay-btn').style.opacity = 0.4;
                document.getElementById('dashboard').classList.add('hidden');
                document.getElementById('admin-panel').classList.add('hidden');
            }
        })
        .catch(err => {
            console.error('Lỗi updateAuthUI:', err);
        });
}

// ============================================
// LOAD USER DATA
// ============================================
function loadUserData() {
    console.log('📂 loadUserData');
    fetch('/api/user/data')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const u = data.data;
                document.getElementById('dash-username').textContent = data.username || '-';
                document.getElementById('dash-created').textContent = u.created_at ? new Date(u.created_at).toLocaleString() : '-';
                document.getElementById('dash-total-recharged').textContent = u.total_recharged || 0;
                document.getElementById('dash-fullname').textContent = u.info?.fullname || '-';
                document.getElementById('dash-phone').textContent = u.info?.phone || '-';
                document.getElementById('dash-email').textContent = u.info?.email || '-';
                document.getElementById('settings-fullname').value = u.info?.fullname || '';
                document.getElementById('settings-phone').value = u.info?.phone || '';
                document.getElementById('settings-email').value = u.info?.email || '';

                const rechargeList = document.getElementById('recharge-history-list');
                if (u.recharge_history && u.recharge_history.length > 0) {
                    rechargeList.innerHTML = u.recharge_history.map(item =>
                        `<div class="recharge-item">
                            <span>${item.card_name.toUpperCase()} - ${item.amount}K</span>
                            <span>${new Date(item.time).toLocaleString()}</span>
                            <span style="color:#6B7280;font-size:0.65rem;">${item.card_code}</span>
                        </div>`
                    ).join('');
                } else {
                    rechargeList.innerHTML = '<p class="empty-msg">Chưa có lịch sử nạp thẻ.</p>';
                }

                const orderList = document.getElementById('order-history-list');
                fetch('/api/orders')
                    .then(res => res.json())
                    .then(ordersData => {
                        if (ordersData.success && ordersData.orders.length > 0) {
                            orderList.innerHTML = ordersData.orders.map(o =>
                                `<div class="order-item">
                                    <span>${o.service}</span>
                                    <span class="status-${o.status}">${o.status.toUpperCase()}</span>
                                    <span>${new Date(o.created_at).toLocaleString()}</span>
                                </div>`
                            ).join('');
                        } else {
                            orderList.innerHTML = '<p class="empty-msg">Chưa có đơn hàng nào.</p>';
                        }
                    });
            }
        })
        .catch(e => console.error('Lỗi load user data:', e));
}

// ============================================
// SETTINGS
// ============================================
document.getElementById('settings-save-btn').addEventListener('click', function() {
    const fullname = document.getElementById('settings-fullname').value.trim();
    const phone = document.getElementById('settings-phone').value.trim();
    const email = document.getElementById('settings-email').value.trim();
    const msg = document.getElementById('settings-msg');
    fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, phone, email })
    })
    .then(res => res.json())
    .then(data => {
        msg.textContent = data.message;
        msg.style.color = data.success ? '#22C55E' : '#FF007A';
        if (data.success) loadUserData();
    })
    .catch(() => { msg.textContent = '⚠️ Lỗi kết nối!'; msg.style.color = '#FF007A'; });
});

// ============================================
// SERVICE CLICK
// ============================================
function handleServiceClick(event) {
    const card = event.currentTarget;
    const serviceName = card.dataset.service;
    const price = card.dataset.price;

    fetch('/api/check_auth')
        .then(res => res.json())
        .then(data => {
            if (!data.logged_in) {
                openAuthPanel();
                setTimeout(() => { document.getElementById('login-username').focus(); }, 400);
                document.getElementById('login-msg').textContent = '🔐 Vui lòng đăng nhập để sử dụng dịch vụ!';
                document.getElementById('login-msg').className = 'auth-msg error';
                return;
            }
            const select = document.getElementById('service-select');
            const options = select.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].text.includes(serviceName) || options[i].text.includes(price)) {
                    select.selectedIndex = i;
                    break;
                }
            }
            document.getElementById('payment').scrollIntoView({ behavior: 'smooth' });
            updateTotal();
        })
        .catch(() => { openAuthPanel(); });
}

// ============================================
// ORDER FROM PRICING TABLE
// ============================================
document.querySelectorAll('.order-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const service = this.dataset.service;
        const price = parseInt(this.dataset.price);

        fetch('/api/check_auth')
            .then(res => res.json())
            .then(data => {
                if (!data.logged_in) {
                    showNotification('⚠️ Vui lòng đăng nhập để đặt dịch vụ!', 'error');
                    openAuthPanel();
                    return;
                }

                fetch('/api/user/data')
                    .then(res => res.json())
                    .then(userData => {
                        if (!userData.success) {
                            showNotification('⚠️ Không thể lấy thông tin tài khoản!', 'error');
                            return;
                        }
                        const balance = userData.data.total_recharged || 0;
                        if (balance < price) {
                            showNotification(`❌ Số dư không đủ! Cần ${price}K, hiện có ${balance}K. Vui lòng nạp thêm!`, 'error');
                            return;
                        }

                        const gameUsername = document.getElementById('game-username')?.value.trim() || '';
                        const gamePassword = document.getElementById('game-password')?.value.trim() || '';

                        fetch('/api/order/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                service: service,
                                card_type: 'N/A',
                                amount: price,
                                game_username: gameUsername,
                                game_password: gamePassword
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                showNotification(`✅ Đã đặt dịch vụ: ${service} - ${price}K`, 'success');
                                if (document.getElementById('dashboard').classList.contains('hidden') === false) {
                                    loadUserData();
                                }
                            } else {
                                showNotification('❌ ' + data.message, 'error');
                            }
                        })
                        .catch(() => {
                            showNotification('⚠️ Lỗi kết nối!', 'error');
                        });
                    });
            });
    });
});

// ============================================
// NOTIFICATION (popup)
// ============================================
let notificationTimeout;

function showNotification(message, type) {
    const notif = document.getElementById('notification');
    const icon = document.getElementById('notification-icon');
    const text = document.getElementById('notification-text');

    if (type === 'success') {
        icon.textContent = '✅';
        notif.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    } else if (type === 'error') {
        icon.textContent = '❌';
        notif.style.borderColor = 'rgba(255, 0, 122, 0.3)';
    } else {
        icon.textContent = '⚠️';
        notif.style.borderColor = 'rgba(255, 165, 0, 0.3)';
    }

    text.textContent = message;
    notif.style.display = 'block';
    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
        notif.style.display = 'none';
    }, 5000);
}

function closeNotification() {
    document.getElementById('notification').style.display = 'none';
    clearTimeout(notificationTimeout);
}

// ============================================
// GUIDE MODAL
// ============================================
function openGuide() {
    document.getElementById('guide-modal').style.display = 'flex';
}

function closeGuide() {
    document.getElementById('guide-modal').style.display = 'none';
}

document.getElementById('guide-modal').addEventListener('click', function(e) {
    if (e.target === this) closeGuide();
});

// ============================================
// PAYMENT
// ============================================
document.querySelectorAll('.card-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.card-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        updateTotal();
    });
});

document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        updateTotal();
    });
});

document.getElementById('service-select').addEventListener('change', updateTotal);

function updateTotal() {
    const select = document.getElementById('service-select');
    const totalSpan = document.getElementById('total-price');
    let price = 0;
    if (select.value) {
        const match = select.value.match(/(\d+)K/);
        if (match) price = parseInt(match[1]);
    }
    totalSpan.textContent = price || 0;
}

document.getElementById('pay-btn').addEventListener('click', function() {
    const msg = document.getElementById('pay-msg');
    const select = document.getElementById('service-select');
    if (!select.value) {
        msg.textContent = '⚠️ Vui lòng chọn dịch vụ!';
        msg.className = 'pay-msg error';
        return;
    }
    const cardBtn = document.querySelector('.card-btn.active');
    const amountBtn = document.querySelector('.amount-btn.active');
    const cardType = cardBtn ? cardBtn.dataset.card : 'unknown';
    const amount = amountBtn ? amountBtn.dataset.amount : '0';

    fetch('/api/check_auth')
        .then(res => res.json())
        .then(data => {
            if (!data.logged_in) {
                msg.textContent = '❌ Vui lòng đăng nhập để thanh toán!';
                msg.className = 'pay-msg error';
                openAuthPanel();
                return;
            }

            const price = parseInt(select.value.match(/(\d+)K/)?.[1] || '0');
            let finalPrice = price;

            fetch('/api/user/data')
                .then(res => res.json())
                .then(userData => {
                    if (!userData.success) {
                        msg.textContent = '⚠️ Không thể lấy thông tin tài khoản!';
                        msg.className = 'pay-msg error';
                        return;
                    }
                    const balance = userData.data.total_recharged || 0;
                    if (balance < finalPrice) {
                        msg.textContent = `❌ Số dư không đủ! Cần ${finalPrice}K, hiện có ${balance}K. Vui lòng nạp thêm!`;
                        msg.className = 'pay-msg error';
                        return;
                    }

                    const gameUsername = document.getElementById('game-username')?.value.trim() || '';
                    const gamePassword = document.getElementById('game-password')?.value.trim() || '';

                    fetch('/api/order/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            service: select.value,
                            card_type: cardType,
                            amount: finalPrice,
                            game_username: gameUsername,
                            game_password: gamePassword
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            msg.textContent = `✅ ${data.message}`;
                            msg.className = 'pay-msg success';
                            loadUserData();
                            select.selectedIndex = 0;
                            updateTotal();
                            document.getElementById('game-username').value = '';
                            document.getElementById('game-password').value = '';
                            setTimeout(() => {
                                document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
                            }, 1500);
                        } else {
                            msg.textContent = '❌ ' + data.message;
                            msg.className = 'pay-msg error';
                        }
                    })
                    .catch(() => {
                        msg.textContent = '⚠️ Lỗi kết nối!';
                        msg.className = 'pay-msg error';
                    });
                });
        });
});

// ============================================
// RECHARGE
// ============================================
document.querySelectorAll('.recharge-card').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.recharge-card').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

document.querySelectorAll('.recharge-amount').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.recharge-amount').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

function validateCardCode(cardName, cardCode) {
    const cleanCode = cardCode.replace(/\s/g, '');
    if (!cleanCode) {
        return { valid: false, message: '⚠️ Vui lòng nhập mã thẻ!' };
    }
    if (!/^\d+$/.test(cleanCode)) {
        return { valid: false, message: '⚠️ Mã thẻ chỉ được chứa chữ số!' };
    }
    const length = cleanCode.length;
    const rules = {
        'zing': [12, 15],
        'mobifone': [12, 14],
        'garena': [12, 16]
    };
    const validLengths = rules[cardName.toLowerCase()];
    if (!validLengths) {
        return { valid: false, message: '⚠️ Loại thẻ không hợp lệ!' };
    }
    if (!validLengths.includes(length)) {
        return {
            valid: false,
            message: `⚠️ Mã thẻ ${cardName.toUpperCase()} phải có ${validLengths.join(' hoặc ')} chữ số (hiện tại ${length} chữ số)!`
        };
    }
    return { valid: true, message: '✅ Mã thẻ hợp lệ!', cleanCode: cleanCode };
}

document.getElementById('recharge-btn').addEventListener('click', function() {
    const msg = document.getElementById('recharge-msg');
    const cardBtn = document.querySelector('.recharge-card.active');
    const amountBtn = document.querySelector('.recharge-amount.active');
    const cardSerial = document.getElementById('card-serial-input').value.trim();
    const cardCode = document.getElementById('card-code-input').value.trim();

    if (!cardBtn || !amountBtn) {
        msg.textContent = '⚠️ Vui lòng chọn loại thẻ và mệnh giá!';
        msg.className = 'recharge-msg error';
        return;
    }
    if (!cardSerial) {
        msg.textContent = '⚠️ Vui lòng nhập số serial!';
        msg.className = 'recharge-msg error';
        return;
    }
    if (!cardCode) {
        msg.textContent = '⚠️ Vui lòng nhập mã thẻ!';
        msg.className = 'recharge-msg error';
        return;
    }

    const cardName = cardBtn.dataset.card;
    const amount = amountBtn.dataset.amount;

    const validation = validateCardCode(cardName, cardCode);
    if (!validation.valid) {
        msg.textContent = validation.message;
        msg.className = 'recharge-msg error';
        return;
    }

    fetch('/api/check_auth')
        .then(res => res.json())
        .then(data => {
            if (!data.logged_in) {
                msg.textContent = '❌ Vui lòng đăng nhập để nạp thẻ!';
                msg.className = 'recharge-msg error';
                openAuthPanel();
                return;
            }
            return fetch('/api/recharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    card_name: cardName,
                    card_serial: cardSerial,
                    card_code: validation.cleanCode,
                    amount: amount
                })
            });
        })
        .then(res => res.json ? res.json() : null)
        .then(data => {
            if (data && data.success) {
                msg.textContent = '✅ ' + data.message;
                msg.className = 'recharge-msg success';
                document.getElementById('card-serial-input').value = '';
                document.getElementById('card-code-input').value = '';
                loadUserData();
            } else if (data && !data.success) {
                msg.textContent = '❌ ' + data.message;
                msg.className = 'recharge-msg error';
            }
        })
        .catch(() => {
            msg.textContent = '⚠️ Lỗi kết nối!';
            msg.className = 'recharge-msg error';
        });
});

// ============================================
// ADMIN LOGIN PANEL
// ============================================
const adminLoginOverlay = document.getElementById('admin-login-overlay');
const adminLoginPanel = document.getElementById('admin-login-panel');
const adminLoginClose = document.getElementById('admin-login-close');
const adminLoginSubmit = document.getElementById('admin-login-submit');
const adminLoginMsg = document.getElementById('admin-login-msg');

function openAdminLoginPanel() {
    console.log('🟡 openAdminLoginPanel');
    if (!adminLoginOverlay || !adminLoginPanel) {
        console.error('❌ Không tìm thấy admin login panel');
        return;
    }
    adminLoginOverlay.classList.add('active');
    adminLoginPanel.classList.add('open');
    adminLoginPanel.style.right = '0';
    document.body.style.overflow = 'hidden';
    if (adminLoginMsg) adminLoginMsg.textContent = '';
    setTimeout(() => {
        const input = document.getElementById('admin-username-input');
        if (input) input.focus();
    }, 300);
}

function closeAdminLoginPanel() {
    console.log('🟢 closeAdminLoginPanel');
    if (!adminLoginOverlay || !adminLoginPanel) return;
    adminLoginOverlay.classList.remove('active');
    adminLoginPanel.classList.remove('open');
    adminLoginPanel.style.right = '-440px';
    document.body.style.overflow = '';
    if (adminLoginMsg) adminLoginMsg.textContent = '';
}

if (adminLoginOverlay) {
    adminLoginOverlay.addEventListener('click', closeAdminLoginPanel);
}
if (adminLoginClose) {
    adminLoginClose.addEventListener('click', closeAdminLoginPanel);
}

const adminLoginBtn = document.getElementById('admin-login-btn');
console.log('adminLoginBtn:', adminLoginBtn);
if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', function() {
        console.log('🔑 Click FOR ADMIN!');
        fetch('/api/check_auth')
            .then(res => res.json())
            .then(data => {
                if (data.logged_in && data.is_admin) {
                    alert('Bạn đã đăng nhập admin!');
                    return;
                }
                openAdminLoginPanel();
            })
            .catch(err => console.error('Lỗi check auth:', err));
    });
} else {
    console.error('❌ Không tìm thấy nút admin-login-btn');
}

if (adminLoginSubmit) {
    adminLoginSubmit.addEventListener('click', function() {
        console.log('🟣 Đăng nhập admin');
        const username = document.getElementById('admin-username-input').value.trim();
        const password = document.getElementById('admin-password-input').value.trim();
        const otp = document.getElementById('admin-otp-input').value.trim();
        const auth = document.getElementById('admin-auth-input').value.trim();

        if (!username || !password || !otp || !auth) {
            if (adminLoginMsg) {
                adminLoginMsg.textContent = '⚠️ Vui lòng nhập đầy đủ thông tin!';
                adminLoginMsg.className = 'auth-msg error';
            }
            return;
        }

        fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, otp, auth })
        })
        .then(res => res.json())
        .then(data => {
            console.log('admin login response:', data);
            if (adminLoginMsg) {
                adminLoginMsg.textContent = data.message;
                adminLoginMsg.className = 'auth-msg ' + (data.success ? 'success' : 'error');
            }
            if (data.success) {
                setTimeout(() => {
                    closeAdminLoginPanel();
                    sessionStorage.setItem('bfx_user', username);
                    updateAuthUI(username);
                    loadAdminData();
                    fetch('/api/check_auth')
                        .then(res => res.json())
                        .then(d => {
                            if (d.logged_in && d.is_admin) {
                                const adminLink = document.getElementById('admin-link');
                                if (adminLink) adminLink.classList.remove('hidden');
                                const adminLoginBtn = document.getElementById('admin-login-btn');
                                if (adminLoginBtn) adminLoginBtn.classList.add('hidden');
                            }
                        });
                }, 800);
            }
        })
        .catch(err => {
            console.error('Lỗi admin login:', err);
            if (adminLoginMsg) {
                adminLoginMsg.textContent = '⚠️ Lỗi kết nối!';
                adminLoginMsg.className = 'auth-msg error';
            }
        });
    });
} else {
    console.error('❌ Không tìm thấy nút admin-login-submit');
}

// ============================================
// ADMIN PANEL
// ============================================
function toggleAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    const mainApp = document.getElementById('main-app');
    const isHidden = adminPanel.classList.contains('hidden');
    if (isHidden) {
        adminPanel.classList.remove('hidden');
        mainApp.classList.add('hidden');
        fetch('/api/check_auth')
            .then(res => res.json())
            .then(data => {
                if (data.logged_in && data.is_admin) {
                    document.getElementById('admin-login-section').classList.add('hidden');
                    document.getElementById('admin-dashboard').classList.remove('hidden');
                    loadAdminData();
                } else {
                    document.getElementById('admin-login-section').classList.remove('hidden');
                    document.getElementById('admin-dashboard').classList.add('hidden');
                }
            });
    } else {
        adminPanel.classList.add('hidden');
        mainApp.classList.remove('hidden');
    }
}

function loadAdminData() {
    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('stat-users').textContent = data.total_users;
                document.getElementById('stat-orders').textContent = data.total_orders;
                document.getElementById('stat-revenue').textContent = data.total_revenue;
                document.getElementById('stat-pending').textContent = data.pending_orders;
            }
        });

    fetch('/api/orders')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('orders-body');
            if (data.success && data.orders.length > 0) {
                tbody.innerHTML = data.orders.map(o => `
                    <tr>
                        <td><span style="color:#6B7280;">${o.id}</span></td>
                        <td>${o.username}</td>
                        <td>${o.service}</td>
                        <td>${o.card_type || '-'}</td>
                        <td>${o.amount}K</td>
                        <td><span class="status-badge ${o.status}">${o.status.toUpperCase()}</span></td>
                        <td style="font-size:0.65rem;color:#6B7280;">${new Date(o.created_at).toLocaleString()}</td>
                        <td>
                            <select onchange="updateOrderStatus('${o.id}', this.value)" style="background:rgba(255,255,255,0.03);border:1px solid rgba(0,246,255,0.06);border-radius:3px;color:#E6F7FF;padding:4px 8px;font-size:0.7rem;">
                                <option value="pending" ${o.status=='pending'?'selected':''}>Chờ</option>
                                <option value="processing" ${o.status=='processing'?'selected':''}>Đang làm</option>
                                <option value="completed" ${o.status=='completed'?'selected':''}>Hoàn thành</option>
                                <option value="cancelled" ${o.status=='cancelled'?'selected':''}>Hủy</option>
                            </select>
                        </td>
                        <td>
                            <button class="order-delete-btn" onclick="deleteOrder('${o.id}')">🗑</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#6B7280;">Chưa có đơn hàng.</td></tr>';
            }
        });
}

function deleteOrder(orderId) {
    if (!confirm('Xóa đơn hàng này?')) return;
    fetch('/api/order/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('🗑 Đã xóa đơn hàng!', 'success');
            loadAdminData();
        } else {
            alert('Lỗi: ' + data.message);
        }
    });
}

window.updateOrderStatus = function(orderId, newStatus) {
    fetch('/api/order/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadAdminData();
            showNotification('📦 Cập nhật trạng thái đơn hàng!', 'success');
        } else {
            alert('Lỗi: ' + data.message);
        }
    });
};

// ============================================
// POLLING
// ============================================
let lastOrderCount = 0;

function pollOrders() {
    if (!document.getElementById('dashboard').classList.contains('hidden')) {
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.orders) {
                    const newCount = data.orders.length;
                    if (newCount !== lastOrderCount && lastOrderCount > 0) {
                        const latest = data.orders[0];
                        if (latest) {
                            showNotification(`📦 Cập nhật đơn hàng: ${latest.service} - ${latest.status.toUpperCase()}`, 'success');
                        }
                        loadUserData();
                    }
                    lastOrderCount = newCount;
                }
            })
            .catch(err => console.error('Polling error:', err));
    }
}

setInterval(pollOrders, 10000);

// ============================================
// PARTICLE BACKGROUND
// ============================================
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) {
        console.warn('⚠️ Không tìm thấy canvas particle');
        return;
    }

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const PARTICLE_COUNT = 40;
    const MAX_DISTANCE = 100;
    const PARTICLE_SIZE = 2;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = PARTICLE_SIZE * (0.5 + Math.random() * 0.8);
            this.opacity = 0.2 + Math.random() * 0.3;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(88, 166, 255, ${this.opacity * 0.5})`;
            ctx.fill();
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }
    }
    init();

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DISTANCE) {
                    const opacity = (1 - dist / MAX_DISTANCE) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(88, 166, 255, ${opacity})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => p.update());
        particles.forEach(p => p.draw());
        drawLines();
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
        resize();
        init();
    });

    console.log('✅ Particle background initialized');
})();

// ============================================
// RAIN EFFECT
// ============================================
let rainEnabled = true;
let rainAnimationId = null;
let rainDrops = [];

function initRain() {
    const canvas = document.getElementById('rain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const cols = Math.floor(canvas.width / 20);
    const drops = [];
    for (let i = 0; i < cols; i++) {
        drops.push({
            x: i * 20 + 10,
            y: Math.random() * canvas.height,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.2 + 0.05
        });
    }
    rainDrops = drops;

    function drawRain() {
        if (!rainEnabled) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            rainAnimationId = null;
            return;
        }
        ctx.fillStyle = 'rgba(13, 17, 23, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        drops.forEach(d => {
            const chars = '0123456789ABCDEF';
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillStyle = `rgba(88, 166, 255, ${d.opacity})`;
            ctx.fillText(char, d.x, d.y);
            d.y += d.speed * 0.8;
            if (d.y > canvas.height + 20) {
                d.y = -20;
                d.x = Math.floor(Math.random() * cols) * 20 + 10;
            }
        });
        rainAnimationId = requestAnimationFrame(drawRain);
    }
    drawRain();

    const toggle = document.getElementById('rain-toggle');
    if (toggle) {
        toggle.addEventListener('change', function() {
            rainEnabled = this.checked;
            if (!rainEnabled && rainAnimationId) {
                cancelAnimationFrame(rainAnimationId);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                rainAnimationId = null;
            } else if (rainEnabled && !rainAnimationId) {
                drawRain();
            }
        });
    }
}

// ============================================
// FLASHY BURST
// ============================================
function createBurst(x, y, color = '#58a6ff') {
    const container = document.createElement('div');
    container.className = 'flashy-burst';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    const count = 12;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'burst-particle';
        const angle = Math.random() * 2 * Math.PI;
        const dist = Math.random() * 50 + 15;
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.background = Math.random() > 0.5 ? '#58a6ff' : '#a78bfa';
        particle.style.boxShadow = `0 0 ${size*2}px rgba(88,166,255,0.2)`;
        particle.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
        particle.style.opacity = '1';
        particle.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        container.appendChild(particle);
        setTimeout(() => {
            particle.style.opacity = '0';
            particle.style.transform = `translate(${Math.cos(angle)*(dist+30)}px, ${Math.sin(angle)*(dist+30)}px) scale(0)`;
        }, 20);
    }
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 800);
}

document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.closest('.auth-panel') || target.closest('.guide-modal') || target.closest('.notification')) return;
    createBurst(e.clientX, e.clientY);
});

// ============================================
// INIT
// ============================================
function init() {
    createAuthPanel();
    checkAuthStatus();
    updateTotal();
    if (document.readyState === 'complete') {
        initRain();
    } else {
        window.addEventListener('load', initRain);
    }
    console.log('⎔ BFX // BOOSTING SYSTEM v2.0.26');
    console.log('● SYSTEM ONLINE // SERVER: VN-01');
    console.log('🕐 SHOP HOURS: 10:00 – 22:30');
}

function checkAuthStatus() {
    fetch('/api/check_auth')
        .then(res => res.json())
        .then(data => {
            console.log('checkAuthStatus:', data);
            if (data.logged_in) {
                sessionStorage.setItem('bfx_user', data.username || '');
                updateAuthUI(data.username);
            } else {
                sessionStorage.removeItem('bfx_user');
                updateAuthUI(null);
            }
        })
        .catch(e => console.error('Auth check error:', e));
}

document.querySelector('.pay-btn').disabled = true;
document.querySelector('.pay-btn').style.opacity = 0.4;

init();