/**
 * Service d'import/export pour l'application Licence2
 * Taille: ~3KB - Responsabilité unique: gestion import/export CSV et autres formats
 */

class ExportService {
  
  /**
   * Exporter des licences au format CSV
   * @param {Array} licences - Liste des licences à exporter
   * @param {string} filename - Nom du fichier (optionnel)
   * @returns {boolean} - Succès de l'opération
   */
  static exportToCSV(licences, filename = null) {
    try {
      if (!licences || !licences.length) {
        throw new Error('Aucune licence à exporter');
      }

      // Headers CSV (format compatible base de données)
      const headers = [
        'software_name',
        'vendor', 
        'version',
        'type',
        'seats',
        'purchase_date',
        'expiration_date',
        'initial_cost',
        'assigned_to'
      ];

      // Conversion des données (adapter selon le format d'entrée)
      const rows = licences.map(licence => [
        licence.softwareName || licence.software_name || '',
        licence.vendor || '',
        licence.version || '',
        licence.type || 'perpetuelle',
        licence.seats || 1,
        licence.purchaseDate || licence.purchase_date || '',
        licence.expirationDate || licence.expiration_date || '',
        licence.initialCost || licence.initial_cost || 0,
        licence.assignedTo || licence.assigned_to || ''
      ]);

      // Générer le CSV avec échappement des guillemets
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      // Télécharger le fichier
      const defaultFilename = `licences_${Formatters.formatDate(new Date(), 'iso')}.csv`;
      Helpers.downloadFile(csvContent, filename || defaultFilename, 'text/csv;charset=utf-8;');

      Helpers.log.success(`Export CSV réussi: ${licences.length} licence(s)`);
      return true;

    } catch (error) {
      Helpers.log.error('Erreur export CSV:', error);
      throw error;
    }
  }

  /**
   * Exporter des licences au format JSON
   * @param {Array} licences - Liste des licences
   * @param {string} filename - Nom du fichier (optionnel)
   * @returns {boolean} - Succès de l'opération
   */
  static exportToJSON(licences, filename = null) {
    try {
      if (!licences || !licences.length) {
        throw new Error('Aucune licence à exporter');
      }

      const exportData = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        total_licences: licences.length,
        licences: licences.map(licence => ({
          id: licence.id,
          software_name: licence.softwareName || licence.software_name,
          vendor: licence.vendor,
          version: licence.version,
          type: licence.type,
          seats: licence.seats,
          purchase_date: licence.purchaseDate || licence.purchase_date,
          expiration_date: licence.expirationDate || licence.expiration_date,
          initial_cost: licence.initialCost || licence.initial_cost,
          assigned_to: licence.assignedTo || licence.assigned_to,
          created_at: licence.createdAt || licence.created_at,
          updated_at: licence.updatedAt || licence.updated_at
        }))
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const defaultFilename = `licences_${Formatters.formatDate(new Date(), 'iso')}.json`;
      
      Helpers.downloadFile(jsonContent, filename || defaultFilename, 'application/json');

      Helpers.log.success(`Export JSON réussi: ${licences.length} licence(s)`);
      return true;

    } catch (error) {
      Helpers.log.error('Erreur export JSON:', error);
      throw error;
    }
  }

