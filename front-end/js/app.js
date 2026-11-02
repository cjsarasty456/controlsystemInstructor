/**
 * SISTEMA DE CONTROL DE INSTRUCTORES — SENA
 * Lógica de la aplicación Front-End (Dashboard Fichas HU-007 + Lector Excel Juicios HU-008)
 */

class ControlSystemApp {
  constructor() {
    this.fichas = [];
    this.currentFicha = null;
    this.currentEstadoFilter = 'TODAS';
    this.searchQuery = '';
    this.pendingParsedReport = null;

    this.init();
  }

  init() {
    this.loadInitialData();
    this.renderFichasGrid();
    this.updateGlobalMetrics();
    this.setupDropzone();
  }

  // Carga de datos iniciales / persistencia en LocalStorage
  loadInitialData() {
    const saved = localStorage.getItem('csi_fichas_v1');
    if (saved) {
      try {
        this.fichas = JSON.parse(saved);
        return;
      } catch (e) {
        console.error("Error al cargar localStorage, usando datos predeterminados", e);
      }
    }

    // Datos semilla iniciales basados en las fichas reales del instructor SENA
    this.fichas = [
      {
        id: 'ficha_3145556',
        numero: '3145556',
        programa: 'ANALISIS Y DESARROLLO DE SOFTWARE',
        codigo: '228118',
        version: '1',
        jornada: 'PRESENCIAL',
        estado: 'EN EJECUCION',
        fechaInicio: '2024-12-16',
        fechaFin: '2027-05-07',
        regional: '41 - REGIONAL HUILA',
        centro: '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
        aprendices: [],
        reportes: [],
        juicios: []
      },
      {
        id: 'ficha_3145555',
        numero: '3145555',
        programa: 'ANALISIS Y DESARROLLO DE SOFTWARE',
        codigo: '228118',
        version: '1',
        jornada: 'PRESENCIAL',
        estado: 'EN EJECUCION',
        fechaInicio: '2024-12-16',
        fechaFin: '2027-05-07',
        regional: '41 - REGIONAL HUILA',
        centro: '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
        aprendices: [],
        reportes: [],
        juicios: []
      },
      {
        id: 'ficha_3239137',
        numero: '3239137',
        programa: 'ANALISIS Y DESARROLLO DE SOFTWARE',
        codigo: '228118',
        version: '1',
        jornada: 'MIXTA',
        estado: 'EN EJECUCION',
        fechaInicio: '2024-10-01',
        fechaFin: '2026-12-15',
        regional: '41 - REGIONAL HUILA',
        centro: '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
        aprendices: [],
        reportes: [],
        juicios: []
      },
      {
        id: 'ficha_3239188',
        numero: '3239188',
        programa: 'GESTION DE PROYECTOS DE SOFTWARE',
        codigo: '228118',
        version: '1',
        jornada: 'PRESENCIAL',
        estado: 'FINALIZADA',
        fechaInicio: '2023-08-01',
        fechaFin: '2025-08-15',
        regional: '41 - REGIONAL HUILA',
        centro: '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
        aprendices: [],
        reportes: [],
        juicios: []
      }
    ];

    this.saveData();
  }

  saveData() {
    localStorage.setItem('csi_fichas_v1', JSON.stringify(this.fichas));
  }

  // Métricas de Cabecera
  updateGlobalMetrics() {
    document.getElementById('metricTotalFichas').innerText = this.fichas.length;

    let totalAprendices = 0;
    let activas = 0;
    let totalReportes = 0;

    this.fichas.forEach(f => {
      totalAprendices += (f.aprendices ? f.aprendices.length : 0);
      if (f.estado === 'EN EJECUCION' || f.estado === 'ACTIVA') activas++;
      totalReportes += (f.reportes ? f.reportes.length : 0);
    });

    document.getElementById('metricTotalAprendices').innerText = totalAprendices;
    document.getElementById('metricFichasActivas').innerText = activas;
    document.getElementById('metricReportesCargados').innerText = totalReportes;
  }

