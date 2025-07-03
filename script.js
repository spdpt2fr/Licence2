const API_URL = '/api/licences';
let licences = [];

async function loadLicences() {
  try {
    const res = await fetch(API_URL);
    licences = res.ok ? await res.json() : [];
  } catch (error) {
    console.error('Erreur lors du chargement des licences:', error);
    licences = [];
  }
}

function renderLicences(filter = '') {
  const tbody = document.querySelector('#licenceTable tbody');
  tbody.innerHTML = '';
  const today = new Date();
  licences
    .filter(l => l.softwareName.toLowerCase().includes(filter.toLowerCase()))
    .forEach(l => {
      const tr = document.createElement('tr');
      const expDate = new Date(l.expirationDate);
      const diff = Math.ceil((expDate - today) / (1000*60*60*24));
      if (diff < 0) tr.classList.add('status-expired');
      else if (diff <= 30) tr.classList.add('status-warning');
      tr.innerHTML = `
        <td>${l.softwareName}</td>
        <td>${l.vendor}</td>
        <td>${l.version}</td>
        <td>${l.type}</td>
        <td>${l.seats}</td>
        <td>${l.expirationDate}</td>
        <td>${l.initialCost}</td>
        <td>${l.assignedTo || ''}</td>
        <td>
          <button onclick="editLicence('${l.id}')">Éditer</button>
          <button onclick="deleteLicence('${l.id}')">Supprimer</button>
        </td>`;
      tbody.appendChild(tr);
    });
}

function showAlerts() {
  const alertsDiv = document.getElementById('alerts');
  alertsDiv.innerHTML = '';
  const today = new Date();
  licences.forEach(l => {
    const expDate = new Date(l.expirationDate);
    const diff = Math.ceil((expDate - today) / (1000*60*60*24));
    let level = null;
    if (diff < 0) level = 'danger';
    else if (diff <= 7) level = 'danger';
    else if (diff <= 15) level = 'warn';
    else if (diff <= 30) level = 'safe';
    if (level) {
      const alert = document.createElement('div');
      alert.className = `alert ${level}`;
      alert.textContent = `${l.softwareName} expire dans ${diff} jour(s)`;
      alertsDiv.appendChild(alert);
    }
  });
}

function resetForm() {
  document.getElementById('licenceId').value = '';
  document.getElementById('softwareName').value = '';
  document.getElementById('vendor').value = '';
  document.getElementById('version').value = '';
  document.getElementById('type').value = 'perpetuelle';
  document.getElementById('seats').value = 1;
  document.getElementById('purchaseDate').value = '';
  document.getElementById('expirationDate').value = '';
  document.getElementById('initialCost').value = '';
  document.getElementById('assignedTo').value = '';
}

function openForm(edit = false, licence = {}) {
  const form = document.getElementById('licenceForm');
  document.getElementById('formTitle').textContent = edit ? 'Modifier licence' : 'Nouvelle licence';
  form.classList.remove('hidden');
  if (edit) {
    document.getElementById('licenceId').value = licence.id;
    document.getElementById('softwareName').value = licence.softwareName;
    document.getElementById('vendor').value = licence.vendor;
    document.getElementById('version').value = licence.version;
    document.getElementById('type').value = licence.type;
    document.getElementById('seats').value = licence.seats;
    document.getElementById('purchaseDate').value = licence.purchaseDate;
    document.getElementById('expirationDate').value = licence.expirationDate;
    document.getElementById('initialCost').value = licence.initialCost;
    document.getElementById('assignedTo').value = licence.assignedTo || '';
  }
}

function closeForm() {
  document.getElementById('licenceForm').classList.add('hidden');
  resetForm();
}

function editLicence(id) {
  const licence = licences.find(l => l.id === id);
  if (licence) openForm(true, licence);
}

async function deleteLicence(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression');
    }
    await loadLicences();
    renderLicences(document.getElementById('search').value);
    showAlerts();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    alert('Erreur lors de la suppression de la licence');
  }
}

document.getElementById('newLicence').addEventListener('click', () => openForm());
document.getElementById('cancelForm').addEventListener('click', closeForm);
document.getElementById('search').addEventListener('input', e => {
  renderLicences(e.target.value);
});

// ✅ CORRECTION : Ajout de async à l'event listener
document.getElementById('licenceForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  try {
    const id = document.getElementById('licenceId').value;
    const licence = {
      id: id || Date.now().toString(),
      softwareName: document.getElementById('softwareName').value,
      vendor: document.getElementById('vendor').value,
      version: document.getElementById('version').value,
      type: document.getElementById('type').value,
      seats: parseInt(document.getElementById('seats').value, 10),
      purchaseDate: document.getElementById('purchaseDate').value,
      expirationDate: document.getElementById('expirationDate').value,
      initialCost: parseFloat(document.getElementById('initialCost').value),
      assignedTo: document.getElementById('assignedTo').value
    };
    
    let response;
    if (id) {
      // Modification d'une licence existante
      response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licence)
      });
    } else {
      // Création d'une nouvelle licence
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licence)
      });
    }
    
    if (!response.ok) {
      throw new Error('Erreur lors de la sauvegarde');
    }
    
    if (!id) {
      const saved = await response.json();
      licence.id = saved.id;
    }
    
    await loadLicences();
    closeForm();
    renderLicences(document.getElementById('search').value);
    showAlerts();
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('Erreur lors de la sauvegarde de la licence');
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadLicences();
  renderLicences();
  showAlerts();
});
