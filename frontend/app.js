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

// Fetch and render data
async function loadData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        renderTable(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Render Table
function renderTable(data) {
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6"><div class="empty-state">ยังไม่มีข้อมูลรายชื่อในระบบ เริ่มต้นโดยการเพิ่มข้อมูลใหม่ด้านบน!</div></td></tr>';
        return;
    }

    data.forEach(item => {
        // Format date to local readable format
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
                <div style="font-size: 0.9rem; color: #4f46e5; margin-top: 4px;">${item.phone ? '📞 ' + escapeHTML(item.phone) : ''}</div>
                <div class="td-id">รหัส: ${item.id}</div>
            </td>
            <td data-label="ที่อยู่" style="white-space: normal; min-width: 150px;">
                <div style="color: #64748b;">${escapeHTML(item.address || '-')}</div>
            </td>
            <td data-label="รายละเอียด" class="td-desc">${escapeHTML(item.description || '-')}</td>
            <td data-label="วันที่บันทึก" style="font-size: 0.85rem; color: #64748b;">
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

// Utility to escape HTML
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Format Date for datetime-local input
function formatToDatetimeLocal(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16);
}

// Handle Form Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = nameIdInput.value;
    
    // Use FormData instead of JSON to support file upload
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
        let res;
        if (id) {
            // Update
            res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                body: formData // No Content-Type header needed for FormData
            });
        } else {
            // Create
            res = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });
        }
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        resetForm();
        loadData();
    } catch (error) {
        console.error('Error saving data:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล (อาจเป็นเพราะไฟล์รูปใหญ่เกินไป หรือเซิร์ฟเวอร์มีปัญหา)');
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
    
    formTitle.textContent = 'แก้ไขข้อมูล';
    submitBtn.querySelector('span').textContent = 'อัปเดตข้อมูล';
    submitBtn.classList.add('update-mode');
    cancelBtn.style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle Cancel Button
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
    submitBtn.querySelector('span').textContent = 'บันทึกข้อมูล';
    submitBtn.classList.remove('update-mode');
    cancelBtn.style.display = 'none';
}

// Delete item
window.deleteItem = async function(id) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) return;
    
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        loadData();
    } catch (error) {
        console.error('Error deleting data:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
}

// Initial Load
loadData();
