const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzka4-7wm5_IWKrpkmdEnRcH47dw1pAdPhk4adY0EO6CHoPGMC6OO2LMHOw3eAsOrUW/exec';

// ------------------- Utility -------------------
function getUserEmail() {
  return localStorage.getItem('email');
}

function redirectIfNotLoggedIn() {
  if (!getUserEmail()) {
    window.location.href = 'login.html';
  }
}

// ------------------- Login -------------------
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const res = await fetch(`${SHEET_API_URL}?action=login&email=${email}&password=${password}`);
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('email', email);
      window.location.href = 'index.html';
    } else {
      alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  });
}

// ------------------- Register -------------------
if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const pw1 = document.getElementById('password1').value;
    const pw2 = document.getElementById('password2').value;

    if (pw1 !== pw2) return alert('รหัสผ่านไม่ตรงกัน');

    const res = await fetch(`${SHEET_API_URL}?action=register`, {
      method: 'POST',
      body: JSON.stringify({ username, email, password: pw1 })
    });
    const data = await res.json();
    if (data.success) {
      alert('สมัครสมาชิกสำเร็จ');
      window.location.href = 'login.html';
    } else {
      alert(data.message || 'เกิดข้อผิดพลาด');
    }
  });
}

// ------------------- Load Coupons -------------------
async function loadCoupons(onlyUnused = true) {
  const email = getUserEmail();
  if (!email) return;

  const res = await fetch(`${SHEET_API_URL}?action=getCoupons&email=${email}`);
  const data = await res.json();

  const table = document.querySelector('#couponTable tbody');
  if (!table) return;

  table.innerHTML = '';
  data.coupons.forEach(coupon => {
    if (onlyUnused && coupon.status === 'used') return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${coupon.image}" width="60" /></td>
      <td>${coupon.name}</td>
      <td>${coupon.expire}</td>
      <td><button onclick='showPopup(${JSON.stringify(coupon)})'>ดูโค้ด</button></td>
    `;
    table.appendChild(tr);
  });
}

// ------------------- Coupon Popup -------------------
let currentCodeType = 'qr';
function showPopup(coupon) {
  const popup = document.getElementById('couponPopup');
  document.getElementById('popupImage').src = coupon.image;
  document.getElementById('popupName').innerText = coupon.name;
  document.getElementById('popupCondition').innerText = coupon.condition;
  document.getElementById('popupExpire').innerText = 'หมดอายุ: ' + coupon.expire;
  document.getElementById('useCouponBtn').onclick = () => useCoupon(coupon.code);

  currentCodeType = 'qr';
  renderCode(coupon);

  popup.classList.remove('hidden');
  document.getElementById('closePopup').onclick = () => popup.classList.add('hidden');
  document.getElementById('toggleCodeType').onclick = () => {
    currentCodeType = currentCodeType === 'qr' ? 'barcode' : (currentCodeType === 'barcode' ? 'text' : 'qr');
    renderCode(coupon);
  };
}

function renderCode(coupon) {
  const container = document.getElementById('popupCodeArea');
  container.innerHTML = '';
  if (currentCodeType === 'qr') {
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?data=${coupon.code}&size=150x150`;
    container.appendChild(img);
  } else if (currentCodeType === 'barcode') {
    const img = document.createElement('img');
    img.src = `https://barcode.tec-it.com/barcode.ashx?data=${coupon.code}&code=Code128&translate-esc=false`;
    container.appendChild(img);
  } else {
    container.textContent = `รหัสคูปอง: ${coupon.code}`;
  }
}

// ------------------- Use Coupon -------------------
async function useCoupon(code) {
  const email = getUserEmail();
  const res = await fetch(`${SHEET_API_URL}?action=useCoupon`, {
    method: 'POST',
    body: JSON.stringify({ code, email })
  });
  const data = await res.json();
  if (data.success) {
    alert('ใช้คูปองเรียบร้อย');
    document.getElementById('couponPopup').classList.add('hidden');
    window.location.reload();
  } else {
    alert('ไม่สามารถใช้คูปองได้');
  }
}

// ------------------- Profile -------------------
if (document.getElementById('userEmail')) {
  redirectIfNotLoggedIn();
  document.getElementById('userEmail').textContent = getUserEmail();

  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPw = document.getElementById('oldPassword').value;
    const newPw = document.getElementById('newPassword1').value;
    const confirmPw = document.getElementById('newPassword2').value;

    if (newPw !== confirmPw) return alert('รหัสผ่านใหม่ไม่ตรงกัน');

    const res = await fetch(`${SHEET_API_URL}?action=changePassword`, {
      method: 'POST',
      body: JSON.stringify({ email: getUserEmail(), oldPw, newPw })
    });
    const data = await res.json();
    alert(data.message);
  });
}

// ------------------- History -------------------
async function loadHistory() {
  const email = getUserEmail();
  const res = await fetch(`${SHEET_API_URL}?action=getHistory&email=${email}`);
  const data = await res.json();

  const table = document.querySelector('#historyTable tbody');
  table.innerHTML = '';
  data.history.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${item.image}" width="60"></td>
      <td>${item.name}</td>
      <td>${item.expire}</td>
      <td>${item.usedTime}</td>
    `;
    table.appendChild(tr);
  });
}

// ------------------- Auto Load -------------------
window.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname;

  if (page.includes('index.html')) {
    redirectIfNotLoggedIn();
    loadCoupons(true);
  } else if (page.includes('coupon.html')) {
    redirectIfNotLoggedIn();
    loadCoupons(false);
  } else if (page.includes('history.html')) {
    redirectIfNotLoggedIn();
    loadHistory();
  } else if (page.includes('profile.html')) {
    redirectIfNotLoggedIn();
  }
});
