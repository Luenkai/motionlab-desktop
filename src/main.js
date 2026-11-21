import './style.css';
import JSZip from 'jszip';

const HALF_BODY = [
  ['Head turn', 'Head Turn Left-Right', 'ParamAngleX', -30, 30],
  ['Head nod', 'Head Nod Down-Up', 'ParamAngleY', -30, 30],
  ['Head tilt', 'Head Tilt Left-Right', 'ParamAngleZ', -30, 30],
  ['Spine left/right', 'Spine Left-Right', 'ParamBodyAngleX', -10, 10],
  ['Spine front/back', 'Spine Front-Back', 'ParamBodyAngleY', -10, 10],
  ['Spine twist', 'Spine Twist Left-Right', 'ParamBodyAngleZ', -10, 10],
  ['Chest left/right', 'Chest Left-Right', 'ParamBodyAngleX2', -10, 10],
  ['Chest front/back', 'Chest Front-Back', 'ParamBodyAngleY2', -10, 10],
  ['Chest twist', 'Chest Twist Left-Right', 'ParamBodyAngleZ2', -10, 10],
];

const app = document.querySelector('#app');
const state = { mode: 'half', model: null, metadata: null, runtime: null, values: {}, objectUrls: [] };
const pretty = (value) => Number(value || 0).toFixed(2);

