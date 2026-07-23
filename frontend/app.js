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
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const tableBody = document.getElementById('tableBody');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = form.querySelector('button[type="submit"]');

const searchInput = document.getElementById('searchInput');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

let allData = []; // Store original data for searching

// Image Preview logic
imageInput.addEventListener('change', function () {
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
    tableBody.innerHTML = '<tr><td colspan="6"><div class="loader"></div></td></tr>';

    try {
        const res = await authFetch(API_URL);
        allData = await res.json();
        renderTable(allData);
    } catch (error) {
        console.error('Error fetching data:', error);
        tableBody.innerHTML = '<tr><td colspan="6"><div class="empty-state" style="color: red;">เกิดข้อผิดพลาดในการโหลดข้อมูล</div></td></tr>';
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
            `"${item.createdat ? new Date(item.createdat).toLocaleString('th-TH') : ''}"`
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
        tableBody.innerHTML = '<tr><td colspan="6"><div class="empty-state">ไม่พบข้อมูลรายชื่อ ลองเพิ่มใหม่เลย!</div></td></tr>';
        return;
    }

    data.forEach(item => {
        let dateStr = '';
        const itemDate = item.createdat;
        if (itemDate) {
            const d = new Date(itemDate);
            if (!isNaN(d.getTime())) {
                dateStr = d.toLocaleString('th-TH');
            } else {
                dateStr = itemDate;
            }
        }

        const tr = document.createElement('tr');
        const imgTag = item.image ? `<img src="${item.image}" alt="Profile" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;">` : `<div style="width: 50px; height: 50px; border-radius: 50%; background-color: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.8rem;">N/A</div>`;
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
                <div class="action-buttons" style="justify-content: center;">
                    <button class="btn-edit" onclick="editItem('${item.id}', '${escapeHTML(item.name.replace(/'/g, "\\'"))}', '${escapeHTML((item.description || '').replace(/'/g, "\\'"))}', '${escapeHTML((item.phone || '').replace(/'/g, "\\'"))}', '${escapeHTML((item.address || '').replace(/'/g, "\\'"))}', '${item.createdat || ''}', '${item.image || ''}')">แก้ไข</button>
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
    formData.append('description', descInput.value);
    formData.append('phone', phoneInput.value);
    formData.append('address', addressInput.value);

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
            res = await authFetch(`${API_URL}/${id}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            // Create
            res = await authFetch(API_URL, {
                method: 'POST',
                body: formData
            });
        }

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: id ? 'อัปเดตข้อมูลสำเร็จ!' : 'เพิ่มข้อมูลสำเร็จ!',
                showConfirmButton: false,
                timer: 1500
            });
            form.reset();
            nameIdInput.value = '';
            formTitle.textContent = 'เพิ่มข้อมูลใหม่';
            cancelBtn.style.display = 'none';
            imagePreview.src = '';
            imagePreviewContainer.style.display = 'none';

            // Reload data
            loadData();
        } else {
            const errorData = await res.json();
            Swal.fire('ข้อผิดพลาด', errorData.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    } finally {
        if (span) {
            span.textContent = originalText;
        }
        submitBtn.disabled = false;
    }
});

// Edit Item
window.editItem = function (id, name, desc, phone, address, createdAt, image) {
    nameIdInput.value = id;
    nameInput.value = name;
    descInput.value = desc === '-' ? '' : desc;
    phoneInput.value = phone;
    addressInput.value = address;

    if (createdAt) {
        createdAtInput.value = formatToDatetimeLocal(createdAt);
    } else {
        createdAtInput.value = '';
    }

    if (image && image !== 'null') {
        imagePreview.src = image;
        imagePreviewContainer.style.display = 'block';
    } else {
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
    }

    formTitle.textContent = 'แก้ไขข้อมูล';
    cancelBtn.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Cancel Edit
cancelBtn.addEventListener('click', () => {
    form.reset();
    nameIdInput.value = '';
    formTitle.textContent = 'เพิ่มข้อมูลใหม่';
    cancelBtn.style.display = 'none';
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
});

// Delete Item
window.deleteItem = async function (id) {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: "คุณต้องการลบรายชื่อนี้ใช่หรือไม่? (ไม่สามารถกู้คืนได้)",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
            const res = await authFetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                Swal.fire('ลบสำเร็จ!', 'ข้อมูลถูกลบเรียบร้อยแล้ว', 'success');
                loadData();
            } else {
                const errorData = await res.json();
                Swal.fire('ข้อผิดพลาด', errorData.message || 'เกิดข้อผิดพลาดในการลบ', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
        }
    }
};

// Initial Load
loadData();
