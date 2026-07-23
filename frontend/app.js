const API_URL = '/api/names';
const LOGIN_URL = '/api/login';
const REGISTER_URL = '/api/register';

// Elements
const form = document.getElementById('nameForm');
const formTitle = document.getElementById('formTitle');
const nameIdInput = document.getElementById('nameId');
const nameInput = document.getElementById('nameInput');
const phoneInput = document.getElementById('phoneInput');
const addressInput = document.getElementById('addressInput');
const descInput = document.getElementById('descInput');
const createdAtInput = document.getElementById('createdAtInput');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const tableBody = document.getElementById('tableBody');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = form.querySelector('button[type="submit"]');

<<<<<< gigi
// Handle image preview
imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreviewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
    }
});
======
>>>>>> main
const searchInput = document.getElementById('searchInput');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

const loginContainer = document.getElementById('loginContainer');
const mainContainer = document.getElementById('mainContainer');
const loginForm = document.getElementById('loginForm');
const loginUsernameInput = document.getElementById('loginUsername');
const loginPasswordInput = document.getElementById('loginPassword');
const logoutBtn = document.getElementById('logoutBtn');

const authTitle = document.getElementById('authTitle');
const registerForm = document.getElementById('registerForm');
const regUsernameInput = document.getElementById('regUsername');
const regPasswordInput = document.getElementById('regPassword');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');

let allData = []; // Store original data for searching

// Image Preview logic
imageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const url = URL.createObjectURL(this.files[0]);
        imagePreview.src = url;
        imagePreviewContainer.style.display = 'block';
    } else {
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
    }
});

// Dark Mode Logic
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️';
}
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        darkModeToggle.textContent = '☀️';
    } else {
        localStorage.setItem('darkMode', 'disabled');
        darkModeToggle.textContent = '🌙';
    }
});

// Fetch and render data
async function loadData() {
    // Show Loading Spinner
    tableBody.innerHTML = '<tr><td colspan="5"><div class="loader"></div></td></tr>';

    try {
<<<<<< gigi
        const res = await fetch(API_URL, { headers: getAuthHeaders(true) });
        if (handleAuthError(res)) return;
======
        const res = await authFetch(API_URL);
>>>>>> main
        allData = await res.json();
        renderTable(allData);
    } catch (error) {
        console.error('Error fetching data:', error);
        tableBody.innerHTML = '<tr><td colspan="5"><div class="empty-state" style="color: red;">เกิดข้อผิดพลาดในการโหลดข้อมูล</div></td></tr>';
    }
}

// Live Search
searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filteredData = allData.filter(item => {
        return (item.name || '').toLowerCase().includes(keyword) ||
               (item.phone || '').toLowerCase().includes(keyword) ||
               (item.address || '').toLowerCase().includes(keyword) ||
               (item.description || '').toLowerCase().includes(keyword);
    });
    renderTable(filteredData);
});

// Export to CSV
exportCsvBtn.addEventListener('click', () => {
    if (allData.length === 0) {
        Swal.fire('ไม่มีข้อมูล', 'ไม่มีข้อมูลสำหรับ Export', 'info');
        return;
    }
    
    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // \uFEFF supports Thai UTF-8 in Excel
    csvContent += "รหัส,ชื่อ-นามสกุล,เบอร์ติดต่อ,ที่อยู่,รายละเอียด,วันที่บันทึก\n";
    
    // Rows
    allData.forEach(item => {
        let row = [
            item.id,
            `"${item.name || ''}"`,
            `"${item.phone || ''}"`,
            `"${item.address || ''}"`,
            `"${item.description || ''}"`,
            `"${item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH') : ''}"`
        ];
        csvContent += row.join(",") + "\n";
    });

    // Download Logic
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "name_data_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show Success Toast
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
    Toast.fire({ icon: 'success', title: 'Export ไฟล์สำเร็จ!' });
});

