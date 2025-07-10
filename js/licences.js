// Gestion des licences - CRUD et affichage
window.LicenceManager = {
    // Flag pour empêcher la double soumission
    isSaving: false,
    
    // Rend le tableau des licences
    renderLicences() {
        const tbody = document.getElementById('licenceTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (window.AppState.licences.length === 0) {
            this.renderEmptyState(tbody);
            return;
        }
        
        window.AppState.licences.forEach(licence => {
            tbody.appendChild(this.createLicenceRow(licence));
        });
    },

    // Affiche l'état vide
    renderEmptyState(tbody) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="10" style="text-align: center; color: #666; padding: 20px;">
                Aucune licence trouvée dans la base de données
            </td>
        `;
        tbody.appendChild(row);
    },

    // Crée une ligne de tableau pour une licence
    createLicenceRow(licence) {
        const row = document.createElement('tr');
        const status = window.AppUtils.getLicenceStatus(licence.expiration_date);
        
        let statusClass = '';
        if (status === window.AppConfig.LICENCE_STATUS.EXPIRED) {
            statusClass = 'status-expired';
        } else if (status === window.AppConfig.LICENCE_STATUS.WARNING) {
            statusClass = 'status-warning';
        }
        
        // Gestion des commentaires avec troncature
        const commentaires = licence.commentaires || '';
        const commentairesDisplay = commentaires.length > 50 
            ? `<span title="${window.AppUtils.escapeHtml(commentaires)}">${window.AppUtils.escapeHtml(commentaires.substring(0, 50))}...</span>`
            : window.AppUtils.escapeHtml(commentaires);
        
        row.className = statusClass;
        row.innerHTML = `
            <td>#${licence.id}</td>
            <td>${window.AppUtils.escapeHtml(licence.software_name || 'N/A')}</td>
            <td>${window.AppUtils.escapeHtml(licence.vendor || 'N/A')}</td>
            <td>${window.AppUtils.escapeHtml(licence.version || 'N/A')}</td>
            <td><span class="badge">${window.AppUtils.escapeHtml(licence.type || 'N/A')}</span></td>
            <td>${window.AppUtils.formatDate(licence.expiration_date)}</td>
            <td>${window.AppUtils.formatPrice(licence.initial_cost)}</td>
            <td>${licence.seats || 0} poste(s)</td>
            <td style="max-width: 150px; word-wrap: break-word;">${commentairesDisplay || '<em>Aucun</em>'}</td>
            <td>
                <button class="btn-edit" onclick="window.LicenceManager.editLicence(${licence.id})" title="Modifier">✏️</button>
                <button class="btn-delete" onclick="window.LicenceManager.deleteLicence(${licence.id})" title="Supprimer">🗑️</button>
            </td>
        `;
        return row;
    },

    // Vérifie les expirations et affiche les alertes
    checkExpirations() {
        window.UIManager.clearAlerts();
        
        const today = new Date();
        let expiredCount = 0;
        let warningCount = 0;
        
        window.AppState.licences.forEach(licence => {
            const status = window.AppUtils.getLicenceStatus(licence.expiration_date);
            
            if (status === window.AppConfig.LICENCE_STATUS.EXPIRED) {
                expiredCount++;
            } else if (status === window.AppConfig.LICENCE_STATUS.WARNING) {
                warningCount++;
            }
        });
        
        if (expiredCount > 0) {
            window.UIManager.showAlert(`⚠️ ${expiredCount} licence(s) expirée(s)`, 'danger');
        }
        
        if (warningCount > 0) {
            window.UIManager.showAlert(`⚡ ${warningCount} licence(s) expire(nt) bientôt`, 'warning');
        }
    },

    // Ouvre la modal pour créer/éditer une licence
    openModal(licence = null) {
        // Reset du flag de sauvegarde
        this.isSaving = false;
        
        window.AppState.editingLicenceId = licence ? licence.id : null;
        
        const modal = document.getElementById('licenceModal');
        const modalTitle = document.getElementById('modalTitle');
        const saveText = document.getElementById('saveText');
        
        if (licence) {
            // Mode édition
            modalTitle.textContent = 'Modifier la licence';
            saveText.textContent = 'Mettre à jour';
            this.populateForm(licence);
        } else {
            // Mode création
            modalTitle.textContent = 'Nouvelle licence';
            saveText.textContent = 'Créer';
            this.resetForm();
        }
        
        modal.classList.remove('hidden');
        window.UIManager.focusElement('software_name');
    },

    // Ferme la modal
    closeModal() {
        const modal = document.getElementById('licenceModal');
        modal.classList.add('hidden');
        window.UIManager.resetForm('licenceForm');
        window.AppState.editingLicenceId = null;
        
        // Reset du flag de sauvegarde
        this.isSaving = false;
        
        // Réactiver le bouton de sauvegarde
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
            const saveText = document.getElementById('saveText');
            if (saveText) {
                saveText.textContent = window.AppState.editingLicenceId ? 'Mettre à jour' : 'Créer';
            }
        }
    },

    // Remplit le formulaire avec les données d'une licence
    populateForm(licence) {
        const fields = [
            'software_name', 'vendor', 'version', 'type', 
            'purchase_date', 'expiration_date', 'initial_cost', 
            'seats', 'assigned_to', 'commentaires'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = licence[field] || (field === 'seats' ? 1 : '');
            }
        });
    },

    // Remet à zéro le formulaire
    resetForm() {
        window.UIManager.resetForm('licenceForm');
        const seatsField = document.getElementById('seats');
        if (seatsField) {
            seatsField.value = 1;
        }
    },

    // Sauvegarde une licence (création ou modification)
    async saveLicence() {
        // Protection contre la double soumission
        if (this.isSaving) {
            console.log('🛡️ Protection: Sauvegarde déjà en cours, ignore la demande');
            return;
        }

        try {
            // Marquer comme en cours de sauvegarde
            this.isSaving = true;
            
            // Désactiver le bouton de sauvegarde
            const saveBtn = document.getElementById('saveBtn');
            const saveText = document.getElementById('saveText');
            
            if (saveBtn) {
                saveBtn.disabled = true;
            }
            if (saveText) {
                saveText.textContent = 'Sauvegarde...';
            }

            const formData = this.getFormData();
            if (!this.validateForm(formData)) {
                return;
            }

            const licenceData = this.formatLicenceData(formData);
            
            console.log('💾 Début sauvegarde licence:', licenceData);
            
            let success = false;
            if (window.AppState.editingLicenceId) {
                success = await window.DatabaseManager.updateLicence(window.AppState.editingLicenceId, licenceData);
            } else {
                success = await window.DatabaseManager.createLicence(licenceData);
            }

            if (success) {
                console.log('✅ Sauvegarde réussie, fermeture modal');
                this.closeModal();
            }

        } catch (error) {
            console.error('❌ Erreur sauvegarde licence:', error);
            window.UIManager.showNotification(`Erreur: ${error.message}`, 'danger');
        } finally {
            // Toujours remettre le flag à false
            this.isSaving = false;
            
            // Réactiver le bouton
            const saveBtn = document.getElementById('saveBtn');
            const saveText = document.getElementById('saveText');
            
            if (saveBtn) {
                saveBtn.disabled = false;
            }
            if (saveText) {
                saveText.textContent = window.AppState.editingLicenceId ? 'Mettre à jour' : 'Créer';
            }
        }
    },

    // Récupère les données du formulaire
    getFormData() {
        const form = document.getElementById('licenceForm');
        return new FormData(form);
    },

    // Valide les données du formulaire
    validateForm(formData) {
        const required = ['software_name', 'vendor', 'type'];
        
        for (const field of required) {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                window.UIManager.showNotification(`Le champ "${field}" est requis`, 'danger');
                window.UIManager.focusElement(field);
                return false;
            }
        }

        // Validation de l'email si renseigné
        const email = formData.get('assigned_to');
        if (email && email.includes('@') && !window.AppUtils.isValidEmail(email)) {
            window.UIManager.showNotification('Format email invalide', 'danger');
            window.UIManager.focusElement('assigned_to');
            return false;
        }

        return true;
    },

    // Formate les données pour la base de données
    formatLicenceData(formData) {
        return {
            software_name: formData.get('software_name').trim(),
            vendor: formData.get('vendor').trim(),
            version: formData.get('version')?.trim() || null,
            type: formData.get('type'),
            purchase_date: formData.get('purchase_date') || null,
            expiration_date: formData.get('expiration_date') || null,
            initial_cost: parseFloat(formData.get('initial_cost')) || 0,
            seats: parseInt(formData.get('seats')) || 1,
            assigned_to: formData.get('assigned_to')?.trim() || null,
            commentaires: formData.get('commentaires')?.trim() || null
        };
    },

    // Supprime une licence avec confirmation
    async deleteLicence(licenceId) {
        if (!window.UIManager.confirm(window.AppConfig.MESSAGES.DELETE_CONFIRM)) {
            return;
        }
        
        await window.DatabaseManager.deleteLicence(licenceId);
    },

    // Édite une licence
    editLicence(licenceId) {
        const licence = window.DatabaseManager.getLicenceById(licenceId);
        if (licence) {
            this.openModal(licence);
        }
    },

    // Trie le tableau par colonne
    sortTable(column) {
        const currentDirection = window.AppState.sortDirection[column];
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        
        window.AppState.sortDirection[column] = newDirection;
        window.DatabaseManager.sortLicences(column, newDirection);
        window.UIManager.updateTableSort(column, newDirection);
    },

    // Exporte les licences en CSV
    exportLicences() {
        if (window.AppState.licences.length === 0) {
            window.UIManager.showNotification('Aucune licence à exporter', 'warning');
            return;
        }

        const headers = ['ID', 'Logiciel', 'Fournisseur', 'Version', 'Type', 'Date achat', 'Expiration', 'Prix', 'Postes', 'Assigné à', 'Commentaires'];
        
        const csvContent = [
            headers,
            ...window.AppState.licences.map(licence => [
                licence.id,
                licence.software_name || '',
                licence.vendor || '',
                licence.version || '',
                licence.type || '',
                licence.purchase_date || '',
                licence.expiration_date || '',
                licence.initial_cost || 0,
                licence.seats || 0,
                licence.assigned_to || '',
                licence.commentaires || ''
            ])
        ].map(row => row.join(',')).join('\n');

        this.downloadCSV(csvContent, `licences_${new Date().toISOString().split('T')[0]}.csv`);
        window.UIManager.showNotification('Export CSV généré avec succès !', 'success');
    },

    // Télécharge un fichier CSV
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    // Filtre les licences par statut
    filterByStatus(status) {
        const rows = document.querySelectorAll('#licenceTableBody tr');
        
        rows.forEach(row => {
            if (status === 'all') {
                row.style.display = '';
            } else {
                const hasStatus = row.classList.contains(`status-${status}`);
                row.style.display = hasStatus ? '' : 'none';
            }
        });
    },

    // Recherche avancée dans les licences
    advancedSearch(criteria) {
        const filteredLicences = window.AppState.licences.filter(licence => {
            for (const [field, value] of Object.entries(criteria)) {
                if (value && licence[field]) {
                    const licenceValue = licence[field].toString().toLowerCase();
                    const searchValue = value.toString().toLowerCase();
                    if (!licenceValue.includes(searchValue)) {
                        return false;
                    }
                }
            }
            return true;
        });

        // Temporairement remplacer les licences pour l'affichage
        const originalLicences = window.AppState.licences;
        window.AppState.licences = filteredLicences;
        this.renderLicences();
        window.AppState.licences = originalLicences;
    }
};