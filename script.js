const STORAGE_KEY = "hmr_ui_sketch_v1";

const elDate = document.getElementById("date");
const elCP1 = document.getElementById("cp1");
const elCP2 = document.getElementById("cp2");
const elScriptUrl = document.getElementById("scriptUrl");
const statusEl = document.getElementById("status");

const rowsHEO = document.getElementById("rows-HEO");
const rowsSpotter = document.getElementById("rows-Spotter");
const rowsHelper = document.getElementById("rows-Helper");
const rowsFlagman = document.getElementById("rows-Flagman");
const rowsEquip = document.getElementById("rows-Equipment");

const elDraftKey = document.getElementById("draftKey");
const btnSaveDraft = document.getElementById("saveDraft");
const btnLoadDraft = document.getElementById("loadDraft");


function setStatus(msg, ok = true){
  statusEl.textContent = msg;
  statusEl.style.color = ok ? "#9fb0c7" : "#ff9aa3";
}

function num(v){
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function save(){
  // Save everything EXCEPT OT values
  const data = {
    header: {
      date: elDate.value || "",
      cp1: elCP1.value || "",
      cp2: elCP2.value || "",
      scriptUrl: elScriptUrl.value || "",
      draftKey: elDraftKey.value || ""
    },
    manpower: {
      HEO: serializeMan(rowsHEO),
      Spotter: serializeMan(rowsSpotter),
      Helper: serializeMan(rowsHelper),
      Flagman: serializeMan(rowsFlagman)
    },
    equipment: serializeEquip(rowsEquip)
  };

  // OT rule: blank OT before saving
  ["HEO","Spotter","Helper","Flagman"].forEach(role => {
    data.manpower[role] = data.manpower[role].map(r => ({...r, otHours:""}));
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  setStatus("Saved locally (OT will NOT restore after refresh).");
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    // Defaults: 3 rows each like your sketch
    for(let i=0;i<3;i++) addManRow("HEO");
    for(let i=0;i<3;i++) addManRow("Spotter");
    for(let i=0;i<3;i++) addManRow("Helper");
    for(let i=0;i<3;i++) addManRow("Flagman");
    addEquipRow(); addEquipRow();
    return;
  }

  try{
    const data = JSON.parse(raw);
    elDate.value = data.header?.date || "";
    elCP1.value = data.header?.cp1 || "";
    elCP2.value = data.header?.cp2 || "";
    elScriptUrl.value = data.header?.scriptUrl || "";
    elDraftKey.value = data.header?.draftKey || "";

    rowsHEO.innerHTML = "";
    rowsSpotter.innerHTML = "";
    rowsHelper.innerHTML = "";
    rowsFlagman.innerHTML = "";
    rowsEquip.innerHTML = "";

    (data.manpower?.HEO || []).forEach(r => addManRow("HEO", r));
    (data.manpower?.Spotter || []).forEach(r => addManRow("Spotter", r));
    (data.manpower?.Helper || []).forEach(r => addManRow("Helper", r));
    (data.manpower?.Flagman || []).forEach(r => addManRow("Flagman", r));

    (data.equipment || []).forEach(r => addEquipRow(r));

    // Ensure at least one row per section
    if(!rowsHEO.children.length) addManRow("HEO");
    if(!rowsSpotter.children.length) addManRow("Spotter");
    if(!rowsHelper.children.length) addManRow("Helper");
    if(!rowsFlagman.children.length) addManRow("Flagman");
    if(!rowsEquip.children.length) addEquipRow();

    setStatus("Loaded saved form (OT cleared by rule).");
  } catch(e){
    localStorage.removeItem(STORAGE_KEY);
  }
}

function makeInput(type, placeholder="", value=""){
  const i = document.createElement("input");
  i.type = type;
  i.placeholder = placeholder;
  i.value = value ?? "";
  return i;
}

function makeXBtn(onClick){
  const b = document.createElement("button");
  b.className = "xbtn";
  b.textContent = "X";
  b.addEventListener("click", onClick);
  return b;
}

// ---------- MANPOWER ----------
function makeCell(labelText, inputEl){
  const cell = document.createElement("div");
  cell.className = "cell";

  const lab = document.createElement("div");
  lab.className = "miniLabel";
  lab.textContent = labelText;

  cell.append(lab, inputEl);
  return cell;
}

// ---------- MANPOWER CONTAINER RESOLVER ----------
function getManContainer(role){
  if (role === "HEO") return rowsHEO;
  if (role === "Spotter") return rowsSpotter;
  if (role === "Helper") return rowsHelper;
  if (role === "Flagman") return rowsFlagman;
  return null;
}

function addManRow(role, data = {}){
  const wrap = document.createElement("div");
  wrap.className = "rowMan";

  const roleToDatalist = {
    HEO: "dl-heo",
    Spotter: "dl-spotter",
    Helper: "dl-helper",
    Flagman: "dl-flagman"
  };
  
  const name = makeInput("text","Name", data.name || "");
  name.setAttribute("list", roleToDatalist[role] || "dl-helper");

  const work = makeInput("number","Work Hours", data.workHours || "");
  work.step = "0.5";

  const ot = makeInput("number","OT Hours", data.otHours || "");
  ot.step = "0.5";

  const x = makeXBtn(() => { wrap.remove(); save(); });

  [name, work, ot].forEach(el => el.addEventListener("input", save));

  wrap.append(
    makeCell("Name", name),
    makeCell("Work Hours", work),
    makeCell("OT Hours", ot),
    x
  );

  getManContainer(role).appendChild(wrap);
}

// ---------- SERIALIZE MANPOWER ----------
function serializeMan(container){
  const rows = [];

  [...container.children].forEach(row => {
    const inputs = row.querySelectorAll("input");

    if (inputs.length < 3) return;

    rows.push({
      name: inputs[0].value || "",
      workHours: inputs[1].value || "",
      otHours: inputs[2].value || ""
    });
  });

  return rows;
}

// ---------- EQUIPMENT ----------
function addEquipRow(data = {}){
  const wrap = document.createElement("div");
  wrap.className = "rowEq";

  const eq = makeInput("text","Equipment Name", data.equipmentName || "");
  eq.setAttribute("list", "dl-equipment");

  const before = makeInput("number","Before", data.before || "");
  const after  = makeInput("number","After",  data.after || "");
  before.step = "0.01";
  after.step  = "0.01";

  const hmr = makeInput("number","HMR", data.hmr || "");
  hmr.step = "0.01";
  hmr.readOnly = true;
  hmr.classList.add("readonly");

  function compute(){
    const v = num(after.value) - num(before.value);
    hmr.value = (Number.isFinite(v) ? v : 0).toFixed(2);
  }

  before.addEventListener("input", () => { compute(); save(); });
  after.addEventListener("input", () => { compute(); save(); });
  eq.addEventListener("input", save);

  const x = makeXBtn(() => { wrap.remove(); save(); });

  wrap.append(
    makeCell("Equipment", eq),
    makeCell("Before", before),
    makeCell("After", after),
    makeCell("HMR", hmr),
    x
  );

  rowsEquip.appendChild(wrap);
  compute();
}

function serializeEquip(container){
  const rows = [];
  [...container.children].forEach(r => {
    const inputs = r.querySelectorAll("input");
    rows.push({
      equipmentName: inputs[0]?.value || "",
      before: inputs[1]?.value || "",
      after: inputs[2]?.value || "",
      hmr: inputs[3]?.value || ""
    });
  });
  return rows;
}

// ---------- Buttons ----------
document.querySelectorAll("[data-add]").forEach(btn => {
  btn.addEventListener("click", () => addManRow(btn.getAttribute("data-add")));
});

document.getElementById("addEquipment").addEventListener("click", () => addEquipRow());

document.getElementById("resetOt").addEventListener("click", () => {
  [rowsHEO, rowsSpotter, rowsHelper, rowsFlagman].forEach(container => {
    [...container.children].forEach(r => {
      const ot = r.querySelectorAll("input")[2];
      if(ot) ot.value = "";
    });
  });
  setStatus("OT cleared.");
});

document.getElementById("clearSaved").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

[elDate, elCP1, elCP2, elScriptUrl].forEach(el => el.addEventListener("input", save));

// ---------- Submit ----------
function buildPayload(){
  const manpowerAll = [
    ...serializeMan(rowsHEO).map(r => ({ role:"HEO", ...r })),
    ...serializeMan(rowsSpotter).map(r => ({ role:"Spotter", ...r })),
    ...serializeMan(rowsHelper).map(r => ({ role:"Helper", ...r })),
    ...serializeMan(rowsFlagman).map(r => ({ role:"Flagman", ...r }))
  ];

  // ✅ Filter rule: don't submit if Work Hours is blank (or not a number)
  const manpowerFiltered = manpowerAll.filter(r => {
    const name = String(r.name || "").trim();
    const work = parseFloat(r.workHours);
  
    if (!name) return false;
    if (!Number.isFinite(work)) return false;
    if (work <= 0) return false;
  
    return true;
  });

  return {
    date: elDate.value || "",
    cp1: elCP1.value || "",
    cp2: elCP2.value || "",
    manpower: manpowerFiltered,
    equipment: serializeEquip(rowsEquip)
  };
}

async function submitAll(){
  const url = elScriptUrl.value.trim();
  if(!url) return setStatus("Paste Apps Script Web App URL first.", false);

  const payload = buildPayload();
  if(!payload.date) return setStatus("Date is required.", false);

  setStatus("Submitting...");
  try{
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    let json;
    try{ json = JSON.parse(text); } catch { json = { raw:text }; }

    if(json.status === "ok"){
      setStatus(`Submitted ✅ ${json.message || ""}`.trim());
      
      // ✅ NEW: after submit, move After -> Before (equipment section)
      rollEquipmentAfterToBefore();
      
    } else {
      setStatus(`Submit failed: ${json.message || text}`, false);
    }
  } catch(e){
    setStatus(`Submit error: ${e.message}`, false);
  }
}

document.getElementById("submitAll").addEventListener("click", submitAll);

function fillDatalist(id, items) {
  const dl = document.getElementById(id);
  if (!dl) return;
  dl.innerHTML = "";
  (items || []).forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    dl.appendChild(opt);
  });
}

