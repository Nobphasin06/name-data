const API_URL = '/api/names';

// Elements
const form = document.getElementById('nameForm');
const nameIdInput = document.getElementById('nameId');
const nameInput = document.getElementById('nameInput');
const descInput = document.getElementById('descInput');
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
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #888;">No data available</td></tr>';
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${escapeHTML(item.name)}</strong>
                <div style="font-size: 0.8em; color: #888;">ID: ${item.id}</div>
            </td>
            <td>${escapeHTML(item.description)}</td>
            <td class="action-buttons">
                <button class="btn-edit" onclick="editItem('${item.id}', '${escapeHTML(item.name.replace(/'/g, "\\'"))}', '${escapeHTML(item.description.replace(/'/g, "\\'"))}')">Edit</button>
                <button class="btn-delete" onclick="deleteItem('${item.id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Utility to escape HTML
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Handle Form Submit (Create / Update)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = nameIdInput.value;
    const payload = {
        name: nameInput.value,
        description: descInput.value
    };

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
        alert('An error occurred while saving.');
    }
});

// Populate form for edit
window.editItem = function(id, name, description) {
    nameIdInput.value = id;
    nameInput.value = name;
    descInput.value = description;
    
    submitBtn.textContent = 'Update';
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
    
    submitBtn.textContent = 'Save';
    submitBtn.classList.remove('update-mode');
    cancelBtn.style.display = 'none';
}

// Delete item
window.deleteItem = async function(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        loadData();
    } catch (error) {
        console.error('Error deleting data:', error);
        alert('An error occurred while deleting.');
    }
}

// Initial Load
loadData();
