const API_URL = '/api/names';

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
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');

const tableBody = document.getElementById('tableBody');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = form.querySelector('button[type="submit"]');

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

const searchInput = document.getElementById('searchInput');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

let allData = []; // Store original data for searching

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
        const res = await fetch(API_URL);
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
        tableBody.innerHTML = '<tr><td colspan="6"><div class="empty-state">ยังไม่มีข้อมูลรายชื่อในระบบ เริ่มต้นโดยการเพิ่มข้อมูลใหม่ด้านบน!</div></td></tr>';
        tableBody.innerHTML = '<tr><td colspan="5"><div class="empty-state">ไม่พบข้อมูลรายชื่อ ลองเพิ่มใหม่เลย!</div></td></tr>';
        return;
    }

    data.forEach(item => {
        let dateStr = '';
        const itemDate = item.createdAt || item.createdat;
        if (itemDate) {
            const d = new Date(itemDate);
            if (!isNaN(d.getTime())) {
                dateStr = d.toLocaleString('th-TH');
            } else {
                dateStr = itemDate;
            }
        }

        const tr = document.createElement('tr');
        
        // Image Column
        const imgHtml = item.image 
            ? `<img src="/api/uploads/${item.image}" alt="${escapeHTML(item.name)}" class="table-img" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2U1ZTdlYiI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg=='">` 
            : `<div class="table-img" style="background: #e2e8f0; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:0.8rem;">No Img</div>`;

        tr.innerHTML = `
            <td data-label="รูปภาพ">${imgHtml}</td>
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
                <div class="action-buttons" style="justify-content: center;">
                    <button class="btn-edit" onclick="editItem('${item.id}', '${escapeHTML(item.name.replace(/'/g, "\\'"))}', '${escapeHTML((item.description||'').replace(/'/g, "\\'"))}', '${escapeHTML((item.phone||'').replace(/'/g, "\\'"))}', '${escapeHTML((item.address||'').replace(/'/g, "\\'"))}', '${item.createdAt || item.createdat || ''}', '${item.image || ''}')">แก้ไข</button>
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
    
    // Use FormData instead of JSON to support file upload
    const formData = new FormData();
    formData.append('name', nameInput.value);
    formData.append('phone', phoneInput.value);
    formData.append('address', addressInput.value);
    formData.append('description', descInput.value);
    
    const payload = {
        name: nameInput.value,
        phone: phoneInput.value,
        address: addressInput.value,
        description: descInput.value
    };

    if (createdAtInput.value) {
        formData.append('createdAt', new Date(createdAtInput.value).toISOString());
    }

    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        let res;
        if (id) {
            // Update
            res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                body: formData // Use formData to support image upload
            });
            Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลสำเร็จ!', showConfirmButton: false, timer: 1500 });
        } else {
            // Create
            res = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });
            Swal.fire({ icon: 'success', title: 'เพิ่มข้อมูลสำเร็จ!', showConfirmButton: false, timer: 1500 });
        }
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        resetForm();
        loadData();
    } catch (error) {
        console.error('Error saving data:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล (อาจเป็นเพราะไฟล์รูปใหญ่เกินไป หรือเซิร์ฟเวอร์มีปัญหา)');
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
window.editItem = function(id, name, description, phone, address, createdAt, image) {
    nameIdInput.value = id;
    nameInput.value = name;
    descInput.value = description;
    phoneInput.value = phone;
    addressInput.value = address;
    
    if (createdAt) {
        createdAtInput.value = formatToDatetimeLocal(createdAt);
    } else {
        createdAtInput.value = '';
    }

    // Show image preview if exists
    if (image) {
        imagePreview.src = `/api/uploads/${image}`;
        imagePreviewContainer.style.display = 'block';
    } else {
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
    }
    
    // Clear file input
    imageInput.value = '';
    createdAtInput.value = createdAt ? formatToDatetimeLocal(createdAt) : '';
    
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
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', text: 'ข้อมูลถูกลบออกจากระบบแล้ว', showConfirmButton: false, timer: 1500 });
            loadData();
        } catch (error) {
            console.error('Error deleting data:', error);
            Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
        }
    }
}

// Initial Load
loadData();