async function refreshMasterData() {
  const url = (elScriptUrl.value || "").trim();
  if (!url) return;

  try {
    // Works whether your URL already has ? or not
    const u = new URL(url);
    u.searchParams.set("action", "masterdata");

    const res = await fetch(u.toString(), { method: "GET" });
    const text = await res.text();

    let json;
    try { json = JSON.parse(text); } catch { json = null; }

    if (!json || json.status !== "ok") {
      setStatus("MasterData fetch failed (check Web App access).", false);
      return;
    }

    const d = json.data || {};
    fillDatalist("dl-heo", d.HEO || []);
    fillDatalist("dl-spotter", d.Spotter || []);
    fillDatalist("dl-helper", d.Helper || []);
    fillDatalist("dl-flagman", d.Flagman || []);
    fillDatalist("dl-equipment", d.Equipment || []);

    setStatus("Autocomplete lists updated from MasterData ✅");
  } catch (e) {
    setStatus("MasterData fetch error: " + e.message, false);
  }
}

function rollEquipmentAfterToBefore() {
  [...rowsEquip.children].forEach(row => {
    const inputs = row.querySelectorAll("input");
    if (!inputs || inputs.length < 4) return;

    const eqName = inputs[0];
    const before = inputs[1];
    const after  = inputs[2];
    const hmr    = inputs[3];

    const eq = (eqName.value || "").trim();
    const a  = (after.value || "").trim();

    // only roll real rows with AFTER value
    if (!eq) return;
    if (a === "") return;

    // ✅ move After -> Before
    before.value = a;

    // ✅ clear After
    after.value = "";

    // ✅ clear HMR (so next time it recomputes when you type new After)
    hmr.value = "";
  });

  // persist changes
  save();
}