  /**
   * Importer des licences depuis un fichier CSV
   * @param {File} file - Fichier CSV à importer
   * @returns {Promise<Object>} - Résultat de l'import
   */
  static async importFromCSV(file) {
    return new Promise((resolve, reject) => {
      if (!file || file.type !== 'text/csv') {
        reject(new Error('Fichier CSV requis'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const text = e.target.result;
          const result = this.parseCSVContent(text);
          
          Helpers.log.success(`Import CSV analysé: ${result.validLicences.length} licence(s) valide(s)`);
          resolve(result);
          
        } catch (error) {
          Helpers.log.error('Erreur lecture CSV:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Erreur de lecture du fichier'));
      };

      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * Parser le contenu CSV
   * @param {string} csvText - Contenu CSV
   * @returns {Object} - Licences parsées et erreurs
   */
  static parseCSVContent(csvText) {
    if (!csvText || !csvText.trim()) {
      throw new Error('Fichier CSV vide');
    }

    const lines = csvText.trim().split(/\r?\n/);
    
    if (lines.length <= 1) {
      throw new Error('Fichier CSV doit contenir au moins un header et une ligne de données');
    }

    // Parser les headers (supporter différents formats)
    const headers = this.parseCSVLine(lines[0]);
    const normalizedHeaders = this.normalizeHeaders(headers);
    
    const validLicences = [];
    const errors = [];

    // Parser chaque ligne de données
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Ignorer les lignes vides
      
      try {
        const values = this.parseCSVLine(lines[i]);
        const licence = this.mapCSVRowToLicence(normalizedHeaders, values);
        
        // Validation
        const validation = Validators.validateLicence(licence);
        if (validation.isValid) {
          validLicences.push(licence);
        } else {
          errors.push({
            line: i + 1,
            data: licence,
            errors: validation.errors
          });
        }
        
      } catch (error) {
        errors.push({
          line: i + 1,
          error: error.message
        });
      }
    }

    return {
      validLicences,
      errors,
      totalLines: lines.length - 1,
      successCount: validLicences.length,
      errorCount: errors.length
    };
  }

  /**
   * Parser une ligne CSV (gestion des guillemets)
   * @param {string} line - Ligne CSV
   * @returns {Array} - Valeurs parsées
   */
  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Double quote = escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Normaliser les headers CSV (gérer différents formats)
   * @param {Array} headers - Headers originaux
   * @returns {Array} - Headers normalisés
   */
  static normalizeHeaders(headers) {
    const mapping = {
      // Variations possibles des noms de colonnes
      'nom': 'software_name',
      'logiciel': 'software_name', 
      'software': 'software_name',
      'nom_logiciel': 'software_name',
      'editeur': 'vendor',
      'éditeur': 'vendor',
      'fournisseur': 'vendor',
      'sieges': 'seats',
      'sièges': 'seats',
      'nombre_sieges': 'seats',
      'date_achat': 'purchase_date',
      'achat': 'purchase_date',
      'date_expiration': 'expiration_date',
      'expiration': 'expiration_date',
      'cout': 'initial_cost',
      'coût': 'initial_cost',
      'prix': 'initial_cost',
      'cout_initial': 'initial_cost',
      'assigne': 'assigned_to',
      'assigné': 'assigned_to',
      'utilisateur': 'assigned_to'
    };

    return headers.map(header => {
      const normalized = header.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      return mapping[normalized] || normalized;
    });
  }

  /**
   * Mapper une ligne CSV vers un objet licence
   * @param {Array} headers - Headers normalisés
   * @param {Array} values - Valeurs de la ligne
   * @returns {Object} - Objet licence
   */
  static mapCSVRowToLicence(headers, values) {
    const licence = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      switch (header) {
        case 'software_name':
          licence.softwareName = Validators.sanitizeString(value);
          break;
        case 'vendor':
          licence.vendor = Validators.sanitizeString(value);
          break;
        case 'version':
          licence.version = Validators.sanitizeString(value);
          break;
        case 'type':
          licence.type = ['perpetuelle', 'abonnement', 'utilisateur', 'concurrent'].includes(value) ? value : 'perpetuelle';
          break;
        case 'seats':
          licence.seats = parseInt(value, 10) || 1;
          break;
        case 'purchase_date':
          licence.purchaseDate = value;
          break;
        case 'expiration_date':
          licence.expirationDate = value;
          break;
        case 'initial_cost':
          licence.initialCost = parseFloat(value) || 0;
          break;
        case 'assigned_to':
          licence.assignedTo = Validators.sanitizeString(value);
          break;
      }
    });

    return licence;
  }

  /**
   * Générer un rapport d'import
   * @param {Object} importResult - Résultat de l'import
   * @returns {string} - Rapport formaté
   */
  static generateImportReport(importResult) {
    const { validLicences, errors, totalLines, successCount, errorCount } = importResult;
    
    let report = `📊 RAPPORT D'IMPORT CSV\n`;
    report += `═══════════════════════\n\n`;
    report += `📈 Statistiques:\n`;
    report += `• Total lignes traitées: ${totalLines}\n`;
    report += `• Licences importées: ${successCount}\n`;
    report += `• Erreurs: ${errorCount}\n`;
    report += `• Taux de réussite: ${Math.round((successCount / totalLines) * 100)}%\n\n`;
    
    if (errorCount > 0) {
      report += `❌ Erreurs détectées:\n`;
      errors.forEach((error, index) => {
        report += `${index + 1}. Ligne ${error.line}: ${error.errors ? error.errors.join(', ') : error.error}\n`;
      });
    }
    
    return report;
  }
}

// Export global pour compatibilité navigateur
window.ExportService = ExportService;