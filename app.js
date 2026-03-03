// Holz-Volumen Rechner – vanilla JS
// Mirrors the Excel logic:
// Radius (m) = Umfang(cm) / 100 / 2 / PI
// Volumen (m^3) = PI * Radius^2 * Länge(cm)/100
//
// Persistence:
// - Saved rows are stored in localStorage.
// UX changes (per request):
// - First visit: no pre-filled entries.
// - Each row has a "Speichern" button; calculations apply only after saving.
// - A new empty row appears automatically after saving a row with values.
// - No "add row" button is needed.

const PI = Math.PI;
const fmt = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 6 });

const STORAGE_KEY = "holzVolumenRechner:v2";

const tableBody = document.querySelector("#calcTable tbody");
const sumCell = document.querySelector("#sumCell");
const clearBtn = document.querySelector("#clearBtn");
const clearSavedBtn = document.querySelector("#clearSavedBtn");

function toNumber(v) {
  if (v === "" || v === null || v === undefined) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function calcRow(lengthCm, circumferenceCm) {
  const L = toNumber(lengthCm);
  const U = toNumber(circumferenceCm);

  if (!Number.isFinite(L) || !Number.isFinite(U) || L < 0 || U < 0) {
    return { radiusM: NaN, volumeM3: NaN };
  }
  const radiusM = (U / 100) / 2 / PI;
  const volumeM3 = PI * (radiusM ** 2) * (L / 100);
  return { radiusM, volumeM3 };
}

// -------- persistence (saved rows only) --------
function getSavedRowsFromDOM() {
  const rows = [];
  for (const tr of tableBody.querySelectorAll("tr")) {
    const savedLen = tr.dataset.savedLen ?? "";
    const savedUmf = tr.dataset.savedUmf ?? "";
    if (savedLen !== "" || savedUmf !== "") {
      rows.push({ laenge_cm: savedLen, umfang_cm: savedUmf });
    }
  }
  return rows;
}

function saveState() {
  try {
    const payload = { rows: getSavedRowsFromDOM(), savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Saving disabled:", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows)) return null;
    return parsed.rows;
  } catch {
    return null;
  }
}

function clearSavedState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// -------- rendering --------
function renderSum() {
  let sum = 0;
  for (const tr of tableBody.querySelectorAll("tr")) {
    const savedLen = tr.dataset.savedLen ?? "";
    const savedUmf = tr.dataset.savedUmf ?? "";
    const { volumeM3 } = calcRow(savedLen, savedUmf);
    if (Number.isFinite(volumeM3)) sum += volumeM3;
  }
  sumCell.textContent = fmt.format(sum);
}

function updateRowOutputs(tr) {
  const rOut = tr.querySelector('[data-out="radius"]');
  const vOut = tr.querySelector('[data-out="volume"]');

  const savedLen = tr.dataset.savedLen ?? "";
  const savedUmf = tr.dataset.savedUmf ?? "";

  if (savedLen === "" && savedUmf === "") {
    rOut.textContent = "—";
    vOut.textContent = "—";
    return;
  }

  const { radiusM, volumeM3 } = calcRow(savedLen, savedUmf);
  rOut.textContent = Number.isFinite(radiusM) ? fmt.format(radiusM) : "—";
  vOut.textContent = Number.isFinite(volumeM3) ? fmt.format(volumeM3) : "—";
}

function ensureTrailingEmptyRow() {
  const trs = Array.from(tableBody.querySelectorAll("tr"));
  if (trs.length === 0) {
    addRow();
    return;
  }
  const last = trs[trs.length - 1];
  const lastSavedLen = last.dataset.savedLen ?? "";
  const lastSavedUmf = last.dataset.savedUmf ?? "";

  // If the last row has saved values, append a new empty row.
  if (lastSavedLen !== "" || lastSavedUmf !== "") {
    addRow();
  }
}

function addRow(values = { laenge_cm: "", umfang_cm: "" }) {
  const tr = document.createElement("tr");

  // Saved values drive calculations; inputs are editable drafts.
  tr.dataset.savedLen = values.laenge_cm ?? "";
  tr.dataset.savedUmf = values.umfang_cm ?? "";

  tr.innerHTML = `
    <td>
      <div class="cellFlex">
        <input data-col="laenge" type="number" inputmode="decimal" step="any" min="0" placeholder="z.B. 500" value="${values.laenge_cm ?? ""}">
        <button class="saveBtn" type="button" title="Werte speichern">Speichern</button>
      </div>
    </td>
    <td>
      <input data-col="umfang" type="number" inputmode="decimal" step="any" min="0" placeholder="z.B. 88" value="${values.umfang_cm ?? ""}">
    </td>
    <td class="out" data-out="radius">—</td>
    <td class="out" data-out="volume">—</td>
    <td><button class="iconBtn" type="button" title="Zeile löschen" aria-label="Zeile löschen"><span>×</span></button></td>
  `;

  const lenInput = tr.querySelector('input[data-col="laenge"]');
  const umfInput = tr.querySelector('input[data-col="umfang"]');
  const saveBtn = tr.querySelector(".saveBtn");

  // Mark row as "dirty" when typing (purely visual; outputs won't change until save).
  function markDirty() {
    tr.classList.add("dirty");
  }
  lenInput.addEventListener("input", markDirty);
  umfInput.addEventListener("input", markDirty);

  saveBtn.addEventListener("click", () => {
    const lenVal = (lenInput.value ?? "").trim();
    const umfVal = (umfInput.value ?? "").trim();

    // If both empty: treat as "not saved"
    tr.dataset.savedLen = lenVal;
    tr.dataset.savedUmf = umfVal;

    tr.classList.remove("dirty");

    updateRowOutputs(tr);
    ensureTrailingEmptyRow();
    renderSum();
    saveState();
  });

  tr.querySelector(".iconBtn").addEventListener("click", () => {
    tr.remove();
    // Ensure at least one empty row exists
    if (tableBody.querySelectorAll("tr").length === 0) addRow();
    ensureTrailingEmptyRow();
    // Recompute after delete
    for (const row of tableBody.querySelectorAll("tr")) updateRowOutputs(row);
    renderSum();
    saveState();
  });

  tableBody.appendChild(tr);
  updateRowOutputs(tr);
}

function setRows(savedRows) {
  tableBody.innerHTML = "";
  if (Array.isArray(savedRows) && savedRows.length) {
    savedRows.forEach(r => addRow(r));
  } else {
    addRow(); // first visit: empty
  }
  ensureTrailingEmptyRow();
  renderSum();
}

// -------- toolbar buttons --------
clearBtn.addEventListener("click", () => {
  // Clear current entries and also clear saved state (keeps storage consistent)
  tableBody.innerHTML = "";
  addRow();
  ensureTrailingEmptyRow();
  renderSum();
  saveState(); // saves as empty
});

if (clearSavedBtn) {
  clearSavedBtn.addEventListener("click", () => {
    clearSavedState();
    tableBody.innerHTML = "";
    addRow();
    ensureTrailingEmptyRow();
    renderSum();
    // Do not auto-save: leave storage empty until the user saves a row
  });
}

// -------- bootstrap --------
const saved = loadState();
if (saved) {
  setRows(saved);
} else {
  // Explicitly ignore any embedded initial rows (first visit should be empty)
  setRows([]);
}
