
    const audiences = {
      FULL: 'Full Company',
      BRAND: 'Enterprise Brand',
      RES: 'Residential',
      BUS: 'Business',
      ADV: 'Advertising Sales',
      MEDIA: 'Media',
      CARRIER: 'Carrier',
      CORP: 'Corporate',
      LEG: 'Legal',
      CRM: 'CRM / Email Marketing',
      WEB: 'Web / Digital',
      SOCIAL: 'Social Media',
      SALES: 'Sales',
      CARE: 'Customer Care',
      FIELD: 'Field Operations',
      OPS: 'Operations',
      IT: 'Information Technology',
      HR: 'Human Resources',
      PR: 'Public Relations',
      CREATIVE: 'Creative Services'
    };

    const types = {
      COPY: 'Copywriting',
      TERM: 'Terminology',
      STYLE: 'Writing Style',
      VOICE: 'Voice & Tone',
      GRAM: 'Grammar',
      SPELL: 'Spelling',
      CAP: 'Capitalization',
      PUNC: 'Punctuation',
      FORMAT: 'Formatting',
      CTA: 'Call-to-action',
      MSG: 'Messaging',
      COLOR: 'Color',
      TYPE: 'Typography',
      FONT: 'Font Usage',
      LOGO: 'Logo',
      LOCKUP: 'Logo Lockup',
      PHOTO: 'Photography',
      ICON: 'Icons',
      ILLUS: 'Illustration',
      BAND: 'Dynamic Band',
      LAYOUT: 'Layout / Grid',
      DISCLAIM: 'Disclaimer',
      LEGCOPY: 'Legal Copy',
      FCC: 'FCC Requirement',
      TERMS: 'Terms & Conditions',
      NOTICE: 'Notices',
      POLICY: 'Policy',
      NAME: 'Product Naming',
      PLAN: 'Plan Naming',
      SPEED: 'Speed Terminology',
      PRICE: 'Pricing Display',
      FEATURE: 'Features',
      OFFER: 'Offer Structure',
      PDF: 'PDF Standards',
      PRINT: 'Print Production',
      FILE: 'File Naming',
      EXPORT: 'Export Settings',
      QR: 'QR Codes',
      URL: 'URL Formatting',
      MERGE: 'Data Merge',
      PROCESS: 'Workflow / Process'
    };

    const $ = (id) => document.getElementById(id);
    const STORAGE_KEY = 'sourcebookRecords';
    const LAST_BACKUP_KEY = 'sourcebookLastBackup';
    let pendingRestoreRecords = null;

    function populateSelect(selectId, data, defaultValue, allLabel) {
      const select = $(selectId);
      select.innerHTML = '';
      if (allLabel) {
        const all = document.createElement('option');
        all.value = '';
        all.textContent = allLabel;
        select.appendChild(all);
      }
      Object.entries(data).forEach(([code, label]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = label;
        if (code === defaultValue) option.selected = true;
        select.appendChild(option);
      });
    }

    function pad2(value) {
      return String(value).padStart(2, '0').slice(-2);
    }

    function setToday() {
      const today = new Date();
      $('year').value = today.getFullYear();
      $('month').value = pad2(today.getMonth() + 1);
      $('day').value = pad2(today.getDate());
    }

    function baseCode() {
      const year = $('year').value ? String($('year').value).padStart(4, '0') : 'YYYY';
      const month = $('month').value ? pad2($('month').value) : 'MM';
      const day = $('day').value ? pad2($('day').value) : 'DD';
      const audience = $('audience').value || 'FULL';
      const type = $('type').value || 'TYPE';
      return `${year}.${month}.${day}.${audience}.${type}`;
    }

    function generateUniqueCode(base, records) {
      const matches = records.filter(r => r.code === base || r.code.startsWith(base + '.'));
      if (!matches.length) return base;
      let highest = 1;
      matches.forEach(r => {
        if (r.code === base) highest = Math.max(highest, 1);
        const suffix = r.code.slice(base.length + 1);
        if (/^\d{3}$/.test(suffix)) highest = Math.max(highest, Number(suffix));
      });
      return `${base}.${String(highest + 1).padStart(3, '0')}`;
    }

    function buildSummary(code, title, previous, current, explanation, affects) {
      const lines = [];
      if (title) lines.push(title);
      lines.push(code);
      if (current && previous) {
        lines.push(`Use “${current}” instead of “${previous}.”`);
      } else if (current) {
        lines.push(`Approved usage: “${current}.”`);
      } else if (previous) {
        lines.push(`Previous usage: “${previous}.”`);
      }
      if (explanation) lines.push(explanation);
      lines.push(`Affects: ${affects}.`);
      return lines.join('\n');
    }

    function currentApprover() {
      return $('approvedBy').value === 'Other'
        ? ($('approvedByOther').value.trim() || 'Other')
        : $('approvedBy').value;
    }

    function updateOutput() {
      const code = baseCode();
      const title = $('title').value.trim();
      const previous = $('previous').value.trim();
      const current = $('current').value.trim();
      const explanation = $('reason').value.trim();
      const affects = audiences[$('audience').value] || 'Full Company';
      const approvedBy = currentApprover();
      const supersedes = $('supersedes').value.trim() || 'None';

      $('code').textContent = code;
      $('ruleSummary').textContent = buildSummary(code, title, previous, current, explanation, affects);
      $('approvedByOut').textContent = approvedBy;
      $('affectsOut').textContent = affects;
      $('supersedesOut').textContent = supersedes;
    }

    function getRecordData(useUniqueCode = false) {
      const records = loadRecords();
      const base = baseCode();
      const code = useUniqueCode ? generateUniqueCode(base, records) : base;
      const title = $('title').value.trim();
      const previous = $('previous').value.trim();
      const current = $('current').value.trim();
      const explanation = $('reason').value.trim();
      const affectsCode = $('audience').value || 'FULL';
      const affects = audiences[affectsCode] || 'Full Company';
      const typeCode = $('type').value || 'COPY';
      const type = types[typeCode] || typeCode;
      const approvedBy = currentApprover();
      const supersedes = $('supersedes').value.trim() || 'None';
      const attachments = Array.from($('attachments').files || []).map(f => ({ name: f.name, size: f.size, type: f.type }));
      const summary = buildSummary(code, title, previous, current, explanation, affects);

      return {
        code, baseCode: base, title, previous, current, explanation,
        affects, affectsCode, type, typeCode, approvedBy, supersedes,
        attachments, summary, createdAt: new Date().toISOString()
      };
    }

    function loadRecords() {
      try {
        const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(records) ? records : [];
      } catch (error) {
        return [];
      }
    }

    function saveRecords(records) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      updateDataStatus();
    }

    function updateDataStatus() {
      const records = loadRecords();
      if ($('storedRuleCount')) $('storedRuleCount').textContent = records.length;
      const last = localStorage.getItem(LAST_BACKUP_KEY);
      if ($('lastBackup')) {
        $('lastBackup').textContent = last ? new Date(last).toLocaleString() : 'Never';
      }
    }

    function saveCurrentRecord() {
      const record = getRecordData(true);
      const records = loadRecords();
      records.push(record);
      saveRecords(records);
      renderBrowse();
      $('code').textContent = record.code;
      $('ruleSummary').textContent = record.summary;
      alert(`Saved ${record.code}`);
    }

    function emailCurrentRecord() {
      const record = getRecordData(false);
      const to = 'farrellt@sparklight.biz';
      const subject = encodeURIComponent(`Sourcebook Rule Update: ${record.code} - ${record.title || 'Untitled Record'}`);
      const body = encodeURIComponent(
        `SOURCEBOOK RULE UPDATE\n\n` +
        `${record.code}\n\n` +
        `${record.title ? record.title + '\n\n' : ''}` +
        `${record.current && record.previous ? `Use “${record.current}” instead of “${record.previous}.”\n\n` : ''}` +
        `${record.explanation ? record.explanation + '\n\n' : ''}` +
        `Affects: ${record.affects}\n` +
        `Approved By: ${record.approvedBy}\n` +
        `Supersedes: ${record.supersedes}`
      );
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function normalizeRecord(record) {
      const codeParts = String(record.code || '').split('.');
      const inferredAffectsCode = record.affectsCode || codeParts[3] || 'FULL';
      const inferredTypeCode = record.typeCode || codeParts[4] || '';
      return {
        ...record,
        affectsCode: inferredAffectsCode,
        affects: record.affects || audiences[inferredAffectsCode] || inferredAffectsCode,
        typeCode: inferredTypeCode,
        type: record.type || types[inferredTypeCode] || inferredTypeCode,
        attachments: Array.isArray(record.attachments) ? record.attachments : []
      };
    }

    function filteredRecords() {
      const query = $('ruleSearch').value.trim().toLowerCase();
      const affects = $('filterAffects').value;
      const type = $('filterType').value;
      return loadRecords()
        .map(normalizeRecord)
        .filter(record => {
          if (affects && record.affectsCode !== affects) return false;
          if (type && record.typeCode !== type) return false;
          if (!query) return true;
          const haystack = [
            record.code, record.title, record.previous, record.current,
            record.explanation, record.affects, record.affectsCode,
            record.type, record.typeCode, record.approvedBy,
            record.supersedes, record.summary,
            ...(record.attachments || []).map(a => a.name)
          ].join(' ').toLowerCase();
          return haystack.includes(query);
        })
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }

    function renderBrowse() {
      const records = filteredRecords();
      const list = $('wikiList');
      list.innerHTML = '';
      $('resultCount').textContent = `${records.length} ${records.length === 1 ? 'rule' : 'rules'}`;

      if (!records.length) {
        const total = loadRecords().length;
        list.innerHTML = total
          ? '<div class="empty-state"><strong>No matching rules.</strong>Try a different search or clear the filters.</div>'
          : '<div class="empty-state"><strong>No rules saved yet.</strong>Create your first rule in the Add Rule tab.</div>';
        return;
      }

      records.forEach(record => {
        const details = document.createElement('details');
        details.className = 'wiki-rule';
        const title = record.title || record.current || record.code;
        const attachmentNames = (record.attachments || []).map(a => escapeHtml(a.name)).join(', ');
        const date = record.createdAt ? new Date(record.createdAt).toLocaleString() : '—';

        details.innerHTML = `
          <summary>
            <div class="rule-head">
              <div>
                <div class="rule-title">${escapeHtml(title)}</div>
                <div class="rule-code">${escapeHtml(record.code)}</div>
              </div>
              <div class="rule-tags">
                <span class="tag">${escapeHtml(record.affects)}</span>
                <span class="tag">${escapeHtml(record.type)}</span>
              </div>
            </div>
          </summary>
          <div class="rule-body">
            <div class="rule-body-grid">
              ${record.previous ? `<div class="field-block"><strong>Previous / Incorrect</strong>${escapeHtml(record.previous)}</div>` : ''}
              ${record.current ? `<div class="field-block"><strong>Current / Approved</strong>${escapeHtml(record.current)}</div>` : ''}
              ${record.explanation ? `<div class="field-block full"><strong>Explanation</strong>${escapeHtml(record.explanation)}</div>` : ''}
              <div class="field-block"><strong>Approved By</strong>${escapeHtml(record.approvedBy || '—')}</div>
              <div class="field-block"><strong>Affects</strong>${escapeHtml(record.affects || '—')}</div>
              <div class="field-block"><strong>Supersedes</strong>${escapeHtml(record.supersedes || 'None')}</div>
              <div class="field-block"><strong>Created</strong>${escapeHtml(date)}</div>
              ${attachmentNames ? `<div class="field-block full"><strong>Attachments</strong>${attachmentNames}</div>` : ''}
            </div>
          </div>`;
        list.appendChild(details);
      });
    }

    function copyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard.');
      }).catch(() => {
        alert('Copy failed. Select the text manually and copy.');
      });
    }

    function clearForm() {
      $('title').value = '';
      $('previous').value = '';
      $('current').value = '';
      $('reason').value = '';
      $('supersedes').value = '';
      $('approvedByOther').value = '';
      $('approvedByOther').style.display = 'none';
      $('attachments').value = '';
      $('attachmentList').innerHTML = '';
      setToday();
      $('audience').value = 'FULL';
      $('type').value = 'COPY';
      $('approvedBy').value = 'Brand';
      updateOutput();
    }

    function csvEscape(value) {
      const text = String(value ?? '');
      return `"${text.replaceAll('"', '""')}"`;
    }

    function downloadText(filename, text, mime) {
      const blob = new Blob([text], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function exportCsv() {
      const records = loadRecords().map(normalizeRecord);
      const headers = ['Code','Title','Affects','Affects Code','Decision Type','Type Code','Previous / Incorrect','Current / Approved','Explanation','Approved By','Supersedes','Attachments','Created'];
      const rows = records.map(r => [
        r.code, r.title, r.affects, r.affectsCode, r.type, r.typeCode,
        r.previous, r.current, r.explanation, r.approvedBy, r.supersedes,
        (r.attachments || []).map(a => a.name).join('; '), r.createdAt
      ]);
      const csv = [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
      downloadText(`Sparklight-Sourcebook-${new Date().toISOString().slice(0,10)}.csv`, csv, 'text/csv;charset=utf-8');
    }

    function createBackupPayload() {
      return {
        sourcebookVersion: 2,
        exportedAt: new Date().toISOString(),
        storageMode: 'browser-localStorage',
        records: loadRecords()
      };
    }

    function exportJson(markAsBackup = true) {
      const payload = createBackupPayload();
      const stamp = payload.exportedAt.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
      downloadText(`Sparklight-Sourcebook-Backup-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json');
      if (markAsBackup) {
        localStorage.setItem(LAST_BACKUP_KEY, payload.exportedAt);
        updateDataStatus();
      }
    }

    function importJsonFile(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          const incoming = Array.isArray(parsed) ? parsed : parsed.records;
          if (!Array.isArray(incoming)) throw new Error('No records array found.');
          const current = loadRecords();
          const existingCodes = new Set(current.map(r => r.code));
          const newRecords = incoming.filter(r => r && r.code && !existingCodes.has(r.code));
          saveRecords([...current, ...newRecords]);
          renderBrowse();
          alert(`Imported ${newRecords.length} new rule${newRecords.length === 1 ? '' : 's'}.`);
        } catch (error) {
          alert('That JSON file could not be imported as a Sourcebook export.');
        }
        $('importJson').value = '';
      };
      reader.readAsText(file);
    }

    function parseBackupText(text) {
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed) ? parsed : parsed.records;
      if (!Array.isArray(incoming)) throw new Error('No records array found.');
      return incoming.filter(r => r && typeof r === 'object' && r.code);
    }

    function setPendingRestore(file) {
      pendingRestoreRecords = null;
      $('mergeRestore').disabled = true;
      $('replaceRestore').disabled = true;
      $('restoreFileName').textContent = file ? file.name : 'No file selected';
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          pendingRestoreRecords = parseBackupText(reader.result);
          $('restoreFileName').textContent = `${file.name} — ${pendingRestoreRecords.length} rules`;
          $('mergeRestore').disabled = false;
          $('replaceRestore').disabled = false;
        } catch (error) {
          pendingRestoreRecords = null;
          $('restoreFileName').textContent = `${file.name} — not a valid Sourcebook backup`;
          alert('That file could not be read as a Sourcebook backup.');
        }
      };
      reader.readAsText(file);
    }

    function mergePendingBackup() {
      if (!pendingRestoreRecords) return;
      const current = loadRecords();
      const existingCodes = new Set(current.map(r => r.code));
      const additions = pendingRestoreRecords.filter(r => !existingCodes.has(r.code));
      saveRecords([...current, ...additions]);
      renderBrowse();
      alert(`Merged ${additions.length} new rule${additions.length === 1 ? '' : 's'}. Existing codes were left unchanged.`);
    }

    function replaceWithPendingBackup() {
      if (!pendingRestoreRecords) return;
      const ok = confirm(`Replace this browser's database with ${pendingRestoreRecords.length} rules from the selected backup? Current browser data will be overwritten.`);
      if (!ok) return;
      saveRecords(pendingRestoreRecords);
      renderBrowse();
      alert(`Database restored with ${pendingRestoreRecords.length} rule${pendingRestoreRecords.length === 1 ? '' : 's'}.`);
    }

    function clearDatabase(withBackup) {
      const records = loadRecords();
      if (!records.length) {
        alert('The local Sourcebook database is already empty.');
        return;
      }
      if (withBackup) exportJson(true);
      const ok = confirm(`Clear all ${records.length} locally stored Sourcebook rules from this browser?`);
      if (!ok) return;
      saveRecords([]);
      renderBrowse();
      alert('The local database has been cleared.');
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
      document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === tabId));
      if (tabId === 'browseTab') renderBrowse();
      if (tabId === 'dataTab') updateDataStatus();
    }

    populateSelect('audience', audiences, 'FULL');
    populateSelect('type', types, 'COPY');
    populateSelect('filterAffects', audiences, '', 'All Affects');
    populateSelect('filterType', types, '', 'All Decision Types');
    setToday();
    updateOutput();
    renderBrowse();
    updateDataStatus();

    $('approvedBy').addEventListener('change', () => {
      $('approvedByOther').style.display = $('approvedBy').value === 'Other' ? 'block' : 'none';
      updateOutput();
    });

    document.querySelectorAll('#createTab input, #createTab select, #createTab textarea').forEach(el => {
      el.addEventListener('input', updateOutput);
      el.addEventListener('change', updateOutput);
    });

    $('attachments').addEventListener('change', () => {
      const list = $('attachmentList');
      list.innerHTML = '';
      Array.from($('attachments').files).forEach(file => {
        const item = document.createElement('li');
        item.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
        list.appendChild(item);
      });
    });

    document.querySelectorAll('.tab-button').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    $('copyCode').addEventListener('click', () => copyText(baseCode()));
    $('copyRule').addEventListener('click', () => copyText($('ruleSummary').textContent));
    $('clearForm').addEventListener('click', clearForm);
    $('emailRecord').addEventListener('click', emailCurrentRecord);
    $('saveRecord').addEventListener('click', saveCurrentRecord);

    ['ruleSearch','filterAffects','filterType'].forEach(id => {
      $(id).addEventListener('input', renderBrowse);
      $(id).addEventListener('change', renderBrowse);
    });

    $('clearFilters').addEventListener('click', () => {
      $('ruleSearch').value = '';
      $('filterAffects').value = '';
      $('filterType').value = '';
      renderBrowse();
    });

    $('exportCsv').addEventListener('click', exportCsv);
    $('exportJson').addEventListener('click', exportJson);
    $('printRules').addEventListener('click', () => window.print());
    $('importJsonButton').addEventListener('click', () => $('importJson').click());
    $('importJson').addEventListener('change', () => {
      if ($('importJson').files[0]) importJsonFile($('importJson').files[0]);
    });

    $('backupJson').addEventListener('click', () => exportJson(true));
    $('dataExportCsv').addEventListener('click', exportCsv);
    $('chooseRestoreFile').addEventListener('click', () => $('restoreJson').click());
    $('restoreJson').addEventListener('change', () => setPendingRestore($('restoreJson').files[0] || null));
    $('mergeRestore').addEventListener('click', mergePendingBackup);
    $('replaceRestore').addEventListener('click', replaceWithPendingBackup);
    $('backupAndClear').addEventListener('click', () => clearDatabase(true));
    $('clearDatabase').addEventListener('click', () => clearDatabase(false));
  