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
