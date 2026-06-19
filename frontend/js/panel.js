// ──────────────────────────────────────────────────
// Panel Admin — SPA con hash routing
// ──────────────────────────────────────────────────

const ESTADOS_EMPRESA = [
  'diagnosticada','invitada','postulada','en_evaluacion',
  'certificada','vencida','rechazada'
];
const NIVELES = ['A1','A2','A3','A4','A5'];
const TAMANIOS = ['micro','pequena','mediana'];
const DIMENSIONES = [
  { key: 'gobernanza', label: 'Gobernanza' },
  { key: 'datos',      label: 'Datos' },
  { key: 'modelo',     label: 'Modelo de IA' },
  { key: 'operacion',  label: 'Operación' },
  { key: 'cultura',    label: 'Cultura' },
];

const $main = () => document.getElementById('view');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

let USER = null;

// ── Router ──
const routes = {
  '':              viewDashboard,
  'empresas':      viewEmpresas,
  'empresa':       viewEmpresaDetalle,
  'nueva':         viewEmpresaNueva,
  'diagnosticos':  viewDiagnosticos,
  'certificaciones': viewCertificaciones,
  'certificacion': viewCertificacionDetalle,
  'red':           viewRed,
  'nuevo-miembro': viewNuevoMiembro,
  'pagos':         viewPagos,
  'contactos':     viewContactos,
  'contacto':      viewContactoDetalle,
  'reportes':      viewReportes,
  'pipeline':      viewPipeline,
  'contenidos':    viewContenidos,
  'nuevo-contenido': viewContenidoForm,
  'contenido':     viewContenidoDetalle,
  'recursos':      viewRecursos,
  'nuevo-recurso': viewRecursoForm,
  'adherentes-admin': viewAdherentesAdmin,
};

async function route() {
  const hash = location.hash.replace('#/', '');
  const [path, ...params] = hash.split('/');
  const handler = routes[path] || routes[''];
  document.querySelectorAll('.sidebar nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#/${path}`);
  });
  await handler(params);
}

window.addEventListener('hashchange', route);

// ── Boot ──
(async () => {
  await API.init();
  USER = await API.getCurrentUser();
  if (!USER) return location.href = '/';
  if (USER.rol !== 'admin') {
    $main().innerHTML = `<div class="alert alert-error">Acceso restringido: solo administradores.</div>`;
    return;
  }
  document.getElementById('user-label').textContent = `${USER.nombre} ${USER.apellido}`;
  document.getElementById('user-avatar').textContent = (USER.nombre || '?')[0].toUpperCase();
  document.getElementById('logout').onclick = () => API.logout();
  route();
})();