function buildDraftObject() {
  // Same structure you already store locally
  return {
    header: {
      date: elDate.value || "",
      cp1: elCP1.value || "",
      cp2: elCP2.value || "",
      scriptUrl: elScriptUrl.value || "",
      draftKey: elDraftKey.value || ""
    },
    manpower: {
      HEO: serializeMan(rowsHEO),
      Spotter: serializeMan(rowsSpotter),
      Helper: serializeMan(rowsHelper),
      Flagman: serializeMan(rowsFlagman),
    },
    equipment: serializeEquip(rowsEquip)
  };
}

async function saveDraftToCloud() {
  const url = (elScriptUrl.value || "").trim();
  const key = (elDraftKey.value || "").trim();
  if (!url || !key) return setStatus("Set Script URL and Draft Key first.", false);

  const payload = {
    action: "draftSave",
    key,
    data: buildDraftObject()
  };

  setStatus("Saving draft to cloud...");
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    saveLocalSilent()
    setStatus("Draft saved to cloud ✅");
  } catch (e) {
    setStatus("Draft save failed: " + e.message, false);
  }
}

function saveLocalSilent(){
  const data = {
    header: {
      date: elDate.value || "",
      cp1: elCP1.value || "",
      cp2: elCP2.value || "",
      scriptUrl: elScriptUrl.value || "",
      draftKey: elDraftKey.value || ""
    },
    manpower: {
      HEO: serializeMan(rowsHEO),
      Spotter: serializeMan(rowsSpotter),
      Helper: serializeMan(rowsHelper),
      Flagman: serializeMan(rowsFlagman)
    },
    equipment: serializeEquip(rowsEquip)
  };

  // OT rule: blank OT before saving
  ["HEO","Spotter","Helper","Flagman"].forEach(role => {
    data.manpower[role] = data.manpower[role].map(r => ({...r, otHours:""}));
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadDraftFromCloud() {
  const url = (elScriptUrl.value || "").trim();
  const key = (elDraftKey.value || "").trim();
  if (!url || !key) return setStatus("Set Script URL and Draft Key first.", false);

  setStatus("Loading draft from cloud...");

  // JSONP callback name (unique each call)
  const cb = "__draft_cb_" + Date.now();

  // Build URL with action + key + cb
  const u = new URL(url);
  u.searchParams.set("action", "draftGet");
  u.searchParams.set("key", key);
  u.searchParams.set("src", (elScriptUrl.value || "").trim());  // ✅ ADD THIS
  u.searchParams.set("cb", cb);

  // Define callback
  window[cb] = (json) => {
    try {
      if (!json || json.status !== "ok") {
        setStatus((json && json.message) || "Draft load failed", false);
        return;
      }
      if (!json.data) {
        setStatus("No saved draft found for that key.", false);
        return;
      }

      const d = json.data;

      elDate.value = d.header?.date || elDate.value;
      elCP1.value = d.header?.cp1 || elCP1.value;
      elCP2.value = d.header?.cp2 || elCP2.value;

      rowsHEO.innerHTML = "";
      rowsSpotter.innerHTML = "";
      rowsHelper.innerHTML = "";
      rowsFlagman.innerHTML = "";
      rowsEquip.innerHTML = "";

      (d.manpower?.HEO || []).forEach(r => addManRow("HEO", r));
      (d.manpower?.Spotter || []).forEach(r => addManRow("Spotter", r));
      (d.manpower?.Helper || []).forEach(r => addManRow("Helper", r));
      (d.manpower?.Flagman || []).forEach(r => addManRow("Flagman", r));
      (d.equipment || []).forEach(r => addEquipRow(r));

      saveLocalSilent()
      setStatus("Loaded draft from cloud ✅");
    } finally {
      // cleanup
      delete window[cb];
      script.remove();
    }
  };

  // Inject script tag (JSONP)
  const script = document.createElement("script");
  script.src = u.toString();
  script.onerror = () => {
    setStatus("Draft load failed (network/CORS).", false);
    delete window[cb];
    script.remove();
  };
  document.body.appendChild(script);
}

// --- Draft sync listeners (attach once) ---
if (btnSaveDraft) btnSaveDraft.addEventListener("click", saveDraftToCloud);
if (btnLoadDraft) btnLoadDraft.addEventListener("click", loadDraftFromCloud);

function autoLoadDraftIfReady() {
  const url = (elScriptUrl.value || "").trim();
  const key = (elDraftKey.value || "").trim();
  if (url && key) loadDraftFromCloud();
}

// INIT
load();
refreshMasterData();

// When scriptUrl changes, re-fetch autocomplete
elScriptUrl.addEventListener("change", refreshMasterData);
elScriptUrl.addEventListener("blur", refreshMasterData);