// Render Table
function renderTable(data) {
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5"><div class="empty-state">ไม่พบข้อมูลรายชื่อ ลองเพิ่มใหม่เลย!</div></td></tr>';
        return;
    }

    data.forEach(item => {
        let dateStr = '';
<<<<<< gigi
        const itemDate = item.createdAt || item.createdat;
        if (itemDate) {
            const d = new Date(itemDate);
            if (!isNaN(d.getTime())) {
                dateStr = d.toLocaleString('th-TH');
            } else {
                dateStr = itemDate;
            }
======
        if (item.createdAt) {
            const d = new Date(item.createdAt);
            if (!isNaN(d.getTime())) dateStr = d.toLocaleString('th-TH');
            else dateStr = item.createdAt;
>>>>>> main
        }

        const tr = document.createElement('tr');
        const imgTag = item.imageUrl ? `<img src="${item.imageUrl}" alt="Profile" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;">` : `<div style="width: 50px; height: 50px; border-radius: 50%; background-color: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.8rem;">N/A</div>`;
        tr.innerHTML = `
            <td data-label="รูปภาพ" style="text-align: center;">
                ${imgTag}
            </td>
            <td data-label="ข้อมูลติดต่อ">
                <div class="td-name">${escapeHTML(item.name)}</div>
                <div style="font-size: 0.9rem; color: var(--primary); margin-top: 4px;">${item.phone ? '📞 ' + escapeHTML(item.phone) : ''}</div>
                <div class="td-id">รหัส: ${item.id}</div>
            </td>
            <td data-label="ที่อยู่" style="white-space: normal; min-width: 150px;">
                <div style="color: var(--text-muted);">${escapeHTML(item.address || '-')}</div>
            </td>
            <td data-label="รายละเอียด" class="td-desc">${escapeHTML(item.description || '-')}</td>
            <td data-label="วันที่บันทึก" style="font-size: 0.85rem; color: var(--text-muted);">
                ${escapeHTML(dateStr)}
            </td>
            <td data-label="จัดการ" style="text-align: center;">
<<<<<< gigi
                <div class="action-buttons" style="justify-content: center;">
                    <button class="btn-edit" onclick="editItem('${item.id}', '${escapeHTML(item.name.replace(/'/g, "\\'"))}', '${escapeHTML((item.description||'').replace(/'/g, "\\'"))}', '${escapeHTML((item.phone||'').replace(/'/g, "\\'"))}', '${escapeHTML((item.address||'').replace(/'/g, "\\'"))}', '${item.createdAt || item.createdat || ''}', '${item.image || ''}')">แก้ไข</button>
======
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editItem('${item.id}', '${escapeHTML(item.name.replace(/'/g, "\\'"))}', '${escapeHTML((item.description||'').replace(/'/g, "\\'"))}', '${escapeHTML((item.phone||'').replace(/'/g, "\\'"))}', '${escapeHTML((item.address||'').replace(/'/g, "\\'"))}', '${item.createdAt || ''}', '${item.imageUrl || ''}')">แก้ไข</button>
>>>>>> main
                    <button class="btn-delete" onclick="deleteItem('${item.id}')">ลบ</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function formatToDatetimeLocal(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16);
}

// Handle Form Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show Loading state on button without deleting span
    const span = submitBtn.querySelector('span');
    const originalText = span ? span.textContent : 'บันทึกข้อมูล';
    
    if (span) {
        span.textContent = 'กำลังบันทึก...';
    }
    submitBtn.disabled = true;

    const id = nameIdInput.value;
    const formData = new FormData();
    formData.append('name', nameInput.value);
    formData.append('phone', phoneInput.value);
    formData.append('address', addressInput.value);
    formData.append('description', descInput.value);

    if (createdAtInput.value) {
        formData.append('createdAt', new Date(createdAtInput.value).toISOString());
    }
    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        if (id) {
<<<<<< gigi
            res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(true),
                body: formData
            });
        } else {
            res = await fetch(API_URL, {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: formData
            });
        }
        
        if (handleAuthError(res)) return;

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        Swal.fire({ icon: 'success', title: id ? 'อัปเดตข้อมูลสำเร็จ!' : 'เพิ่มข้อมูลสำเร็จ!', showConfirmButton: false, timer: 1500 });
        
======
            await authFetch(`${API_URL}/${id}`, { method: 'PUT', body: formData });
            Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลสำเร็จ!', showConfirmButton: false, timer: 1500 });
        } else {
            await authFetch(API_URL, { method: 'POST', body: formData });
            Swal.fire({ icon: 'success', title: 'เพิ่มข้อมูลสำเร็จ!', showConfirmButton: false, timer: 1500 });
        }
        
>>>>>> main
        resetForm();
        loadData();
    } catch (error) {
        console.error('Error saving data:', error);
        Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
        submitBtn.disabled = false;
        // The span text is already reset correctly inside resetForm() if it succeeded.
        // But if it failed, we should restore it here just in case.
        if (submitBtn.querySelector('span') && submitBtn.querySelector('span').textContent === 'กำลังบันทึก...') {
             submitBtn.querySelector('span').textContent = originalText;
        }
    }
});

// Populate form for edit
window.editItem = function(id, name, description, phone, address, createdAt, imageUrl) {
    nameIdInput.value = id;
    nameInput.value = name;
    descInput.value = description;
    phoneInput.value = phone;
    addressInput.value = address;
    createdAtInput.value = createdAt ? formatToDatetimeLocal(createdAt) : '';
    
    imageInput.value = '';
    if (imageUrl) {
        imagePreview.src = imageUrl;
        imagePreviewContainer.style.display = 'block';
    } else {
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
    }
    
    formTitle.textContent = 'แก้ไขข้อมูล';
    if (submitBtn.querySelector('span')) {
        submitBtn.querySelector('span').textContent = 'อัปเดตข้อมูล';
    }
    submitBtn.classList.add('update-mode');
    cancelBtn.style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
    nameIdInput.value = '';
    nameInput.value = '';
    descInput.value = '';
    phoneInput.value = '';
    addressInput.value = '';
    createdAtInput.value = '';
    imageInput.value = '';
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
    
    formTitle.textContent = 'เพิ่มข้อมูลใหม่';
    if (submitBtn.querySelector('span')) {
        submitBtn.querySelector('span').textContent = 'บันทึกข้อมูล';
    }
    submitBtn.classList.remove('update-mode');
    cancelBtn.style.display = 'none';
}

// Delete item using SweetAlert2
window.deleteItem = async function(id) {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
<<<<<< gigi
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getAuthHeaders(true) });
            if (handleAuthError(res)) return;
======
            await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
>>>>>> main
            Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', text: 'ข้อมูลถูกลบออกจากระบบแล้ว', showConfirmButton: false, timer: 1500 });
            loadData();
        } catch (error) {
            console.error('Error deleting data:', error);
            Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
        }
    }
}

// Auth Logic
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        if(loginContainer) loginContainer.style.display = 'none';
        if(mainContainer) mainContainer.style.display = 'block';
        loadData();
    } else {
        if(loginContainer) loginContainer.style.display = 'block';
        if(mainContainer) mainContainer.style.display = 'none';
    }
}

if (showRegisterBtn && showLoginBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        if (authTitle) authTitle.textContent = 'สมัครสมาชิก';
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        if (authTitle) authTitle.textContent = 'เข้าสู่ระบบ';
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = regUsernameInput.value;
        const password = regPasswordInput.value;

        try {
            const res = await fetch(REGISTER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'สมัครสมาชิกสำเร็จ!', text: 'กรุณาเข้าสู่ระบบ', showConfirmButton: false, timer: 2000 });
                registerForm.reset();
                showLoginBtn.click();
            } else {
                const data = await res.json();
                Swal.fire('ข้อผิดพลาด', data.message || 'ไม่สามารถสมัครสมาชิกได้', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginUsernameInput.value;
        const password = loginPasswordInput.value;

        try {
            const res = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                loginForm.reset();
                checkAuth();
                Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ!', showConfirmButton: false, timer: 1500 });
            } else {
                const data = await res.json();
                Swal.fire('ข้อผิดพลาด', data.message || 'รหัสผ่านไม่ถูกต้อง', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
        }
    });
}

if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        checkAuth();
    });
}

function getAuthHeaders(isFormData = false) {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}

function handleAuthError(res) {
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        checkAuth();
        Swal.fire('แจ้งเตือน', 'กรุณาเข้าสู่ระบบ', 'warning');
        return true;
    }
    return false;
}

// Initial Load
checkAuth();