// ── DASHBOARD ──
async function viewDashboard() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;

  const [emp, diag, cert, cont] = await Promise.all([
    API.get('/empresas'),
    API.get('/diagnosticos'),
    API.get('/certificaciones'),
    API.get('/contactos').catch(() => ({ data: [] })),
  ]);

  const empresas = emp.data || [];
  const diagnosticos = diag.data || [];
  const certificaciones = cert.data || [];
  const contactos = cont.data || [];
  const contactosNuevos = contactos.filter(c => c.estado === 'nuevo').length;

  const certificadas = empresas.filter(e => e.estado === 'certificada').length;
  const enProceso = certificaciones.filter(c => ['en_evaluacion','dictamen_emitido','pagada'].includes(c.estado)).length;

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Panorama general</span>
        <h1>Dashboard</h1>
        <div class="sub">Estado actual del sistema · ${new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })}</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><div class="num">${empresas.length}</div><div class="label">Empresas</div></div>
      <div class="stat"><div class="num">${diagnosticos.length}</div><div class="label">Diagnósticos</div></div>
      <div class="stat"><div class="num">${enProceso}</div><div class="label">En evaluación</div></div>
      <div class="stat"><div class="num">${certificadas}</div><div class="label">Certificadas</div></div>
      <div class="stat" ${contactosNuevos > 0 ? 'style="border-left-color:var(--error)"' : ''}>
        <div class="num">${contactosNuevos}</div>
        <div class="label">${contactosNuevos > 0 ? '⚠ Contactos sin leer' : 'Contactos sin leer'}</div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:1rem">Últimos diagnósticos</h3>
      ${diagnosticos.length === 0
        ? `<div class="empty">Todavía no hay diagnósticos completados.</div>`
        : tablaDiagnosticos(diagnosticos.slice(0, 5))}
    </div>
  `;
}

// ── EMPRESAS ──
async function viewEmpresas() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  const { data } = await API.get('/empresas');
  const empresas = data || [];

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <h1>Empresas</h1>
        <div class="sub">${empresas.length} ${empresas.length === 1 ? 'empresa registrada' : 'empresas registradas'}</div>
      </div>
      <a href="#/nueva" class="btn btn-gold">+ Nueva empresa</a>
    </div>

    ${empresas.length === 0
      ? `<div class="card empty">Todavía no hay empresas cargadas. Empezá creando una desde el botón "+ Nueva empresa".</div>`
      : `<div class="card" style="padding:0;overflow:hidden">
          <table>
            <thead><tr>
              <th>Razón Social</th><th>País</th><th>Nivel</th><th>Estado</th><th>Email</th><th>Alta</th>
            </tr></thead>
            <tbody>
              ${empresas.map(e => `
                <tr onclick="location.hash='#/empresa/${e.id}'">
                  <td><strong>${e.razon_social}</strong></td>
                  <td>${e.pais || '—'}</td>
                  <td>${e.nivel_actual ? `<span class="badge badge-${e.nivel_actual}">${e.nivel_actual}</span>` : '—'}</td>
                  <td><span class="estado estado-${e.estado}">${e.estado.replace('_',' ')}</span></td>
                  <td>${e.email_contacto}</td>
                  <td>${fmtDate(e.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
  `;
}

async function viewEmpresaNueva() {
  $main().innerHTML = `
    <div class="page-head">
      <div>
        <h1>Nueva empresa</h1>
        <div class="sub">Cargá los datos básicos. Después podés completar el resto desde la ficha.</div>
      </div>
      <a href="#/empresas" class="btn btn-outline">← Volver</a>
    </div>

    <div id="alert"></div>

    <div class="card">
      <form id="form-empresa">
        <div class="grid-2">
          <div>
            <div class="field"><label>Razón social *</label><input name="razon_social" required></div>
            <div class="field"><label>Nombre comercial</label><input name="nombre_comercial"></div>
            <div class="field"><label>Email de contacto *</label><input name="email_contacto" type="email" required></div>
            <div class="field"><label>Teléfono</label><input name="telefono"></div>
            <div class="field"><label>Sitio web</label><input name="sitio_web" placeholder="https://"></div>
          </div>
          <div>
            <div class="field"><label>País</label><input name="pais" value="Argentina"></div>
            <div class="field"><label>Provincia / Estado</label><input name="provincia"></div>
            <div class="field"><label>Industria</label><input name="industria"></div>
            <div class="field"><label>Tamaño</label>
              <select name="tamanio">
                <option value="">— Seleccionar —</option>
                ${TAMANIOS.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
            <div class="field"><label>Notas internas</label><textarea name="notas_internas" rows="3"></textarea></div>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Crear empresa</button>
      </form>
    </div>
  `;

  document.getElementById('form-empresa').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    Object.keys(body).forEach(k => body[k] === '' && delete body[k]);
    try {
      const { data } = await API.post('/empresas', body);
      location.hash = `#/empresa/${data.id}`;
    } catch (err) {
      document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  };
}

// ── DETALLE EMPRESA ──
async function viewEmpresaDetalle([id]) {
  if (!id) return location.hash = '#/empresas';
  $main().innerHTML = `<div class="empty">Cargando…</div>`;

  let empresa;
  try {
    const { data } = await API.get(`/empresas/${id}`);
    empresa = data;
  } catch (err) {
    return $main().innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }

  const diagnosticos = empresa.diagnosticos || [];
  const certs = empresa.certificaciones || [];
  const sellos = empresa.sellos || [];

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <h1>${empresa.razon_social}</h1>
        <div class="sub">
          <span class="estado estado-${empresa.estado}">${empresa.estado.replace('_',' ')}</span>
          ${empresa.nivel_actual ? `<span class="badge badge-${empresa.nivel_actual}" style="margin-left:0.5rem">Nivel ${empresa.nivel_actual}</span>` : ''}
        </div>
      </div>
      <a href="#/empresas" class="btn btn-outline">← Volver</a>
    </div>

    <div id="alert"></div>

    <div class="grid-2">
      <div class="card">
        <h3 style="margin-bottom:1rem">Datos generales</h3>
        <dl class="dl">
          <dt>Nombre comercial</dt><dd>${empresa.nombre_comercial || '—'}</dd>
          <dt>Email</dt><dd>${empresa.email_contacto}</dd>
          <dt>Teléfono</dt><dd>${empresa.telefono || '—'}</dd>
          <dt>Sitio web</dt><dd>${empresa.sitio_web ? `<a href="${empresa.sitio_web}" target="_blank">${empresa.sitio_web}</a>` : '—'}</dd>
          <dt>País</dt><dd>${empresa.pais}</dd>
          <dt>Provincia</dt><dd>${empresa.provincia || '—'}</dd>
          <dt>Industria</dt><dd>${empresa.industria || '—'}</dd>
          <dt>Tamaño</dt><dd>${empresa.tamanio || '—'}</dd>
          <dt>Alta</dt><dd>${fmtDate(empresa.created_at)}</dd>
        </dl>
        ${empresa.notas_internas ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
          <strong style="font-size:0.8rem;text-transform:uppercase;color:var(--muted)">Notas internas</strong>
          <p style="margin-top:0.5rem">${empresa.notas_internas}</p>
        </div>` : ''}
      </div>

      <div class="card">
        <h3 style="margin-bottom:1rem">Cambiar estado</h3>
        <div class="field">
          <select id="nuevo-estado">
            ${ESTADOS_EMPRESA.map(e => `<option value="${e}" ${e === empresa.estado ? 'selected' : ''}>${e.replace('_',' ')}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary btn-block" onclick="cambiarEstado('${empresa.id}')">Actualizar estado</button>

        <h3 style="margin:2rem 0 1rem">Iniciar certificación</h3>
        <div class="field">
          <label>Nivel a certificar</label>
          <select id="nivel-cert">
            ${NIVELES.map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-gold btn-block" onclick="iniciarCertificacion('${empresa.id}')">+ Crear certificación</button>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:1rem">Diagnósticos (${diagnosticos.length})</h3>
      ${diagnosticos.length === 0
        ? `<div class="empty">Sin diagnósticos asociados.</div>`
        : `<table>
            <thead><tr><th>Fecha</th><th>Nivel</th><th>Puntaje</th></tr></thead>
            <tbody>${diagnosticos.map(d => `
              <tr><td>${fmtDate(d.completado_en)}</td>
              <td><span class="badge badge-${d.nivel_resultado}">${d.nivel_resultado}</span></td>
              <td>${d.puntaje_total}</td></tr>
            `).join('')}</tbody>
          </table>`}
    </div>

    <div class="card">
      <h3 style="margin-bottom:1rem">Certificaciones (${certs.length})</h3>
      ${certs.length === 0
        ? `<div class="empty">Aún no hay procesos de certificación iniciados.</div>`
        : `<table>
            <thead><tr><th>Nivel</th><th>Estado</th><th>Emisión</th><th></th></tr></thead>
            <tbody>${certs.map(c => `
              <tr>
                <td><span class="badge badge-${c.nivel_solicitado}">${c.nivel_solicitado}</span></td>
                <td><span class="estado">${c.estado.replace('_',' ')}</span></td>
                <td>${fmtDate(c.fecha_emision)}</td>
                <td><a href="#/certificacion/${c.id}" class="btn btn-outline" style="padding:0.3rem 0.7rem;font-size:0.8rem">Abrir</a></td>
              </tr>
            `).join('')}</tbody>
          </table>`}
    </div>

    ${sellos.length > 0 ? `
    <div class="card">
      <h3 style="margin-bottom:1rem">Sellos vigentes</h3>
      <table>
        <thead><tr><th>Nivel</th><th>Código</th><th>Vence</th><th>Estado</th></tr></thead>
        <tbody>${sellos.map(s => `
          <tr><td><span class="badge badge-${s.nivel}">${s.nivel}</span></td>
          <td><code>${s.codigo_verificacion}</code></td>
          <td>${fmtDate(s.fecha_vencimiento)}</td>
          <td>${s.activo ? '<span class="estado estado-certificada">activo</span>' : '<span class="estado estado-vencida">inactivo</span>'}</td></tr>
        `).join('')}</tbody>
      </table>
    </div>` : ''}
  `;
}

window.cambiarEstado = async (id) => {
  const estado = document.getElementById('nuevo-estado').value;
  try {
    await API.patch(`/empresas/${id}/estado`, { estado });
    location.reload();
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
};

window.iniciarCertificacion = async (empresa_id) => {
  const nivel_solicitado = document.getElementById('nivel-cert').value;
  try {
    const { data } = await API.post('/certificaciones', { empresa_id, nivel_solicitado });
    location.hash = `#/certificacion/${data.id}`;
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
};

// ── CERTIFICACIONES ──
async function viewCertificaciones() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  const { data } = await API.get('/certificaciones');
  const certs = data || [];

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <h1>Certificaciones</h1>
        <div class="sub">${certs.length} procesos en el sistema</div>
      </div>
    </div>
    ${certs.length === 0
      ? `<div class="card empty">Aún no hay certificaciones iniciadas. Iniciá una desde la ficha de una empresa.</div>`
      : `<div class="card" style="padding:0;overflow:hidden">
          <table>
            <thead><tr><th>Empresa</th><th>Nivel</th><th>Estado</th><th>Dictamen</th><th>Postulación</th></tr></thead>
            <tbody>${certs.map(c => `
              <tr onclick="location.hash='#/certificacion/${c.id}'">
                <td><strong>${c.empresas?.razon_social || '—'}</strong></td>
                <td><span class="badge badge-${c.nivel_solicitado}">${c.nivel_solicitado}</span></td>
                <td><span class="estado">${c.estado.replace('_',' ')}</span></td>
                <td>${c.dictamen || '—'}</td>
                <td>${fmtDate(c.fecha_postulacion)}</td>
              </tr>
            `).join('')}</tbody>
          </table>
        </div>`}
  `;
}

// ── DETALLE CERTIFICACIÓN ──
async function viewCertificacionDetalle([id]) {
  if (!id) return location.hash = '#/certificaciones';
  $main().innerHTML = `<div class="empty">Cargando…</div>`;

  let cert;
  try {
    const { data } = await API.get(`/certificaciones/${id}`);
    cert = data;
  } catch (err) {
    return $main().innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }

  const evidencias = cert.evidencias || [];
  const evidenciasPorDim = DIMENSIONES.map(d => ({
    ...d,
    archivos: evidencias.filter(e => e.dimension === d.key),
  }));

  const puedeEmitirSello = cert.estado === 'dictamen_emitido' &&
    (cert.dictamen === 'aprobado' || cert.dictamen === 'aprobado_con_observaciones');

  // Timeline del proceso
  const PASOS = [
    { key: 'borrador',         lbl: 'Borrador' },
    { key: 'pendiente_pago',   lbl: 'Pago' },
    { key: 'pagada',           lbl: 'Pagada' },
    { key: 'en_evaluacion',    lbl: 'Evaluación' },
    { key: 'dictamen_emitido', lbl: 'Dictamen' },
    { key: 'aprobada',         lbl: 'Sello' },
  ];
  const idxActual = PASOS.findIndex(p => p.key === cert.estado);

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Proceso de certificación</span>
        <h1>${cert.empresas?.razon_social || ''}</h1>
        <div class="sub">
          <span class="badge badge-${cert.nivel_solicitado}">Nivel ${cert.nivel_solicitado}</span>
          <span class="estado" style="margin-left:0.25rem">${cert.estado.replace('_',' ')}</span>
          ${cert.dictamen ? `<span class="estado estado-${cert.dictamen === 'aprobado' ? 'certificada' : (cert.dictamen === 'rechazado' ? 'rechazada' : 'en_evaluacion')}" style="margin-left:0.25rem">Dictamen: ${cert.dictamen.replace(/_/g,' ')}</span>` : ''}
        </div>
      </div>
      <a href="#/empresa/${cert.empresa_id}" class="btn btn-outline">← Empresa</a>
    </div>

    <div class="card">
      <div class="timeline">
        ${PASOS.map((p, i) => `
          <div class="timeline-step ${i < idxActual ? 'done' : (i === idxActual ? 'active' : '')}">
            <div class="dot">${i < idxActual ? '✓' : (i+1)}</div>
            <div class="lbl">${p.lbl}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div id="alert"></div>

    <div class="grid-2">
      <div>
        <div class="card">
          <h3 style="margin-bottom:1rem">Datos del proceso</h3>
          <dl class="dl">
            <dt>Empresa</dt><dd>${cert.empresas?.razon_social || '—'}</dd>
            <dt>Email</dt><dd>${cert.empresas?.email_contacto || '—'}</dd>
            <dt>Nivel solicitado</dt><dd>${cert.nivel_solicitado}</dd>
            <dt>Nivel obtenido</dt><dd>${cert.nivel_obtenido || '—'}</dd>
            <dt>Postulación</dt><dd>${fmtDate(cert.fecha_postulacion)}</dd>
            <dt>Inicio eval.</dt><dd>${fmtDate(cert.fecha_evaluacion)}</dd>
            <dt>Dictamen</dt><dd>${fmtDate(cert.fecha_dictamen)}</dd>
            <dt>Emisión</dt><dd>${fmtDate(cert.fecha_emision)}</dd>
            <dt>Vence</dt><dd>${fmtDate(cert.fecha_vencimiento)}</dd>
          </dl>
          ${cert.observaciones ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
            <strong style="font-size:0.8rem;text-transform:uppercase;color:var(--muted)">Observaciones del dictamen</strong>
            <p style="margin-top:0.5rem">${cert.observaciones}</p>
          </div>` : ''}
        </div>
      </div>

      <div>
        <div class="card">
          <h3 style="margin-bottom:1rem">Acciones</h3>

          ${cert.estado === 'borrador' || cert.estado === 'pendiente_pago' || cert.estado === 'pagada' ? `
            <h4 style="font-size:0.9rem;color:var(--muted);margin-bottom:0.5rem">Asignar certificador</h4>
            <div class="field">
              <select id="certificador-select">
                <option value="">— Seleccionar —</option>
              </select>
            </div>
            <button class="btn btn-primary btn-block" style="margin-bottom:1rem"
              onclick="asignarCertificador('${cert.id}')">Asignar y pasar a evaluación</button>

            <h4 style="font-size:0.9rem;color:var(--muted);margin-bottom:0.5rem">Generar link de pago</h4>
            <div class="field">
              <select id="pago-pasarela">
                <option value="mercadopago">MercadoPago (ARS)</option>
                <option value="stripe">Stripe (USD)</option>
              </select>
            </div>
            <button class="btn btn-outline btn-block" style="margin-bottom:1rem"
              onclick="generarLinkPago('${cert.id}','${cert.empresa_id}','${cert.nivel_solicitado}')">💳 Generar link de pago</button>
          ` : ''}

          ${cert.estado === 'en_evaluacion' || cert.estado === 'pagada' ? `
            <h4 style="font-size:0.9rem;color:var(--muted);margin-bottom:0.5rem">Emitir dictamen</h4>
            <div class="field">
              <select id="dictamen-tipo">
                <option value="aprobado">Aprobado</option>
                <option value="aprobado_con_observaciones">Aprobado con observaciones</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div class="field">
              <label style="font-size:0.7rem">Nivel obtenido (puede diferir del solicitado)</label>
              <select id="nivel-obtenido">
                ${NIVELES.map(n => `<option value="${n}" ${n === cert.nivel_solicitado ? 'selected' : ''}>${n}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label style="font-size:0.7rem">Observaciones</label>
              <textarea id="dictamen-obs" rows="3"></textarea>
            </div>
            <button class="btn btn-primary btn-block" onclick="emitirDictamen('${cert.id}')">Guardar dictamen</button>
          ` : ''}

          ${puedeEmitirSello ? `
            <button class="btn btn-gold btn-block" style="margin-top:1rem"
              onclick="emitirSello('${cert.id}')">🏅 Emitir sello final</button>
            <p style="font-size:0.75rem;color:var(--muted);margin-top:0.5rem">
              Como admin, confirmás la emisión del sello con vigencia de 1 año.
            </p>
          ` : ''}

          ${cert.estado === 'aprobada' ? `
            <div class="alert alert-success" style="margin:0">
              ✓ Sello emitido y empresa certificada
            </div>
          ` : ''}
        </div>

        <div class="card">
          <h3 style="margin-bottom:1rem">+ Subir evidencia</h3>
          <form id="form-evidencia" enctype="multipart/form-data">
            <div class="field">
              <label>Dimensión</label>
              <select name="dimension" required>
                ${DIMENSIONES.map(d => `<option value="${d.key}">${d.label}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>Descripción</label>
              <input name="descripcion" placeholder="Ej: Política de gobernanza de IA">
            </div>
            <div class="field">
              <label>Archivo (máx 20MB)</label>
              <input type="file" name="archivo" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Subir evidencia</button>
          </form>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:1rem">Evidencias (${evidencias.length})</h3>
      ${evidenciasPorDim.map(d => `
        <div style="margin-bottom:1.5rem">
          <h4 style="font-family:var(--sans);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--navy-mid);margin-bottom:0.5rem">
            ${d.label} <span style="color:var(--muted);text-transform:none;letter-spacing:0">(${d.archivos.length})</span>
          </h4>
          ${d.archivos.length === 0
            ? `<div style="padding:0.5rem 1rem;color:var(--muted);font-size:0.85rem;font-style:italic">Sin evidencia cargada.</div>`
            : `<table style="font-size:0.85rem">
                <tbody>${d.archivos.map(a => `
                  <tr>
                    <td>${a.validada ? '✓' : '○'}</td>
                    <td>${a.descripcion}</td>
                    <td>${a.nombre_archivo}</td>
                    <td>${fmtDate(a.created_at)}</td>
                    <td><a href="${a.url_storage}" target="_blank" class="btn btn-outline" style="padding:0.2rem 0.6rem;font-size:0.75rem">Ver</a></td>
                  </tr>
                `).join('')}</tbody>
              </table>`}
        </div>
      `).join('')}
    </div>
  `;

  // Cargar certificadores disponibles
  const sel = document.getElementById('certificador-select');
  if (sel) {
    try {
      const { data: cers } = await API.get('/miembros-red?tipo=certificador&estado=activo');
      (cers || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.usuario_id;
        opt.textContent = `${c.usuario?.nombre || ''} ${c.usuario?.apellido || ''} — ${c.usuario?.email || ''}`;
        sel.appendChild(opt);
      });
    } catch (e) { /* no bloqueamos */ }
  }

  // Form upload evidencia
  document.getElementById('form-evidencia').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append('certificacion_id', cert.id);
    fd.append('empresa_id', cert.empresa_id);
    try {
      const token = await (async () => {
        const sb = await API.init();
        const { data } = await sb.auth.getSession();
        return data.session?.access_token;
      })();
      const res = await fetch('/api/evidencias', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      location.reload();
    } catch (err) {
      document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  };
}

window.asignarCertificador = async (id) => {
  const certificador_id = document.getElementById('certificador-select').value;
  if (!certificador_id) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">Elegí un certificador. Si no hay opciones, acreditá uno primero en la sección Red.</div>`;
    return;
  }
  try {
    await API.patch(`/certificaciones/${id}/asignar-certificador`, { certificador_id });
    location.reload();
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
};

window.generarLinkPago = async (certificacion_id, empresa_id, nivel) => {
  const pasarela = document.getElementById('pago-pasarela').value;
  const concepto = `certificacion_${nivel}`;
  try {
    const { data } = await API.post('/pagos/generar-link', { empresa_id, certificacion_id, concepto, pasarela });
    if (data.init_point) {
      navigator.clipboard?.writeText(data.init_point);
      if (confirm(`Link copiado al portapapeles:\n\n${data.init_point}\n\n¿Abrir en una pestaña nueva?`)) {
        window.open(data.init_point, '_blank');
      }
    }
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
};

window.emitirDictamen = async (id) => {
  const dictamen = document.getElementById('dictamen-tipo').value;
  const nivel_obtenido = document.getElementById('nivel-obtenido').value;
  const observaciones = document.getElementById('dictamen-obs').value;
  try {
    await API.post(`/certificaciones/${id}/dictamen`, { dictamen, nivel_obtenido, observaciones });
    location.reload();
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
};

window.emitirSello = async (id) => {
  if (!confirm('¿Confirmás la emisión del sello? Esta acción queda registrada y notifica a la empresa.')) return;
  try {
    const { data } = await API.post(`/certificaciones/${id}/emitir-sello`, {});
    alert(`✓ Sello emitido\nCódigo: ${data.codigo_verificacion}\nVence: ${fmtDate(data.fecha_vencimiento)}`);
    location.reload();
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
};

// ── DIAGNÓSTICOS ──
async function viewDiagnosticos() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  const { data } = await API.get('/diagnosticos');
  const diagnosticos = data || [];

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <h1>Diagnósticos</h1>
        <div class="sub">${diagnosticos.length} diagnósticos completados</div>
      </div>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      ${diagnosticos.length === 0
        ? `<div class="empty" style="padding:3rem">No hay diagnósticos cargados todavía.</div>`
        : tablaDiagnosticos(diagnosticos)}
    </div>
  `;
}

// ── RED (consultores + certificadores) ──
async function viewRed() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  const { data } = await API.get('/miembros-red');
  const miembros = data || [];
  const consultores = miembros.filter(m => m.tipo === 'consultor');
  const certificadores = miembros.filter(m => m.tipo === 'certificador');

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <h1>Red acreditada</h1>
        <div class="sub">${consultores.length} consultores · ${certificadores.length} certificadores</div>
      </div>
      <a href="#/nuevo-miembro" class="btn btn-gold">+ Acreditar miembro</a>
    </div>

    <div class="card">
      <h3 style="margin-bottom:1rem">Certificadores (${certificadores.length})</h3>
      ${certificadores.length === 0
        ? `<div class="empty">Aún no hay certificadores acreditados.</div>`
        : tablaMiembros(certificadores)}
    </div>

    <div class="card">
      <h3 style="margin-bottom:1rem">Consultores (${consultores.length})</h3>
      ${consultores.length === 0
        ? `<div class="empty">Aún no hay consultores acreditados.</div>`
        : tablaMiembros(consultores)}
    </div>
  `;
}

function tablaMiembros(arr) {
  return `
    <table>
      <thead><tr><th>Nombre</th><th>Email</th><th>Países</th><th>Estado</th><th>Vence licencia</th></tr></thead>
      <tbody>${arr.map(m => `
        <tr>
          <td><strong>${m.usuario?.nombre || ''} ${m.usuario?.apellido || ''}</strong></td>
          <td>${m.usuario?.email || '—'}</td>
          <td>${(m.paises || []).join(', ') || '—'}</td>
          <td><span class="estado estado-${m.estado === 'activo' ? 'certificada' : (m.estado === 'suspendido' ? 'rechazada' : '')}">${m.estado}</span></td>
          <td>${fmtDate(m.fecha_vencimiento_licencia)}</td>
        </tr>
      `).join('')}</tbody>
    </table>
  `;
}

async function viewNuevoMiembro() {
  $main().innerHTML = `
    <div class="page-head">
      <div>
        <h1>Acreditar miembro</h1>
        <div class="sub">Crea el acceso del consultor o certificador y registra su acreditación.</div>
      </div>
      <a href="#/red" class="btn btn-outline">← Volver</a>
    </div>
    <div id="alert"></div>
    <div class="card">
      <form id="form-miembro">
        <div class="grid-2">
          <div>
            <div class="field"><label>Tipo *</label>
              <select name="tipo" required>
                <option value="consultor">Consultor / Facilitador</option>
                <option value="certificador">Certificador / Evaluador</option>
              </select>
            </div>
            <div class="field"><label>Nombre *</label><input name="nombre" required></div>
            <div class="field"><label>Apellido *</label><input name="apellido" required></div>
            <div class="field"><label>Email *</label><input name="email" type="email" required></div>
            <div class="field"><label>Password temporal *</label><input name="password" required minlength="8" placeholder="Min 8 caracteres"></div>
          </div>
          <div>
            <div class="field"><label>Especialidades (separar con coma)</label>
              <input name="especialidades" placeholder="Ej: gobernanza, datos, modelo"></div>
            <div class="field"><label>Países (separar con coma)</label>
              <input name="paises" value="Argentina"></div>
            <div class="field"><label>LinkedIn</label><input name="linkedin_url" placeholder="https://"></div>
            <div class="field"><label>Bio</label><textarea name="bio" rows="3"></textarea></div>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Acreditar y crear acceso</button>
      </form>
    </div>
  `;

  document.getElementById('form-miembro').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    if (body.especialidades) body.especialidades = body.especialidades.split(',').map(s => s.trim()).filter(Boolean);
    if (body.paises)         body.paises         = body.paises.split(',').map(s => s.trim()).filter(Boolean);
    Object.keys(body).forEach(k => (body[k] === '' || body[k] == null) && delete body[k]);
    try {
      await API.post('/miembros-red', body);
      location.hash = '#/red';
    } catch (err) {
      document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  };
}

// ── PAGOS ──
async function viewPagos() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  const { data } = await API.get('/pagos');
  const pagos = data || [];
  const aprobados = pagos.filter(p => p.estado === 'aprobado');
  const totalUSD = aprobados.filter(p => p.moneda === 'USD').reduce((a,p)=>a+Number(p.monto),0);
  const totalARS = aprobados.filter(p => p.moneda === 'ARS').reduce((a,p)=>a+Number(p.monto),0);

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <h1>Pagos</h1>
        <div class="sub">${pagos.length} transacciones · ${aprobados.length} aprobadas</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><div class="num">${pagos.length}</div><div class="label">Total transacciones</div></div>
      <div class="stat"><div class="num">${aprobados.length}</div><div class="label">Aprobadas</div></div>
      <div class="stat"><div class="num">USD ${totalUSD.toLocaleString()}</div><div class="label">Cobrado USD</div></div>
      <div class="stat"><div class="num">ARS ${totalARS.toLocaleString()}</div><div class="label">Cobrado ARS</div></div>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      ${pagos.length === 0
        ? `<div class="empty" style="padding:3rem">No hay pagos registrados todavía.</div>`
        : `<table>
            <thead><tr><th>Fecha</th><th>Empresa</th><th>Concepto</th><th>Monto</th><th>Pasarela</th><th>Estado</th></tr></thead>
            <tbody>${pagos.map(p => `
              <tr>
                <td>${fmtDate(p.created_at)}</td>
                <td>${p.empresas?.razon_social || '—'}</td>
                <td>${p.concepto.replace(/_/g,' ')}</td>
                <td>${p.moneda} ${Number(p.monto).toLocaleString()}</td>
                <td>${p.pasarela}</td>
                <td><span class="estado estado-${p.estado === 'aprobado' ? 'certificada' : (p.estado === 'rechazado' ? 'rechazada' : '')}">${p.estado}</span></td>
              </tr>
            `).join('')}</tbody>
          </table>`}
    </div>
  `;
}

// ── CONTACTOS ──
const ESTADOS_CONTACTO = ['nuevo','en_seguimiento','convertido','descartado'];

async function viewContactos() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  const { data } = await API.get('/contactos');
  const contactos = data || [];

  const nuevos = contactos.filter(c => c.estado === 'nuevo').length;
  const seguimiento = contactos.filter(c => c.estado === 'en_seguimiento').length;
  const convertidos = contactos.filter(c => c.estado === 'convertido').length;

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Inbox de leads</span>
        <h1>Contactos</h1>
        <div class="sub">${contactos.length} ${contactos.length === 1 ? 'contacto recibido' : 'contactos recibidos'}</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><div class="num">${contactos.length}</div><div class="label">Total</div></div>
      <div class="stat"><div class="num">${nuevos}</div><div class="label">Nuevos sin leer</div></div>
      <div class="stat"><div class="num">${seguimiento}</div><div class="label">En seguimiento</div></div>
      <div class="stat"><div class="num">${convertidos}</div><div class="label">Convertidos</div></div>
    </div>

    ${contactos.length === 0
      ? `<div class="card empty">Cuando alguien complete el form de contacto del sitio, aparece acá.</div>`
      : `<div class="card" style="padding:0;overflow:hidden">
          <table>
            <thead><tr>
              <th>Fecha</th><th>Nombre</th><th>Email</th><th>Empresa</th><th>Origen</th><th>Estado</th>
            </tr></thead>
            <tbody>
              ${contactos.map(c => `
                <tr onclick="location.hash='#/contacto/${c.id}'">
                  <td>${fmtDate(c.created_at)}</td>
                  <td><strong>${c.nombre}</strong></td>
                  <td>${c.email}</td>
                  <td>${c.empresa || '—'}</td>
                  <td><span class="estado">${c.origen || 'web'}</span></td>
                  <td><span class="estado estado-${c.estado === 'convertido' ? 'certificada' : (c.estado === 'descartado' ? 'rechazada' : (c.estado === 'en_seguimiento' ? 'en_evaluacion' : ''))}">${c.estado.replace('_',' ')}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
  `;
}

async function viewContactoDetalle([id]) {
  if (!id) return location.hash = '#/contactos';
  $main().innerHTML = `<div class="empty">Cargando…</div>`;

  let c;
  try {
    const { data } = await API.get(`/contactos/${id}`);
    c = data;
  } catch (err) {
    return $main().innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Contacto</span>
        <h1>${c.nombre}</h1>
        <div class="sub">
          <span class="estado estado-${c.estado === 'convertido' ? 'certificada' : (c.estado === 'descartado' ? 'rechazada' : (c.estado === 'en_seguimiento' ? 'en_evaluacion' : ''))}">${c.estado.replace('_',' ')}</span>
          <span style="margin-left:0.5rem;color:var(--muted)">recibido ${fmtDate(c.created_at)} · ${c.idioma === 'en' ? '🇬🇧' : '🇪🇸'} · origen: ${c.origen || 'web'}</span>
        </div>
      </div>
      <a href="#/contactos" class="btn btn-outline">← Volver</a>
    </div>

    <div id="alert"></div>

    <div class="grid-2">
      <div>
        <div class="card">
          <h3 style="margin-bottom:1rem">Mensaje</h3>
          <div style="background:var(--paper);padding:1.25rem;border-radius:4px;border:1px solid var(--border);white-space:pre-wrap;font-family:var(--serif);font-size:1.05rem;line-height:1.6;color:var(--ink)">${(c.mensaje || '').replace(/[<>]/g, c => ({'<':'&lt;','>':'&gt;'}[c]))}</div>
        </div>

        <div class="card">
          <h3 style="margin-bottom:1rem">Notas internas</h3>
          <div class="field">
            <textarea id="notas-cont" rows="5" placeholder="Anotá observaciones, próximos pasos, etc.">${c.notas_internas || ''}</textarea>
          </div>
          <button class="btn btn-primary" onclick="guardarNotasContacto('${c.id}')">Guardar notas</button>
        </div>
      </div>

      <div>
        <div class="card">
          <h3 style="margin-bottom:1rem">Datos</h3>
          <dl class="dl">
            <dt>Email</dt><dd><a href="mailto:${c.email}">${c.email}</a></dd>
            <dt>Empresa</dt><dd>${c.empresa || '—'}</dd>
            <dt>Teléfono</dt><dd>${c.telefono || '—'}</dd>
            <dt>Asunto</dt><dd>${c.asunto || '—'}</dd>
            <dt>Idioma</dt><dd>${c.idioma === 'en' ? 'Inglés' : 'Español'}</dd>
            <dt>Origen</dt><dd>${c.origen || '—'}</dd>
            <dt>Email enviado</dt><dd>${c.email_enviado ? '✓ Sí' : '✗ No'}</dd>
          </dl>
        </div>

        <div class="card">
          <h3 style="margin-bottom:1rem">Cambiar estado</h3>
          <div class="field">
            <select id="nuevo-estado-cont">
              ${ESTADOS_CONTACTO.map(e => `<option value="${e}" ${e === c.estado ? 'selected' : ''}>${e.replace('_',' ')}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary btn-block" onclick="cambiarEstadoContacto('${c.id}')">Actualizar estado</button>

          <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border)">
            <a href="mailto:${c.email}?subject=Re:%20Contacto%20El%20Cuarto%20Impacto" class="btn btn-gold btn-block">
              ✉ Responder por mail
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.cambiarEstadoContacto = async (id) => {
  const estado = document.getElementById('nuevo-estado-cont').value;
  try {
    await API.patch(`/contactos/${id}`, { estado });
    location.reload();
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
};

window.guardarNotasContacto = async (id) => {
  const notas_internas = document.getElementById('notas-cont').value;
  try {
    await API.patch(`/contactos/${id}`, { notas_internas });
    document.getElementById('alert').innerHTML = `<div class="alert alert-success">Notas guardadas</div>`;
    setTimeout(() => document.getElementById('alert').innerHTML = '', 2500);
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
};

function tablaDiagnosticos(diagnosticos) {
  return `
    <table>
      <thead><tr><th>Fecha</th><th>Empresa</th><th>Email</th><th>Nivel</th><th>Puntaje</th><th>Idioma</th></tr></thead>
      <tbody>${diagnosticos.map(d => `
        <tr>
          <td>${fmtDate(d.completado_en)}</td>
          <td>${d.nombre_empresa}</td>
          <td>${d.email}</td>
          <td><span class="badge badge-${d.nivel_resultado}">${d.nivel_resultado}</span></td>
          <td>${d.puntaje_total}</td>
          <td>${d.idioma.toUpperCase()}</td>
        </tr>
      `).join('')}</tbody>
    </table>
  `;
}

// ── REPORTES (M6 Dashboard) ──────────────────────────────────────
const CHART_COLORS = {
  navy: '#0f2137',
  navyMid: '#1e3a5f',
  gold: '#c8920a',
  goldb: '#f4b822',
  celeste: '#c8ddee',
  paperWarm: '#f4eedf',
  success: '#047857',
  error: '#b91c1c',
  warn: '#d97706',
  a1: '#89366C', a2: '#C8920A', a3: '#1E3A5F', a4: '#2D7DD2', a5: '#0A9E6E',
};

const __charts = {};

function destroyChart(id) {
  if (__charts[id]) {
    try { __charts[id].destroy(); } catch (e) {}
    delete __charts[id];
  }
}

async function viewReportes() {
  $main().innerHTML = `<div class="empty">Cargando métricas…</div>`;

  let financiero = {}, embudo = {}, comunidad = {};
  try {
    const [f, e, c] = await Promise.all([
      API.get('/stats/financiero'),
      API.get('/stats/embudo'),
      API.get('/stats/comunidad'),
    ]);
    financiero = f.data || {};
    embudo = e.data || {};
    comunidad = c.data || {};
  } catch (err) {
    return $main().innerHTML = `<div class="alert alert-error">No pudimos cargar las métricas: ${err.message}</div>`;
  }

  const totalUSD = financiero.total?.USD || 0;
  const totalARS = financiero.total?.ARS || 0;
  const mesActUSD = financiero.mesActual?.USD || 0;
  const mesAntUSD = financiero.mesAnterior?.USD || 0;
  const deltaUSD = mesAntUSD > 0 ? Math.round(((mesActUSD - mesAntUSD) / mesAntUSD) * 100) : (mesActUSD > 0 ? 100 : 0);

  const adhTotal = comunidad.adherentes?.total || 0;
  const adhPaises = comunidad.adherentes?.paises_count || 0;
  const contactosNuevos = comunidad.contactos?.porEstado?.nuevo || 0;

  const pasos = embudo.embudo || [];
  const maxVal = Math.max(1, ...pasos.map(p => p.valor));

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Métricas y análisis</span>
        <h1>Reportes</h1>
        <div class="sub">Estado del negocio, comunidad y conversión</div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi kpi-success">
        <div class="kpi-eyebrow">Cobrado total</div>
        <div class="kpi-num">USD ${totalUSD.toLocaleString()}</div>
        <div class="kpi-sub">+ ARS ${totalARS.toLocaleString()}</div>
      </div>
      <div class="kpi">
        <div class="kpi-eyebrow">Este mes (USD)</div>
        <div class="kpi-num">USD ${mesActUSD.toLocaleString()}</div>
        ${mesAntUSD > 0 || mesActUSD > 0 ? `<span class="kpi-delta ${deltaUSD > 0 ? 'kpi-delta-up' : (deltaUSD < 0 ? 'kpi-delta-down' : 'kpi-delta-flat')}">${deltaUSD >= 0 ? '↑' : '↓'} ${Math.abs(deltaUSD)}% vs mes anterior</span>` : '<div class="kpi-sub">sin datos previos</div>'}
      </div>
      <div class="kpi kpi-warn">
        <div class="kpi-eyebrow">Pendiente de cobro</div>
        <div class="kpi-num">USD ${(financiero.pendiente?.USD || 0).toLocaleString()}</div>
        <div class="kpi-sub">${financiero.cantidad?.pendientes || 0} transacciones</div>
      </div>
      <div class="kpi">
        <div class="kpi-eyebrow">Adherentes al Manifiesto</div>
        <div class="kpi-num">${adhTotal}</div>
        <div class="kpi-sub">en ${adhPaises} ${adhPaises === 1 ? 'país' : 'países'}</div>
      </div>
      <div class="kpi ${contactosNuevos > 0 ? 'kpi-error' : ''}">
        <div class="kpi-eyebrow">${contactosNuevos > 0 ? '⚠ Contactos sin leer' : 'Inbox de leads'}</div>
        <div class="kpi-num">${contactosNuevos}</div>
        <div class="kpi-sub">${comunidad.contactos?.total || 0} contactos totales</div>
      </div>
    </div>

    <div class="chart-box" style="margin-bottom:1.5rem">
      <h3>Embudo de conversión</h3>
      ${pasos.map((p, i) => `
        <div class="embudo-row">
          <div class="paso">${p.paso}</div>
          <div class="barra"><div class="barra-fill" style="width:${(p.valor / maxVal) * 100}%"></div></div>
          <div class="valor">${p.valor}</div>
          ${i > 0 && pasos[i-1].valor > 0 ? `<span class="embudo-conv">${Math.round((p.valor / pasos[i-1].valor) * 100)}%</span>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="reports-grid">
      <div class="chart-box">
        <h3>Ingresos por mes (USD)</h3>
        <div class="chart-container"><canvas id="chart-ingresos"></canvas></div>
      </div>
      <div class="chart-box">
        <h3>Crecimiento de la comunidad</h3>
        <div class="chart-container"><canvas id="chart-adherentes"></canvas></div>
      </div>
      <div class="chart-box">
        <h3>Empresas certificadas por nivel</h3>
        <div class="chart-container"><canvas id="chart-niveles"></canvas></div>
      </div>
      <div class="chart-box">
        <h3>Diagnósticos por nivel resultado</h3>
        <div class="chart-container"><canvas id="chart-diag-niveles"></canvas></div>
      </div>
      <div class="chart-box">
        <h3>Idiomas (mix ES / EN)</h3>
        <div class="chart-container"><canvas id="chart-idiomas"></canvas></div>
      </div>
      <div class="chart-box">
        <h3>Top países (adherentes)</h3>
        <div class="chart-container"><canvas id="chart-paises"></canvas></div>
      </div>
    </div>
  `;

  // Render gráficos
  destroyChart('ingresos');
  const serie = financiero.serie || [];
  __charts.ingresos = new Chart(document.getElementById('chart-ingresos'), {
    type: 'bar',
    data: {
      labels: serie.length ? serie.map(s => s.mes) : ['—'],
      datasets: [
        { label: 'USD', data: serie.map(s => s.USD), backgroundColor: CHART_COLORS.goldb, borderRadius: 4 },
        { label: 'ARS (en miles)', data: serie.map(s => s.ARS / 1000), backgroundColor: CHART_COLORS.celeste, borderRadius: 4, hidden: serie.every(s => s.ARS === 0) },
      ],
    },
    options: chartOpts({}),
  });

  destroyChart('adherentes');
  const adhSerie = comunidad.adherentes?.serie || [];
  __charts.adherentes = new Chart(document.getElementById('chart-adherentes'), {
    type: 'line',
    data: {
      labels: adhSerie.length ? adhSerie.map(s => s.mes) : ['—'],
      datasets: [{
        label: 'Adherentes',
        data: adhSerie.map(s => s.cantidad),
        borderColor: CHART_COLORS.gold,
        backgroundColor: 'rgba(244,184,34,0.15)',
        fill: true, tension: 0.35, borderWidth: 2.5,
        pointBackgroundColor: CHART_COLORS.gold, pointRadius: 4,
      }],
    },
    options: chartOpts({ noLegend: true }),
  });

  destroyChart('niveles');
  const niveles = embudo.porNivel || { A1:0, A2:0, A3:0, A4:0, A5:0 };
  __charts.niveles = new Chart(document.getElementById('chart-niveles'), {
    type: 'doughnut',
    data: {
      labels: ['A1 Consciente', 'A2 Adoptante', 'A3 Responsable', 'A4 Transformadora', 'A5 Referente'],
      datasets: [{
        data: [niveles.A1, niveles.A2, niveles.A3, niveles.A4, niveles.A5],
        backgroundColor: [CHART_COLORS.a1, CHART_COLORS.a2, CHART_COLORS.a3, CHART_COLORS.a4, CHART_COLORS.a5],
        borderColor: 'white', borderWidth: 2,
      }],
    },
    options: chartOpts({ doughnut: true }),
  });

  destroyChart('diagNiveles');
  const diagN = comunidad.diagnosticos?.porNivel || { A1:0, A2:0, A3:0, A4:0, A5:0 };
  __charts.diagNiveles = new Chart(document.getElementById('chart-diag-niveles'), {
    type: 'bar',
    data: {
      labels: ['A1', 'A2', 'A3', 'A4', 'A5'],
      datasets: [{
        label: 'Diagnósticos',
        data: [diagN.A1, diagN.A2, diagN.A3, diagN.A4, diagN.A5],
        backgroundColor: [CHART_COLORS.a1, CHART_COLORS.a2, CHART_COLORS.a3, CHART_COLORS.a4, CHART_COLORS.a5],
        borderRadius: 4,
      }],
    },
    options: chartOpts({ noLegend: true }),
  });

  destroyChart('idiomas');
  const idiomas = comunidad.idiomas || { es: 0, en: 0 };
  __charts.idiomas = new Chart(document.getElementById('chart-idiomas'), {
    type: 'doughnut',
    data: {
      labels: ['Español', 'English'],
      datasets: [{
        data: [idiomas.es, idiomas.en],
        backgroundColor: [CHART_COLORS.navy, CHART_COLORS.goldb],
        borderColor: 'white', borderWidth: 2,
      }],
    },
    options: chartOpts({ doughnut: true }),
  });

  destroyChart('paises');
  const paises = (comunidad.adherentes?.porPais || []).slice(0, 10);
  __charts.paises = new Chart(document.getElementById('chart-paises'), {
    type: 'bar',
    data: {
      labels: paises.length ? paises.map(p => p.pais) : ['—'],
      datasets: [{
        label: 'Adherentes',
        data: paises.map(p => p.cantidad),
        backgroundColor: CHART_COLORS.navyMid,
        borderRadius: 4,
      }],
    },
    options: chartOpts({ horizontal: true, noLegend: true }),
  });
}

// ──────────────────────────────────────────────────
// M8 · PIPELINE (Kanban)
// ──────────────────────────────────────────────────
const PIPELINE_ETAPAS_INFO = {
  lead:        { label: 'Lead',         emoji: '🌱' },
  calificada:  { label: 'Calificada',   emoji: '🔍' },
  oportunidad: { label: 'Oportunidad',  emoji: '🎯' },
  propuesta:   { label: 'Propuesta',    emoji: '📄' },
  cliente:     { label: 'Cliente',      emoji: '✨' },
  perdida:     { label: 'Perdida',      emoji: '✗' },
};

async function viewPipeline() {
  $main().innerHTML = `<div class="empty">Cargando pipeline…</div>`;
  let board, resumen, etapas;
  try {
    const { data } = await API.get('/pipeline');
    board = data.board; resumen = data.resumen; etapas = data.etapas;
  } catch (err) {
    return $main().innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }

  const totalValor = Object.values(resumen).reduce((a, r) => a + r.valor_total, 0);
  const totalPonderado = Object.values(resumen).reduce((a, r) => a + r.valor_ponderado, 0);

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Embudo comercial</span>
        <h1>Pipeline de ventas</h1>
        <div class="sub">Empresas y contactos clasificados por etapa</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><div class="num">${(resumen.lead.cantidad + resumen.calificada.cantidad + resumen.oportunidad.cantidad + resumen.propuesta.cantidad)}</div><div class="label">Oportunidades abiertas</div></div>
      <div class="stat"><div class="num">USD ${totalValor.toLocaleString()}</div><div class="label">Valor total</div></div>
      <div class="stat"><div class="num">USD ${Math.round(totalPonderado).toLocaleString()}</div><div class="label">Valor ponderado</div></div>
      <div class="stat"><div class="num">${resumen.cliente.cantidad}</div><div class="label">Clientes</div></div>
    </div>

    <div class="kanban-board">
      ${etapas.map(e => {
        const info = PIPELINE_ETAPAS_INFO[e];
        const cards = board[e] || [];
        return `
          <div class="kanban-col ${e}">
            <h4>
              <span>${info.emoji} ${info.label}</span>
              <span class="count">${cards.length}</span>
            </h4>
            ${resumen[e].valor_total > 0 ? `<div class="valor-col">USD ${resumen[e].valor_total.toLocaleString()}</div>` : ''}
            ${cards.length === 0 ? `<div class="kanban-empty">Sin items</div>` :
              cards.map(c => kanbanCardHtml(c)).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function kanbanCardHtml(c) {
  const empresa = c.tipo === 'empresa' ? '' : (c.empresa ? `<div class="sub">${c.empresa}</div>` : '');
  return `
    <div class="kanban-card" onclick="moverPipeline('${c.tipo}', '${c.id}')">
      <span class="tipo-tag ${c.tipo === 'empresa' ? 'tipo-empresa' : 'tipo-contacto'}">${c.tipo}</span>
      <div class="nombre">${c.nombre}</div>
      ${empresa}
      <div class="sub">${c.email || ''}</div>
      <div class="meta">
        <span>${c.pais || c.origen || ''}</span>
        ${c.valor > 0 ? `<span class="valor">USD ${Number(c.valor).toLocaleString()}</span>` : ''}
      </div>
    </div>
  `;
}

window.moverPipeline = async (tipo, id) => {
  const etapas = Object.keys(PIPELINE_ETAPAS_INFO);
  const seleccion = prompt(`Cambiar etapa a:\n\n${etapas.map((e, i) => `${i+1}. ${PIPELINE_ETAPAS_INFO[e].emoji} ${PIPELINE_ETAPAS_INFO[e].label}`).join('\n')}\n\nEscribí el número (1-6):`);
  if (!seleccion) return;
  const idx = parseInt(seleccion) - 1;
  if (idx < 0 || idx >= etapas.length) return alert('Opción inválida');
  try {
    await API.patch(`/pipeline/${tipo}/${id}`, { pipeline_etapa: etapas[idx] });
    location.reload();
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

// ──────────────────────────────────────────────────
// M7 · CONTENIDOS (Marketing)
// ──────────────────────────────────────────────────
const TIPOS_CONT = ['post','evento','newsletter','articulo','podcast','video','otro'];
const PLATAFORMAS = ['linkedin','instagram','twitter','web','blog','newsletter','youtube','otro'];
const ESTADOS_CONT = ['idea','borrador','programado','publicado','archivado'];

async function viewContenidos() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  const { data } = await API.get('/contenidos');
  const items = data || [];

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Plan de contenidos</span>
        <h1>Marketing</h1>
        <div class="sub">${items.length} ${items.length === 1 ? 'contenido' : 'contenidos'} · gestión editorial del movimiento</div>
      </div>
      <a href="#/nuevo-contenido" class="btn btn-gold">+ Nuevo contenido</a>
    </div>

    <div class="stats">
      <div class="stat"><div class="num">${items.filter(c => c.estado === 'idea').length}</div><div class="label">Ideas</div></div>
      <div class="stat"><div class="num">${items.filter(c => c.estado === 'borrador').length}</div><div class="label">Borradores</div></div>
      <div class="stat"><div class="num">${items.filter(c => c.estado === 'programado').length}</div><div class="label">Programados</div></div>
      <div class="stat"><div class="num">${items.filter(c => c.estado === 'publicado').length}</div><div class="label">Publicados</div></div>
    </div>

    ${items.length === 0
      ? `<div class="card empty">Aún no hay contenidos. Empezá con "+ Nuevo contenido".</div>`
      : items.map(c => `
        <div class="content-card" onclick="location.hash='#/contenido/${c.id}'">
          <div class="content-thumb"${c.imagen_url ? ` style="background-image:url('${c.imagen_url}')"` : ''}>${c.imagen_url ? '' : (c.tipo[0] || '?').toUpperCase()}</div>
          <div class="content-info">
            <div class="titulo">${c.titulo}</div>
            <div class="tags">
              <span class="tag">${c.tipo}</span>
              <span class="tag">${c.plataforma}</span>
              <span class="tag">${c.idioma.toUpperCase()}</span>
            </div>
          </div>
          <div style="text-align:right">
            <span class="estado estado-${c.estado === 'publicado' ? 'certificada' : (c.estado === 'archivado' ? 'vencida' : (c.estado === 'programado' ? 'en_evaluacion' : ''))}">${c.estado}</span>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:0.3rem">${c.fecha_publicacion ? fmtDate(c.fecha_publicacion) : '—'}</div>
          </div>
        </div>
      `).join('')}
  `;
}

async function viewContenidoForm() {
  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Contenido</span>
        <h1>Nuevo contenido</h1>
        <div class="sub">Agregá un post, evento o pieza editorial al plan</div>
      </div>
      <a href="#/contenidos" class="btn btn-outline">← Volver</a>
    </div>
    <div id="alert"></div>
    <div class="card">
      <form id="form-contenido">
        <div class="field"><label>Título *</label><input name="titulo" required></div>
        <div class="grid-2">
          <div>
            <div class="field"><label>Tipo</label>
              <select name="tipo">${TIPOS_CONT.map(t => `<option value="${t}">${t}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Plataforma</label>
              <select name="plataforma">${PLATAFORMAS.map(p => `<option value="${p}">${p}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Estado</label>
              <select name="estado">${ESTADOS_CONT.map(e => `<option value="${e}">${e}</option>`).join('')}</select>
            </div>
          </div>
          <div>
            <div class="field"><label>Idioma</label>
              <select name="idioma"><option value="es">Español</option><option value="en">English</option></select>
            </div>
            <div class="field"><label>Fecha de publicación</label><input type="datetime-local" name="fecha_publicacion"></div>
            <div class="field"><label>URL publicada</label><input name="url_publicado" placeholder="https://"></div>
          </div>
        </div>
        <div class="field"><label>Imagen (URL)</label><input name="imagen_url" placeholder="https://"></div>
        <div class="field"><label>Objetivo</label><input name="objetivo" placeholder="Ej: awareness, leads, engagement"></div>
        <div class="field"><label>Contenido (Markdown)</label><textarea name="contenido" rows="8"></textarea></div>
        <div class="field"><label>Notas internas</label><textarea name="notas" rows="3"></textarea></div>
        <button type="submit" class="btn btn-primary">Crear contenido</button>
      </form>
    </div>
  `;
  document.getElementById('form-contenido').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    Object.keys(body).forEach(k => body[k] === '' && delete body[k]);
    try {
      const { data } = await API.post('/contenidos', body);
      location.hash = `#/contenido/${data.id}`;
    } catch (err) {
      document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  };
}

async function viewContenidoDetalle([id]) {
  if (!id) return location.hash = '#/contenidos';
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  let c;
  try { const r = await API.get(`/contenidos/${id}`); c = r.data; }
  catch (err) { return $main().innerHTML = `<div class="alert alert-error">${err.message}</div>`; }

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">${c.tipo} · ${c.plataforma}</span>
        <h1>${c.titulo}</h1>
        <div class="sub"><span class="estado">${c.estado}</span> · ${c.idioma.toUpperCase()} · ${c.fecha_publicacion ? fmtDate(c.fecha_publicacion) : 'sin fecha'}</div>
      </div>
      <a href="#/contenidos" class="btn btn-outline">← Volver</a>
    </div>
    <div id="alert"></div>
    <div class="card">
      <form id="form-edit">
        <div class="field"><label>Título</label><input name="titulo" value="${c.titulo}" required></div>
        <div class="grid-2">
          <div>
            <div class="field"><label>Estado</label>
              <select name="estado">${ESTADOS_CONT.map(e => `<option value="${e}" ${e === c.estado ? 'selected' : ''}>${e}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Tipo</label>
              <select name="tipo">${TIPOS_CONT.map(t => `<option value="${t}" ${t === c.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Plataforma</label>
              <select name="plataforma">${PLATAFORMAS.map(p => `<option value="${p}" ${p === c.plataforma ? 'selected' : ''}>${p}</option>`).join('')}</select>
            </div>
          </div>
          <div>
            <div class="field"><label>Fecha publicación</label>
              <input type="datetime-local" name="fecha_publicacion" value="${c.fecha_publicacion ? c.fecha_publicacion.slice(0,16) : ''}">
            </div>
            <div class="field"><label>URL publicada</label><input name="url_publicado" value="${c.url_publicado || ''}"></div>
            <div class="field"><label>Imagen URL</label><input name="imagen_url" value="${c.imagen_url || ''}"></div>
          </div>
        </div>
        <div class="field"><label>Contenido (Markdown)</label><textarea name="contenido" rows="10">${c.contenido || ''}</textarea></div>
        <div class="field"><label>Notas internas</label><textarea name="notas" rows="3">${c.notas || ''}</textarea></div>
        <button type="submit" class="btn btn-primary">Guardar cambios</button>
        <button type="button" class="btn btn-outline" style="margin-left:0.5rem" onclick="borrarContenido('${c.id}')">Eliminar</button>
      </form>
    </div>
  `;
  document.getElementById('form-edit').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    Object.keys(body).forEach(k => body[k] === '' && delete body[k]);
    try {
      await API.patch(`/contenidos/${id}`, body);
      document.getElementById('alert').innerHTML = `<div class="alert alert-success">Guardado</div>`;
      setTimeout(() => document.getElementById('alert').innerHTML = '', 2000);
    } catch (err) {
      document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  };
}

window.borrarContenido = async (id) => {
  if (!confirm('¿Eliminar este contenido?')) return;
  await API.delete(`/contenidos/${id}`);
  location.hash = '#/contenidos';
};

// ──────────────────────────────────────────────────
// M9 · RECURSOS
// ──────────────────────────────────────────────────
const TIPOS_REC = ['pdf','video','link','herramienta','imagen','audio','otro'];
const CATEGORIAS_REC = ['manifiesto','framework','casos','guias','presentaciones','plantillas','general'];

async function viewRecursos() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  const { data } = await API.get('/recursos/admin');
  const items = data || [];

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Biblioteca</span>
        <h1>Recursos</h1>
        <div class="sub">${items.length} ${items.length === 1 ? 'recurso' : 'recursos'} · ${items.filter(r => r.publico).length} público${items.filter(r => r.publico).length === 1 ? '' : 's'}</div>
      </div>
      <a href="#/nuevo-recurso" class="btn btn-gold">+ Nuevo recurso</a>
    </div>

    ${items.length === 0
      ? `<div class="card empty">Aún no hay recursos. Cargá manifiestos, guías, plantillas y más.</div>`
      : `<div class="recursos-grid">
        ${items.map(r => `
          <div class="recurso-card">
            ${r.destacado ? '<span class="destacado-tag">★ Destacado</span>' : ''}
            <div class="tipo">${r.tipo} · ${r.categoria}</div>
            <div class="titulo">${r.titulo}</div>
            <div class="descripcion">${r.descripcion || ''}</div>
            <div class="footer">
              <span>${r.publico ? '🌐 Público' : '🔒 Privado'} · ${r.idioma.toUpperCase()}</span>
              <a href="${r.url_descarga}" target="_blank" style="color:var(--gold);font-weight:600">Abrir →</a>
            </div>
          </div>
        `).join('')}
      </div>`}
  `;
}

async function viewRecursoForm() {
  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Recurso</span>
        <h1>Nuevo recurso</h1>
      </div>
      <a href="#/recursos" class="btn btn-outline">← Volver</a>
    </div>
    <div id="alert"></div>
    <div class="card">
      <form id="form-recurso">
        <div class="field"><label>Título *</label><input name="titulo" required></div>
        <div class="field"><label>Descripción</label><textarea name="descripcion" rows="3"></textarea></div>
        <div class="grid-2">
          <div>
            <div class="field"><label>Tipo</label>
              <select name="tipo">${TIPOS_REC.map(t => `<option value="${t}">${t}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Categoría</label>
              <select name="categoria">${CATEGORIAS_REC.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Idioma</label>
              <select name="idioma"><option value="es">Español</option><option value="en">English</option></select>
            </div>
          </div>
          <div>
            <div class="field"><label>URL de descarga *</label><input name="url_descarga" required placeholder="https://drive.google.com/..."></div>
            <div class="field"><label>Imagen thumbnail</label><input name="imagen_thumbnail" placeholder="https://"></div>
            <div class="field">
              <label><input type="checkbox" name="publico" checked> Visible en el sitio público</label>
            </div>
            <div class="field">
              <label><input type="checkbox" name="destacado"> Destacado (aparece arriba)</label>
            </div>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Crear recurso</button>
      </form>
    </div>
  `;
  document.getElementById('form-recurso').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      titulo: fd.get('titulo'),
      descripcion: fd.get('descripcion') || null,
      tipo: fd.get('tipo'),
      categoria: fd.get('categoria'),
      idioma: fd.get('idioma'),
      url_descarga: fd.get('url_descarga'),
      imagen_thumbnail: fd.get('imagen_thumbnail') || null,
      publico: !!fd.get('publico'),
      destacado: !!fd.get('destacado'),
    };
    try {
      await API.post('/recursos', body);
      location.hash = '#/recursos';
    } catch (err) {
      document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  };
}

// ──────────────────────────────────────────────────
// ADHERENTES (vista admin completa)
// ──────────────────────────────────────────────────
async function viewAdherentesAdmin() {
  $main().innerHTML = `<div class="empty">Cargando…</div>`;
  const { data } = await API.get('/adhesiones/admin');
  const items = data || [];

  $main().innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Movimiento</span>
        <h1>Adherentes al Manifiesto</h1>
        <div class="sub">${items.length} ${items.length === 1 ? 'persona / empresa adherida' : 'personas / empresas adheridas'}</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><div class="num">${items.length}</div><div class="label">Total</div></div>
      <div class="stat"><div class="num">${items.filter(a => a.mostrar_publico).length}</div><div class="label">Públicas</div></div>
      <div class="stat"><div class="num">${items.filter(a => a.empresa).length}</div><div class="label">Con empresa</div></div>
      <div class="stat"><div class="num">${new Set(items.map(a => a.pais)).size}</div><div class="label">Países</div></div>
    </div>

    ${items.length === 0
      ? `<div class="card empty">Aún no hay adherentes. Compartí elcuartoimpacto.com/adherir para empezar a sumar.</div>`
      : `<div class="card" style="padding:0;overflow:hidden">
          <table>
            <thead><tr>
              <th>Fecha</th><th>Nombre</th><th>Empresa</th><th>Cargo</th><th>País</th><th>Idioma</th><th>Público</th><th>Código</th>
            </tr></thead>
            <tbody>${items.map(a => `
              <tr>
                <td>${fmtDate(a.fecha_adhesion)}</td>
                <td><strong>${a.nombre} ${a.apellido}</strong><br><small style="color:var(--muted)">${a.email}</small></td>
                <td>${a.empresa || '—'}</td>
                <td>${a.cargo || '—'}</td>
                <td>${a.pais}</td>
                <td>${a.idioma.toUpperCase()}</td>
                <td>${a.mostrar_publico ? '✓' : '✗'}</td>
                <td><code style="font-size:0.7rem">${a.codigo_adhesion}</code></td>
              </tr>
            `).join('')}</tbody>
          </table>
        </div>`}
  `;
}

function chartOpts({ doughnut, horizontal, noLegend } = {}) {
  if (doughnut) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11, family: "'DM Sans', system-ui, sans-serif" }, color: '#3a3530', padding: 12, boxWidth: 12 } },
      },
      cutout: '60%',
    };
  }
  return {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: !noLegend, position: 'bottom', labels: { font: { size: 11, family: "'DM Sans', system-ui, sans-serif" }, color: '#3a3530', padding: 12, boxWidth: 12 } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#76706a', font: { size: 10 } } },
      y: { grid: { color: 'rgba(15,33,55,0.05)' }, ticks: { color: '#76706a', font: { size: 10 } } },
    },
  };
}