  // ==========================================
  // VISTA 1: DASHBOARD Y GESTIÓN DE FICHAS (HU-007)
  // ==========================================

  renderFichasGrid() {
    const grid = document.getElementById('fichasGrid');
    const emptyState = document.getElementById('fichasEmptyState');
    grid.innerHTML = '';

    const filtered = this.fichas.filter(f => {
      const matchEstado = (this.currentEstadoFilter === 'TODAS') || (f.estado === this.currentEstadoFilter);
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        f.numero.toLowerCase().includes(q) ||
        f.programa.toLowerCase().includes(q) ||
        (f.centro && f.centro.toLowerCase().includes(q));

      return matchEstado && matchSearch;
    });

    if (filtered.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    filtered.forEach(f => {
      const card = document.createElement('div');
      card.className = 'ficha-card';
      card.onclick = () => this.openFichaDetail(f.id);

      const numAprendices = f.aprendices ? f.aprendices.length : 0;
      const numReportes = f.reportes ? f.reportes.length : 0;

      card.innerHTML = `
        <div class="ficha-card-header">
          <div class="ficha-number">
            <i class="ph ph-folder-notch-open"></i> Ficha ${f.numero}
          </div>
          <span class="badge ${f.estado.replace(/\s+/g, '.')}">${f.estado}</span>
        </div>
        <div class="ficha-program">${f.programa}</div>
        <div class="ficha-meta">
          <div class="ficha-meta-item">
            <i class="ph ph-clock"></i> <span>Modalidad: ${f.jornada}</span>
          </div>
          <div class="ficha-meta-item">
            <i class="ph ph-calendar"></i> <span>${f.fechaInicio} al ${f.fechaFin}</span>
          </div>
          <div class="ficha-meta-item">
            <i class="ph ph-buildings"></i> <span>${f.regional}</span>
          </div>
        </div>
        <div class="ficha-card-footer">
          <div class="learners-count">
            <i class="ph ph-users"></i> ${numAprendices} Aprendices
            ${numReportes > 0 ? `<span style="margin-left: 0.5rem; color: #059669;"><i class="ph ph-check"></i> ${numReportes} Reportes</span>` : ''}
          </div>
          <span class="enter-link">
            Gestionar <i class="ph ph-arrow-right"></i>
          </span>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  filterFichas() {
    const input = document.getElementById('searchInput');
    this.searchQuery = input.value;
    document.getElementById('clearSearchBtn').style.display = this.searchQuery ? 'block' : 'none';
    this.renderFichasGrid();
  }

  clearSearch() {
    document.getElementById('searchInput').value = '';
    this.searchQuery = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    this.renderFichasGrid();
  }

  setEstadoFilter(estado) {
    this.currentEstadoFilter = estado;
    document.querySelectorAll('.filter-chips .chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-filter') === estado);
    });
    this.renderFichasGrid();
  }

  resetFilters() {
    this.clearSearch();
    this.setEstadoFilter('TODAS');
  }

  // Modal Nueva Ficha
  openNewFichaModal() {
    document.getElementById('fichaForm').reset();
    document.getElementById('modalFicha').style.display = 'flex';
  }

  handleSaveFicha(e) {
    e.preventDefault();
    const numero = document.getElementById('inputNumeroFicha').value.trim();
    const programa = document.getElementById('inputPrograma').value.trim();
    const codigo = document.getElementById('inputCodigoPrograma').value.trim();
    const jornada = document.getElementById('selectJornada').value;
    const estado = document.getElementById('selectEstadoFicha').value;
    const fechaInicio = document.getElementById('inputFechaInicio').value;
    const fechaFin = document.getElementById('inputFechaFin').value;
    const regional = document.getElementById('inputRegional').value.trim();
    const centro = document.getElementById('inputCentro').value.trim();

    // Validar duplicado
    const exists = this.fichas.find(f => f.numero === numero);
    if (exists) {
      alert(`La ficha número ${numero} ya se encuentra registrada en el sistema.`);
      return;
    }

    const newFicha = {
      id: 'ficha_' + numero,
      numero,
      programa,
      codigo: codigo || '228118',
      version: '1',
      jornada,
      estado,
      fechaInicio,
      fechaFin,
      regional: regional || '41 - REGIONAL HUILA',
      centro: centro || '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
      aprendices: [],
      reportes: [],
      juicios: []
    };

    this.fichas.unshift(newFicha);
    this.saveData();
    this.updateGlobalMetrics();
    this.renderFichasGrid();
    this.closeModal('modalFicha');
    this.showToast(`Ficha ${numero} registrada exitosamente.`);
  }

  // ==========================================
  // VISTA 2: DETALLE DE FICHA Y JUICIOS (HU-008)
  // ==========================================

  openFichaDetail(fichaId) {
    this.currentFicha = this.fichas.find(f => f.id === fichaId);
    if (!this.currentFicha) return;

    // Encabezado Detalle
    document.getElementById('detailFichaNumero').innerText = `Ficha ${this.currentFicha.numero}`;
    document.getElementById('detailFichaPrograma').innerText = this.currentFicha.programa;
    document.getElementById('detailFichaCodigo').innerText = `Código: ${this.currentFicha.codigo} v.${this.currentFicha.version || 1}`;
    
    const estadoBadge = document.getElementById('detailFichaEstado');
    estadoBadge.innerText = this.currentFicha.estado;
    estadoBadge.className = `badge ${this.currentFicha.estado.replace(/\s+/g, '.')}`;

    // Actualizar contadores de pestañas
    document.getElementById('tabCountAprendices').innerText = this.currentFicha.aprendices ? this.currentFicha.aprendices.length : 0;

    // Renderizar contenidos
    this.renderFichaJuiciosOverview();
    this.renderReportsHistory();
    this.renderJuiciosTable();
    this.renderAprendicesTable();
    this.renderInfoFichaTab();

    // Mostrar Vista
    document.getElementById('viewFichas').classList.remove('active');
    document.getElementById('viewFichaDetail').classList.add('active');
    document.getElementById('viewAsistente').classList.remove('active');
    this.switchFichaTab('juicios');
  }

  showFichasView() {
    document.getElementById('viewFichas').classList.add('active');
    document.getElementById('viewFichaDetail').classList.remove('active');
    document.getElementById('viewAsistente').classList.remove('active');

    document.getElementById('navFichasBtn').classList.add('active');
    document.getElementById('navReportesBtn').classList.remove('active');
    document.getElementById('navAsistenteBtn').classList.remove('active');

    this.renderFichasGrid();
    this.updateGlobalMetrics();
  }

  showReportesView() {
    // Si hay una ficha abierta, va al detalle, sino abre la primera activa
    if (!this.currentFicha && this.fichas.length > 0) {
      this.openFichaDetail(this.fichas[0].id);
    } else if (this.currentFicha) {
      this.openFichaDetail(this.currentFicha.id);
    }
  }

  showAsistenteView() {
    document.getElementById('viewFichas').classList.remove('active');
    document.getElementById('viewFichaDetail').classList.remove('active');
    document.getElementById('viewAsistente').classList.add('active');

    document.getElementById('navFichasBtn').classList.remove('active');
    document.getElementById('navReportesBtn').classList.remove('active');
    document.getElementById('navAsistenteBtn').classList.add('active');
  }

  switchFichaTab(tabName) {
    const tabs = ['juicios', 'aprendices', 'info'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}Btn`);
      const content = document.getElementById(`tabContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
      if (btn) btn.classList.toggle('active', t === tabName);
      if (content) content.classList.toggle('active', t === tabName);
    });
  }

  // ==========================================
  // PARSER REAL DE EXCEL SOFIA PLUS (.xls / .xlsx)
  // ==========================================

  setupDropzone() {
    const dropzone = document.getElementById('dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
        dropzone.style.background = '#eef9ec';
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#93c5fd';
        dropzone.style.background = '#f0f7ff';
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        this.processExcelFile(files[0]);
      }
    });
  }

  openUploadReportModal() {
    document.getElementById('excelFileInput').click();
  }

  handleExcelSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.processExcelFile(file);
    }
    event.target.value = '';
  }

  processExcelFile(file) {
    if (!window.XLSX) {
      alert("La biblioteca SheetJS aún se está cargando. Comprueba tu conexión o espera un instante.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        const parsed = this.extractSenaExcelData(sheet, file.name);
        this.pendingParsedReport = parsed;
        this.showPreviewReportModal(parsed);
      } catch (err) {
        console.error("Error al procesar archivo Excel:", err);
        alert("Ocurrió un error al procesar el archivo Excel. Asegúrate de que sea un reporte oficial de SOFIA Plus con extensión .xls o .xlsx.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Extracción de Cabecera (Filas 1 a 12) y Matriz de Juicios (Fila 13+)
  extractSenaExcelData(sheet, filename) {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    // 1. Extraer Metadatos Institucionales de Cabecera
    const meta = {
      filename,
      fechaReporte: '',
      numeroFicha: '',
      codigoPrograma: '',
      version: '',
      denominacion: '',
      estadoFicha: '',
      fechaInicio: '',
      fechaFin: '',
      modalidad: '',
      regional: '',
      centro: ''
    };

    let headerRowIndex = -1;

    // Escanear las primeras 20 filas para encontrar cabecera y encabezados
    for (let r = 0; r < Math.min(rows.length, 25); r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const colA = String(row[0] || '').trim().toLowerCase();
      const colB = String(row[1] || '').trim();

      if (colA.includes('fecha del reporte')) meta.fechaReporte = colB;
      if (colA.includes('ficha de caracterizaci')) meta.numeroFicha = colB;
      if (colA.includes('cógigo') || colA.includes('código')) meta.codigoPrograma = colB;
      if (colA.includes('versión') || colA.includes('version')) meta.version = colB;
      if (colA.includes('denominación') || colA.includes('denominacion')) meta.denominacion = colB;
      if (colA.includes('estado de la ficha')) meta.estadoFicha = colB;
      if (colA.includes('fecha inicio')) meta.fechaInicio = colB;
      if (colA.includes('fecha fin')) meta.fechaFin = colB;
      if (colA.includes('modalidad de formación')) meta.modalidad = colB;
      if (colA.includes('regional')) meta.regional = colB;
      if (colA.includes('centro de formación')) meta.centro = colB;

      // Buscar fila donde inician los encabezados de columnas
      const rowJoined = row.map(c => String(c).toLowerCase()).join(' ');
      if (rowJoined.includes('tipo de documento') || rowJoined.includes('número de documento') || rowJoined.includes('juicio de evaluación')) {
        headerRowIndex = r;
      }
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 12; // Posición estándar por defecto (Fila 13 de Excel)
    }

    // 2. Extraer Filas de Datos de Aprendices y Juicios
    const juicios = [];
    const aprendicesMap = new Map();

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;

      const tipoDoc = String(row[0] || '').trim();
      const numDoc = String(row[1] || '').trim();
      const nombre = String(row[2] || '').trim();
      const apellidos = String(row[3] || '').trim();
      const estadoApr = String(row[4] || '').trim();
      const competencia = String(row[5] || '').trim();
      const rap = String(row[6] || '').trim();
      
      // Manejo de posibles celdas combinadas para el Juicio de Evaluación
      let juicioVal = String(row[7] || '').trim();
      if (!juicioVal && row[8] && (String(row[8]).trim() === 'APROBADO' || String(row[8]).trim() === 'NO APROBADO')) {
        juicioVal = String(row[8]).trim();
      }

      // Normalizar Juicio
      let juicioNormalizado = 'POR EVALUAR';
      const jUpper = juicioVal.toUpperCase();
      if (jUpper.includes('APROBADO') && !jUpper.includes('NO')) {
        juicioNormalizado = 'APROBADO';
      } else if (jUpper.includes('NO APROBADO') || jUpper.includes('DEFICIENTE')) {
        juicioNormalizado = 'NO APROBADO';
      }

      // Fecha y funcionario
      const fechaHoraJuicio = String(row[8] || row[9] || '').trim();
      const funcionario = String(row[9] || row[10] || '').trim();

      if (numDoc) {
        juicios.push({
          tipoDoc,
          numDoc,
          nombre,
          apellidos,
          estadoApr,
          competencia,
          rap,
          juicio: juicioNormalizado,
          juicioOriginal: juicioVal,
          fechaHoraJuicio,
          funcionario
        });

        if (!aprendicesMap.has(numDoc)) {
          aprendicesMap.set(numDoc, {
            tipoDoc,
            numDoc,
            nombreCompleto: `${nombre} ${apellidos}`.trim(),
            nombre,
            apellidos,
            estado: estadoApr || 'EN FORMACION',
            aprobados: 0,
            pendientes: 0,
            noAprobados: 0
          });
        }

        const apr = aprendicesMap.get(numDoc);
        if (juicioNormalizado === 'APROBADO') apr.aprobados++;
        else if (juicioNormalizado === 'NO APROBADO') apr.noAprobados++;
        else apr.pendientes++;
      }
    }

    return {
      meta,
      juicios,
      aprendices: Array.from(aprendicesMap.values())
    };
  }

  showPreviewReportModal(parsed) {
    const metaBox = document.getElementById('previewMetaBox');
    const statsRow = document.getElementById('previewStatsRow');

    const totalJuicios = parsed.juicios.length;
    const aprobados = parsed.juicios.filter(j => j.juicio === 'APROBADO').length;
    const pendientes = parsed.juicios.filter(j => j.juicio === 'POR EVALUAR').length;
    const noAprobados = parsed.juicios.filter(j => j.juicio === 'NO APROBADO').length;

    metaBox.innerHTML = `
      <div class="preview-meta-item">
        <span>Ficha de Caracterización</span>
        <span>${parsed.meta.numeroFicha || this.currentFicha.numero}</span>
      </div>
      <div class="preview-meta-item">
        <span>Fecha del Reporte</span>
        <span>${parsed.meta.fechaReporte || 'Detectada en archivo'}</span>
      </div>
      <div class="preview-meta-item">
        <span>Programa</span>
        <span>${parsed.meta.denominacion || this.currentFicha.programa}</span>
      </div>
      <div class="preview-meta-item">
        <span>Estado Ficha</span>
        <span>${parsed.meta.estadoFicha || this.currentFicha.estado}</span>
      </div>
      <div class="preview-meta-item">
        <span>Centro de Formación</span>
        <span>${parsed.meta.centro || this.currentFicha.centro}</span>
      </div>
      <div class="preview-meta-item">
        <span>Regional</span>
        <span>${parsed.meta.regional || this.currentFicha.regional}</span>
      </div>
    `;

    statsRow.innerHTML = `
      <div class="preview-stat-card">
        <strong style="color: var(--secondary);">${parsed.aprendices.length}</strong>
        <span>Aprendices Únicos</span>
      </div>
      <div class="preview-stat-card">
        <strong style="color: #059669;">${aprobados}</strong>
        <span>Juicios Aprobados</span>
      </div>
      <div class="preview-stat-card">
        <strong style="color: #d97706;">${pendientes}</strong>
        <span>Por Evaluar / Pendientes</span>
      </div>
      <div class="preview-stat-card">
        <strong style="color: #dc2626;">${noAprobados}</strong>
        <span>No Aprobados</span>
      </div>
    `;

    document.getElementById('modalPreviewReporte').style.display = 'flex';
  }

  confirmImportReport() {
    if (!this.pendingParsedReport || !this.currentFicha) return;

    const parsed = this.pendingParsedReport;

    // 1. Guardar o asociar reporte
    const newReportRecord = {
      id: 'rep_' + Date.now(),
      filename: parsed.meta.filename,
      fechaReporte: parsed.meta.fechaReporte,
      fechaCarga: new Date().toLocaleString(),
      totalAprendices: parsed.aprendices.length,
      totalJuicios: parsed.juicios.length,
      aprobados: parsed.juicios.filter(j => j.juicio === 'APROBADO').length,
      pendientes: parsed.juicios.filter(j => j.juicio === 'POR EVALUAR').length,
      noAprobados: parsed.juicios.filter(j => j.juicio === 'NO APROBADO').length
    };

    if (!this.currentFicha.reportes) this.currentFicha.reportes = [];
    this.currentFicha.reportes.unshift(newReportRecord);

    // 2. Sincronizar Aprendices
    if (!this.currentFicha.aprendices) this.currentFicha.aprendices = [];
    parsed.aprendices.forEach(nuevoApr => {
      const idx = this.currentFicha.aprendices.findIndex(a => a.numDoc === nuevoApr.numDoc);
      if (idx >= 0) {
        this.currentFicha.aprendices[idx] = nuevoApr;
      } else {
        this.currentFicha.aprendices.push(nuevoApr);
      }
    });

    // 3. Guardar matriz de juicios
    this.currentFicha.juicios = parsed.juicios;

    // 4. Si la cabecera traía datos enriquecidos, sincronizarlos
    if (parsed.meta.denominacion) this.currentFicha.programa = parsed.meta.denominacion;
    if (parsed.meta.centro) this.currentFicha.centro = parsed.meta.centro;
    if (parsed.meta.regional) this.currentFicha.regional = parsed.meta.regional;

    this.saveData();
    this.updateGlobalMetrics();

    // Actualizar Vistas
    this.renderFichaJuiciosOverview();
    this.renderReportsHistory();
    this.renderJuiciosTable();
    this.renderAprendicesTable();
    this.renderInfoFichaTab();
    document.getElementById('tabCountAprendices').innerText = this.currentFicha.aprendices.length;

    this.closeModal('modalPreviewReporte');
    this.showToast(`Reporte importado: ${parsed.juicios.length} juicios y ${parsed.aprendices.length} aprendices sincronizados.`);
  }

  renderFichaJuiciosOverview() {
    const statsBox = document.getElementById('statsOverview');
    if (!this.currentFicha.juicios || this.currentFicha.juicios.length === 0) {
      statsBox.style.display = 'none';
      return;
    }

    statsBox.style.display = 'grid';
    const total = this.currentFicha.juicios.length;
    const aprobados = this.currentFicha.juicios.filter(j => j.juicio === 'APROBADO').length;
    const pendientes = this.currentFicha.juicios.filter(j => j.juicio === 'POR EVALUAR').length;
    const noAprobados = this.currentFicha.juicios.filter(j => j.juicio === 'NO APROBADO').length;
    const porcentaje = total > 0 ? ((aprobados / total) * 100).toFixed(1) : 0;

    document.getElementById('statAprobados').innerText = aprobados;
    document.getElementById('statPendientes').innerText = pendientes;
    document.getElementById('statNoAprobados').innerText = noAprobados;
    document.getElementById('statPorcentaje').innerText = `${porcentaje}%`;
  }

  renderReportsHistory() {
    const list = document.getElementById('reportsHistoryList');
    list.innerHTML = '';

    if (!this.currentFicha.reportes || this.currentFicha.reportes.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 1.5rem; background: white; border-radius: var(--radius-md); border: 1px dashed var(--border);">
          <i class="ph ph-file-dashed" style="font-size: 2rem;"></i>
          <p style="margin-top: 0.5rem;">No se han cargado reportes Excel para esta ficha todavía.</p>
        </div>
      `;
      return;
    }

    this.currentFicha.reportes.forEach(rep => {
      const item = document.createElement('div');
      item.className = 'report-item';
      item.innerHTML = `
        <div class="report-item-left">
          <div class="report-item-icon">
            <i class="ph ph-file-xls"></i>
          </div>
          <div>
            <div class="report-item-title">${rep.filename}</div>
            <div class="report-item-meta">
              <span><i class="ph ph-calendar"></i> Fecha Reporte: ${rep.fechaReporte || 'N/A'}</span>
              <span><i class="ph ph-clock"></i> Procesado: ${rep.fechaCarga}</span>
            </div>
          </div>
        </div>
        <div class="report-stats-tags">
          <span class="tag-stat green">${rep.aprobados} Aprobados</span>
          <span class="tag-stat yellow">${rep.pendientes} Pendientes</span>
          <span class="tag-stat" style="background:#f1f5f9; color: var(--text-primary);">${rep.totalAprendices} Aprendices</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  renderJuiciosTable() {
    const container = document.getElementById('juiciosTableContainer');
    const tbody = document.getElementById('juiciosTableBody');
    const filterEstado = document.getElementById('filterJuicioEstado').value;

    if (!this.currentFicha.juicios || this.currentFicha.juicios.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    tbody.innerHTML = '';

    const filtered = this.currentFicha.juicios.filter(j => {
      if (filterEstado === 'TODOS') return true;
      if (filterEstado === 'APROBADO') return j.juicio === 'APROBADO';
      if (filterEstado === 'PENDIENTE') return j.juicio === 'POR EVALUAR';
      if (filterEstado === 'NO APROBADO') return j.juicio === 'NO APROBADO';
      return true;
    });

    document.getElementById('tableRecordCount').innerText = `Mostrando ${filtered.length} de ${this.currentFicha.juicios.length} juicios`;

    // Renderizar primeros 100 para fluidez en DOM
    filtered.slice(0, 100).forEach(j => {
      const tr = document.createElement('tr');
      const badgeClass = j.juicio === 'APROBADO' ? 'aprobado' : (j.juicio === 'NO APROBADO' ? 'no-aprobado' : 'pendiente');

      tr.innerHTML = `
        <td><span class="code-tag">${j.tipoDoc || 'CC'}</span></td>
        <td><strong>${j.numDoc}</strong></td>
        <td>${j.nombre} ${j.apellidos}</td>
        <td><small style="color: var(--text-secondary);">${j.estadoApr || 'EN FORMACION'}</small></td>
        <td style="max-width: 250px;"><small>${j.competencia}</small></td>
        <td style="max-width: 280px;"><small>${j.rap}</small></td>
        <td><span class="judgment-badge ${badgeClass}">${j.juicio}</span></td>
        <td><small>${j.fechaHoraJuicio || '-'}</small></td>
        <td><small>${j.funcionario || 'SISTEMA'}</small></td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderAprendicesTable() {
    const tbody = document.getElementById('aprendicesTableBody');
    const countSubtitle = document.getElementById('aprendicesCountSubtitle');
    tbody.innerHTML = '';

    if (!this.currentFicha.aprendices || this.currentFicha.aprendices.length === 0) {
      countSubtitle.innerText = '0 aprendices';
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay aprendices registrados. Carga un reporte de juicios para sincronizar la lista automáticamente.</td></tr>`;
      return;
    }

    countSubtitle.innerText = `${this.currentFicha.aprendices.length} aprendices matriculados`;

    this.currentFicha.aprendices.forEach(apr => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="code-tag">${apr.tipoDoc || 'CC'}</span></td>
        <td><strong>${apr.numDoc}</strong></td>
        <td>${apr.nombreCompleto}</td>
        <td><span class="badge green">${apr.estado || 'EN FORMACION'}</span></td>
        <td><strong style="color: #059669;">${apr.aprobados}</strong></td>
        <td><strong style="color: #d97706;">${apr.pendientes}</strong></td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderInfoFichaTab() {
    const grid = document.getElementById('infoCardGrid');
    if (!this.currentFicha) return;

    grid.innerHTML = `
      <div class="metric-card">
        <div class="metric-icon green"><i class="ph ph-hash"></i></div>
        <div class="metric-data">
          <span class="metric-number">${this.currentFicha.numero}</span>
          <span class="metric-label">Número de Ficha Institucional</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon blue"><i class="ph ph-certificate"></i></div>
        <div class="metric-data">
          <span class="metric-number">${this.currentFicha.codigo}</span>
          <span class="metric-label">Código Programa (${this.currentFicha.programa})</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon orange"><i class="ph ph-map-pin"></i></div>
        <div class="metric-data">
          <span class="metric-number" style="font-size: 1.1rem; line-height: 1.3;">${this.currentFicha.centro}</span>
          <span class="metric-label">${this.currentFicha.regional}</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon purple"><i class="ph ph-calendar-check"></i></div>
        <div class="metric-data">
          <span class="metric-number" style="font-size: 1.1rem;">${this.currentFicha.fechaInicio} al ${this.currentFicha.fechaFin}</span>
          <span class="metric-label">Vigencia Etapa Lectiva y Productiva</span>
        </div>
      </div>
    `;
  }

  // ==========================================
  // VISTA 3: ASISTENTE IA PARA EL REGLAMENTO (HU-006)
  // ==========================================

  sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const chatMessages = document.getElementById('chatMessages');

    // Mensaje Usuario
    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.innerHTML = `<div class="message-bubble">${text}</div>`;
    chatMessages.appendChild(userMsg);
    input.value = '';

    // Respuesta IA simulada con conocimiento normativo del Acuerdo 007 de 2012
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'message bot';
      const botResponse = this.generateBotRegulationResponse(text);

      botMsg.innerHTML = `
        <i class="ph ph-robot message-icon"></i>
        <div class="message-bubble">${botResponse}</div>
      `;
      chatMessages.appendChild(botMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 400);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  generateBotRegulationResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('asistencia') || q.includes('inasistencia') || q.includes('falta')) {
      return `De acuerdo con el <strong>Artículo 22 del Reglamento del Aprendiz SENA</strong>:<br/>
      • Las inasistencias deben ser justificadas ante el instructor dentro de los <strong>tres (3) días hábiles siguientes</strong> a su ocurrencia.<br/>
      • Son causales justificadas: incapacidad médica certificada por EPS/Sisalud, calamidad doméstica demostrada, fuerza mayor o comisiones oficiales.<br/>
      • Si el aprendiz acumula inasistencias injustificadas superiores a 3 días consecutivos o no consecutivos equivalentes a un porcentaje representativo de la competencia, se inicia el debido proceso para <strong>deserción</strong> (Art. 22 numeral 4).`;
    }

    if (q.includes('comite') || q.includes('comité') || q.includes('evaluacion') || q.includes('seguimiento')) {
      return `Conforme al <strong>Artículo 29 del Reglamento</strong>:<br/>
      El <strong>Comité de Evaluación y Seguimiento</strong> es la instancia asesora del Subdirector de Centro para analizar el rendimiento académico y disciplinario de los aprendices.<br/>
      • El aprendiz tiene derecho a ser escuchado en descargos y aportar evidencias.<br/>
      • El comité recomienda medidas formativas (Planes de mejoramiento, llamado de atención escrito) o sancionatorias (condicionamiento o cancelación de matrícula).`;
    }

    if (q.includes('derechos') || q.includes('derecho')) {
      return `Según el <strong>Artículo 7 del Reglamento del Aprendiz</strong>, son derechos fundamentales:<br/>
      1. Recibir formación profesional integral de calidad conforme al programa curricular.<br/>
      2. Hacer uso de los ambientes de aprendizaje, recursos bibliográficos y herramientas TIC.<br/>
      3. Ser evaluado con criterios objetivos y conocer oportunamente los juicios evaluativos (Aprobado/Por evaluar).<br/>
      4. Solicitar revisión de evaluaciones dentro de los términos establecidos.`;
    }

    return `Basado en el <strong>Reglamento del Aprendiz SENA (Acuerdo institucional)</strong>:<br/>
    Su consulta ha sido procesada. Todo procedimiento formativo garantiza el debido proceso, el derecho a la defensa y la trazabilidad de los juicios evaluativos en SOFIA Plus / Zajuna.<br/>
    <em>¿Deseas profundizar en faltas disciplinarias, planes de mejoramiento o trámites de aplazamiento y traslado?</em>`;
  }

  // Utilidades de Interfaz
  closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

  showToast(message) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastMessage').innerText = message;
    toast.style.display = 'flex';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }
}

// Inicialización global
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new ControlSystemApp();
});