app.innerHTML = `
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#"><span class="brand-orb">L2</span><span><b>motionlab</b><small>live2d toolkit</small></span></a>
      <div class="side-section"><p class="side-label">WORKSPACE</p><button class="side-link active"><span>◈</span> Model lab</button><button class="side-link"><span>⌁</span> Mapping guide</button><button class="side-link"><span>↗</span> Export session</button></div>
      <div class="side-section side-tip"><p class="side-label">QUICK START</p><strong>Bring your rig to life.</strong><p>Drop a model package into the lab, choose a body scope, and test parameters in real time.</p><span class="tip-mark">01 / 03</span></div>
      <div class="sidebar-foot"><span class="live-dot"></span><span>Browser-local session</span><span class="kbd">⌘ K</span></div>
    </aside>
    <main class="main-content">
      <header class="topbar"><div><p class="eyebrow">MODEL LAB / PERSONAL RIG TESTING</p><h1>Test the movement, not the guesswork.</h1></div><div class="top-actions"><span class="privacy"><span class="lock">⌑</span> Assets stay in your browser</span><button id="clear-session" class="icon-button" title="Reset workspace">↺</button><button id="upload-top" class="button button-dark">Import model <span>⌃</span></button></div></header>
      <section class="import-banner" id="dropzone"><div class="import-icon">＋</div><div class="import-copy"><p class="eyebrow">START WITH YOUR MODEL</p><h2>Drop a .zip or model package here</h2><p>We support Live2D Cubism <code>.model3.json</code>, <code>.moc3</code>, textures, physics, and motion files. Nothing is uploaded.</p></div><button id="choose-model" class="button button-primary">Choose files <span>→</span></button><input id="model-input" type="file" multiple accept=".zip,.json,.moc3,.cdi3,.physics3.json,.motion3.json,.png,.jpg,.jpeg" hidden /></section>
      <div class="workspace-head"><div><div class="crumb"><span>Workspace</span><b>/</b><strong id="model-name">Demo model</strong></div><p id="model-subtitle" class="muted">A half-body starter rig is loaded for you.</p></div><div class="scope-toggle" role="group" aria-label="Mapping scope"><button data-mode="half" class="scope-button active"><span class="scope-icon">◒</span><b>Half body</b><small>head + torso</small></button><button data-mode="full" class="scope-button"><span class="scope-icon">◑</span><b>Full body</b><small>all exposed params</small></button></div></div>
      <section class="lab-grid">
        <div class="preview-card card"><div class="card-head"><div><p class="eyebrow">LIVE STAGE</p><h2 id="stage-title">Demo model</h2></div><div class="stage-status"><span id="runtime-dot" class="status-dot"></span><span id="runtime-label">Ready to render</span></div></div><div class="stage"><div class="stage-grid"></div><div class="stage-sheen"></div><canvas id="runtime-canvas" aria-label="Live2D model preview"></canvas><div id="empty-stage" class="empty-stage"><div class="empty-orb">◈</div><strong>Render your model here</strong><span>Import a model package, then activate the runtime.</span></div><div class="stage-caption"><span class="caption-kicker">CUBISM RUNTIME</span><strong id="stage-caption-title">Waiting for model</strong><small id="stage-caption-copy">Your model remains local to this browser tab.</small></div></div><div class="stage-actions"><button id="activate-runtime" class="button button-primary">Activate runtime <span>→</span></button><button id="reset-values" class="button button-ghost">Reset parameters</button><span id="runtime-help" class="muted">Cubism Core loads only when you activate the stage.</span></div><div id="asset-strip" class="asset-strip"></div></div>
        <aside class="controls-card card"><div class="card-head"><div><p class="eyebrow">CONTROL DECK</p><h2 id="scope-title">Half-body mappings</h2></div><span id="mapping-count" class="count-badge">9 direct</span></div><div class="control-intro"><span class="intro-icon">⌁</span><div><strong id="control-intro-title">Tune the expressive center</strong><p id="control-intro-copy">Head, spine, and chest channels mapped to familiar Live2D IDs.</p></div></div><div id="controls" class="controls"></div><div class="controls-foot"><span><span class="live-dot"></span> Live parameter sync</span><code id="value-count">0 / 9 changed</code></div></aside>
      </section>
      <section class="insights-grid"><div class="mapping-card card"><div class="card-head"><div><p class="eyebrow">MAPPING COVERAGE</p><h2>What your model exposes</h2></div><span id="coverage-label" class="coverage-label">Half-body focus</span></div><div class="coverage-meter"><span id="coverage-fill"></span></div><div class="coverage-meta"><span id="coverage-copy">9 familiar channels ready to test</span><span id="coverage-percent">—</span></div><div id="mapping-list" class="mapping-list"></div></div><div class="payload-card card"><div class="card-head"><div><p class="eyebrow">SESSION OUTPUT</p><h2>Parameter payload</h2></div><button id="copy-payload" class="text-button">Copy JSON</button></div><pre id="payload">{}</pre><div class="payload-foot"><span>Use this payload to build your own controller.</span><span id="payload-state">ready</span></div></div></section>
      <footer><span>motionlab / a browser-local Live2D testing room</span><span>Built for creators, riggers, and curious testers.</span></footer>
    </main>
  </div>`;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function normalizePath(path) { return path.replaceAll('\\', '/').replace(/^\.\//, '').replace(/^\//, ''); }
function clearObjectUrls() { state.objectUrls.forEach((url) => URL.revokeObjectURL(url)); state.objectUrls = []; }
function assetKey(name) { return normalizePath(name).toLowerCase(); }
function findAsset(map, ref, base = '') {
  const joined = normalizePath(`${base}/${ref}`);
  return map.get(assetKey(joined)) || map.get(assetKey(ref)) || [...map.entries()].find(([key]) => key.endsWith(`/${assetKey(ref)}`) || key === assetKey(ref))?.[1];
}
function patchFileRefs(model, map) {
  const refs = model.FileReferences || {};
  const patch = (ref, base = '') => {
    const url = findAsset(map, ref, base);
    return url || ref;
  };
  const base = model.__sourceDir || '';
  if (refs.Moc) refs.Moc = patch(refs.Moc, base);
  if (Array.isArray(refs.Textures)) refs.Textures = refs.Textures.map((ref) => patch(ref, base));
  if (refs.Physics) refs.Physics = patch(refs.Physics, base);
  if (refs.DisplayInfo) refs.DisplayInfo = patch(refs.DisplayInfo, base);
  if (refs.UserData) refs.UserData = patch(refs.UserData, base);
  if (refs.Expressions) refs.Expressions = refs.Expressions.map((entry) => ({ ...entry, File: patch(entry.File, base) }));
  if (refs.Motions) Object.values(refs.Motions).forEach((entries) => entries.forEach((entry) => { if (entry.File) entry.File = patch(entry.File, base); if (entry.Sound) entry.Sound = patch(entry.Sound, base); }));
  delete model.__sourceDir;
  return model;
}

async function loadArchive(file) {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const blobs = new Map();
  for (const entry of entries) {
    const blob = await entry.async('blob');
    const type = blob.type || (entry.name.endsWith('.json') ? 'application/json' : 'application/octet-stream');
    const url = URL.createObjectURL(new Blob([blob], { type }));
    state.objectUrls.push(url);
    blobs.set(assetKey(entry.name), url);
  }
  const manifestEntry = entries.find((entry) => entry.name.toLowerCase().endsWith('.model3.json'));
  if (!manifestEntry) throw new Error('No .model3.json manifest found in this archive.');
  const rawModel = JSON.parse(await manifestEntry.async('text'));
  rawModel.__sourceDir = manifestEntry.name.split('/').slice(0, -1).join('/');
  const model = patchFileRefs(rawModel, blobs);
  const modelBlob = new Blob([JSON.stringify(model)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(modelBlob);
  state.objectUrls.push(manifestUrl);
  const cdiEntry = entries.find((entry) => entry.name.toLowerCase().endsWith('.cdi3.json'));
  const metadata = cdiEntry ? JSON.parse(await cdiEntry.async('text')) : null;
  return { manifestUrl, metadata, label: manifestEntry.name.split('/').pop().replace(/\.model3\.json$/i, ''), fileCount: entries.length, uploaded: true };
}

async function loadDefaultModel() {
  return null;
}

function metadataParameters() {
  const params = state.metadata?.Parameters || [];
  return params.map((param) => ({
    id: param.Id || param.id || param.Name || param.name,
    name: param.Name || param.name || param.Id || param.id,
    min: Number(param.Min ?? param.min ?? -30), max: Number(param.Max ?? param.max ?? 30), default: Number(param.Default ?? param.default ?? 0), group: param.GroupId || param.Group || 'PARAMETER',
  })).filter((param) => param.id);
}
function activeParameters() {
  const all = metadataParameters();
  if (state.mode === 'full') return all;
  const available = new Map(all.map((param) => [param.id, param]));
  return HALF_BODY.map(([label, name, id, min, max]) => available.has(id) ? { ...available.get(id), label, name, min, max, direct: true } : { id, label, name, min, max, direct: false });
}
function getValue(id, fallback = 0) { return state.values[id] ?? fallback; }
function setStatus(label, tone = 'ready') { $('#runtime-label').textContent = label; $('#runtime-dot').className = `status-dot status-${tone}`; }

function renderControls() {
  const params = activeParameters();
  $('#scope-title').textContent = state.mode === 'half' ? 'Half-body mappings' : 'Full-body mappings';
  $('#mapping-count').textContent = `${params.length} ${state.mode === 'half' ? 'direct' : 'exposed'}`;
  $('#control-intro-title').textContent = state.mode === 'half' ? 'Tune the expressive center' : 'Explore every exposed channel';
  $('#control-intro-copy').textContent = state.mode === 'half' ? 'Head, spine, and chest channels mapped to familiar Live2D IDs.' : 'Every parameter in the model metadata is available for direct testing.';
  $('#controls').innerHTML = params.length ? params.map((param) => `<div class="control-row ${param.direct === false ? 'not-found' : ''}"><div class="control-meta"><span>${param.label || param.name}</span><code>${param.id}</code></div><div class="range-line"><input type="range" min="${param.min}" max="${param.max}" step="0.1" value="${getValue(param.id, param.default)}" data-param="${param.id}" aria-label="${param.label || param.name}"><output data-output="${param.id}">${pretty(getValue(param.id, param.default))}</output></div><small>${param.name || param.group}${param.direct === false ? ' · no matching metadata entry' : ''}</small></div>`).join('') : '<div class="empty-controls">No parameter metadata found. The runtime can still render the model, but this package does not expose a CDI parameter list.</div>';
  $$('#controls input[data-param]').forEach((input) => input.addEventListener('input', onParameterInput));
  updatePayload();
}
function onParameterInput(event) {
  const id = event.target.dataset.param; state.values[id] = Number(event.target.value); const output = document.querySelector(`[data-output="${CSS.escape(id)}"]`); if (output) output.textContent = pretty(state.values[id]); syncModelParameter(id, state.values[id]); updatePayload();
}
function updatePayload() {
  const params = activeParameters(); const payload = Object.fromEntries(params.map((param) => [param.id, Number(getValue(param.id, param.default).toFixed(2))])); $('#payload').textContent = JSON.stringify(payload, null, 2); const changed = Object.values(state.values).filter((value) => value !== 0).length; $('#value-count').textContent = `${changed} / ${params.length} changed`; $('#payload-state').textContent = `${params.length} values · ${state.mode} scope`;
}
function syncModelParameter(id, value) { state.runtime?.model?.internalModel?.coreModel?.setParameterValueById(id, value, 1); }
function resetValues() { state.values = {}; renderControls(); if (state.runtime?.model?.internalModel?.coreModel) metadataParameters().forEach(({ id }) => state.runtime.model.internalModel.coreModel.setParameterValueById(id, 0, 1)); }

function updateModelIdentity() {
  const label = state.model?.label || 'Demo model'; $('#model-name').textContent = label; $('#stage-title').textContent = label; $('#stage-caption-title').textContent = state.model?.uploaded ? `${label} imported` : `${label} ready`; $('#model-subtitle').textContent = state.model?.uploaded ? `${state.model.fileCount} local assets found in your package.` : 'A starter model is loaded for you.'; $('#asset-strip').innerHTML = `<span>${state.model?.uploaded ? 'LOCAL PACKAGE' : 'DEMO MODEL'}</span><span>${metadataParameters().length || '—'} parameters</span><span>${state.model?.fileCount || '—'} assets</span><span>${state.model?.uploaded ? 'not uploaded' : 'ready'}</span>`;
}
function renderCoverage() {
  const all = metadataParameters(); const params = activeParameters(); const direct = state.mode === 'half' ? params.filter((p) => p.direct !== false).length : params.length; const percent = all.length ? Math.round((direct / all.length) * 100) : 0; $('#coverage-fill').style.width = `${Math.max(percent, state.mode === 'half' ? 14 : 0)}%`; $('#coverage-percent').textContent = all.length ? `${percent}%` : 'n/a'; $('#coverage-label').textContent = state.mode === 'half' ? 'Half-body focus' : 'Full metadata'; $('#coverage-copy').textContent = state.mode === 'half' ? `${direct} familiar channels ready to test` : `${direct} exposed channels available in this model`;
  $('#mapping-list').innerHTML = state.mode === 'half' ? `<div><span class="mapping-pill direct">DIRECT</span><p>Head rotation, nod, tilt, spine, and chest IDs are ready for testing.</p></div><div><span class="mapping-pill skipped">SKIPPED</span><p>Leg, foot, toe, and unsupported deformer channels stay out of half-body mode.</p></div><div><span class="mapping-pill info">LOCAL</span><p>Uploaded packages are parsed in memory and never sent to a server.</p></div>` : `<div><span class="mapping-pill direct">EXPOSED</span><p>All parameters listed in the model’s CDI metadata are available in the control deck.</p></div><div><span class="mapping-pill info">DISCOVER</span><p>Use full-body mode to inspect channels that were not included in the half-body mapping preset.</p></div>`;
}

async function loadScript(src) { return new Promise((resolve, reject) => { if (document.querySelector(`script[src="${src}"]`)) return resolve(); const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = () => reject(new Error(`Could not load ${src}`)); document.head.appendChild(script); }); }
async function loadCubismCore() {
  try { await loadScript('/cubismcore/live2dcubismcore.min.js'); return 'bundled'; } catch (error) {
    const desktop = Boolean(window.__TAURI__ || window.__TAURI_INTERNALS__);
    if (desktop) throw new Error('Offline desktop build needs a licensed local Cubism Core runtime at public/cubismcore/live2dcubismcore.min.js.');
    await loadScript('https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js'); return 'remote';
  }
}
function resizeRuntime() { const runtime = state.runtime; if (!runtime?.app || !runtime?.model) return; const stage = $('.stage'); const width = stage.clientWidth; const height = stage.clientHeight; runtime.app.renderer.resize(width, height); const modelWidth = runtime.model.internalModel.originalWidth || 1000; const modelHeight = runtime.model.internalModel.originalHeight || 1000; const scale = Math.min((width * 0.7) / modelWidth, (height * 0.9) / modelHeight); runtime.model.scale.set(scale); runtime.model.anchor.set(0.5, 1); runtime.model.position.set(width / 2, height * 0.95); }
async function activateRuntime() {
  if (!state.model?.manifestUrl) { $('#runtime-help').textContent = 'Import a .zip or .model3.json package before activating the runtime.'; return; } const button = $('#activate-runtime'); button.disabled = true; button.innerHTML = 'Loading runtime <span>…</span>'; setStatus('Loading Cubism Core', 'loading'); $('#runtime-help').textContent = 'Preparing the compiled model in this browser tab.';
  try { const coreSource = await loadCubismCore(); const PIXI = await import('pixi.js'); const { Live2DModel } = await import('pixi-live2d-display/cubism4'); window.PIXI = PIXI; Live2DModel.registerTicker(PIXI.Ticker); if (state.runtime?.model) state.runtime.model.destroy({ children: true }); if (state.runtime?.app) state.runtime.app.destroy(false, { children: true }); const canvas = $('#runtime-canvas'); const pixiApp = new PIXI.Application({ view: canvas, transparent: true, antialias: true, autoStart: true }); const model = await Live2DModel.from(state.model.manifestUrl, { autoUpdate: true }); pixiApp.stage.addChild(model); state.runtime = { app: pixiApp, model }; window.__motionlabRuntime = state.runtime; resizeRuntime(); window.addEventListener('resize', resizeRuntime, { passive: true }); $('.empty-stage').classList.add('hidden'); canvas.classList.add('is-live'); button.innerHTML = 'Runtime active <span>✓</span>'; setStatus('Runtime active', 'active'); $('#runtime-help').textContent = coreSource === 'bundled' ? 'Using the bundled offline Cubism Core runtime.' : 'Using the browser Cubism Core fallback; desktop builds require a bundled runtime.'; $('#stage-caption-copy').textContent = 'Live2D Core is rendering from your local model package.'; } catch (error) { console.error(error); window.__live2dRuntimeError = error?.stack || String(error); button.disabled = false; button.innerHTML = 'Retry runtime <span>↻</span>'; setStatus('Runtime failed', 'error'); $('#runtime-help').textContent = error.message || 'Could not initialize this model. Open the browser console for the exact error.'; }
}
async function importFiles(fileList) {
  const files = [...fileList]; if (!files.length) return; const zip = files.find((file) => file.name.toLowerCase().endsWith('.zip')); $('#runtime-help').textContent = 'Reading your package locally…'; try { if (zip) { clearObjectUrls(); state.model = await loadArchive(zip); state.metadata = state.model.metadata; } else { const manifest = files.find((file) => file.name.toLowerCase().endsWith('.model3.json')); if (!manifest) throw new Error('Choose a .zip or include a .model3.json manifest.'); const manifestUrl = URL.createObjectURL(manifest); state.objectUrls.push(manifestUrl); const cdi = files.find((file) => file.name.toLowerCase().endsWith('.cdi3.json')); state.model = { manifestUrl, metadata: cdi ? JSON.parse(await cdi.text()) : null, label: manifest.name.replace(/\.model3\.json$/i, ''), fileCount: files.length, uploaded: true }; state.metadata = state.model.metadata; } state.values = {}; updateModelIdentity(); renderControls(); renderCoverage(); $('#dropzone').classList.remove('is-dragging'); setStatus('Model imported', 'active'); $('#runtime-help').textContent = 'Package loaded locally. Activate the runtime to render it.'; await activateRuntime(); } catch (error) { setStatus('Import failed', 'error'); $('#runtime-help').textContent = error.message; $('#dropzone').classList.remove('is-dragging'); } }

$$('[data-mode]').forEach((button) => button.addEventListener('click', () => { state.mode = button.dataset.mode; $$('[data-mode]').forEach((item) => item.classList.toggle('active', item === button)); renderControls(); renderCoverage(); }));
$('#choose-model').addEventListener('click', () => $('#model-input').click()); $('#upload-top').addEventListener('click', () => $('#model-input').click()); $('#model-input').addEventListener('change', (event) => importFiles(event.target.files)); $('#dropzone').addEventListener('dragover', (event) => { event.preventDefault(); $('#dropzone').classList.add('is-dragging'); }); $('#dropzone').addEventListener('dragleave', () => $('#dropzone').classList.remove('is-dragging')); $('#dropzone').addEventListener('drop', (event) => { event.preventDefault(); importFiles(event.dataTransfer.files); }); $('#activate-runtime').addEventListener('click', activateRuntime); $('#reset-values').addEventListener('click', resetValues); $('#clear-session').addEventListener('click', async () => { if (state.runtime?.model) state.runtime.model.destroy({ children: true }); if (state.runtime?.app) state.runtime.app.destroy(false, { children: true }); clearObjectUrls(); state.model = await loadDefaultModel(); state.metadata = state.model.metadata; state.values = {}; renderAll(); setStatus('Ready to render', 'ready'); $('#runtime-canvas').classList.remove('is-live'); $('.empty-stage').classList.remove('hidden'); $('#activate-runtime').disabled = false; $('#activate-runtime').innerHTML = 'Activate runtime <span>→</span>'; }); $('#copy-payload').addEventListener('click', async () => { await navigator.clipboard?.writeText($('#payload').textContent); $('#copy-payload').textContent = 'Copied'; setTimeout(() => { $('#copy-payload').textContent = 'Copy JSON'; }, 1200); });

function renderAll() { updateModelIdentity(); renderControls(); renderCoverage(); }
loadDefaultModel().then((model) => { state.model = model; state.metadata = model?.metadata || null; renderAll(); $('#activate-runtime').disabled = true; $('#activate-runtime').innerHTML = 'Import a model first <span>↑</span>'; $('#runtime-help').textContent = 'This public desktop client intentionally ships without anyone’s character assets. Import your own package to begin.'; });
