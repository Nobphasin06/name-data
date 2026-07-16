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
const tableBody = document.getElementById('tableBody');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = form.querySelector('button[type="submit"]');

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
        tableBody.innerHTML = '<tr><td colspan="5"><div class="empty-state">ยังไม่มีข้อมูลรายชื่อในระบบ เริ่มต้นโดยการเพิ่มข้อมูลใหม่ด้านบน!</div></td></tr>';
        return;
    }

    data.forEach(item => {
        // Format date to local readable format
        let dateStr = '';
        if (item.createdAt) {
            const d = new Date(item.createdAt);
            if (!isNaN(d.getTime())) {
                dateStr = d.toLocaleString('th-TH');
            } else {
                dateStr = item.createdAt;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
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
                    <button class="btn-edit" onclick="editItem('${item.id}', '${escapeHTML(item.name.replace(/'/g, "\\'"))}', '${escapeHTML((item.description||'').replace(/'/g, "\\'"))}', '${escapeHTML((item.phone||'').replace(/'/g, "\\'"))}', '${escapeHTML((item.address||'').replace(/'/g, "\\'"))}', '${item.createdAt || ''}')">แก้ไข</button>
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
    // Output format: YYYY-MM-DDThh:mm
    return date.toISOString().slice(0, 16);
}

// Handle Form Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = nameIdInput.value;
    const payload = {
        name: nameInput.value,
        phone: phoneInput.value,
        address: addressInput.value,
        description: descInput.value
    };

    // Include custom created_at if provided
    if (createdAtInput.value) {
        payload.createdAt = new Date(createdAtInput.value).toISOString();
    }

    try {
        if (id) {
            // Update
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Create
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        resetForm();
        loadData();
    } catch (error) {
        console.error('Error saving data:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
});

// Populate form for edit
window.editItem = function(id, name, description, phone, address, createdAt) {
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
    
    formTitle.textContent = 'แก้ไขข้อมูล';
    submitBtn.querySelector('span').textContent = 'อัปเดตข้อมูล';
    submitBtn.classList.add('update-mode');
    cancelBtn.style.display = 'inline-block';
    
    // Smooth scroll to top
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
