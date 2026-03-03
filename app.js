// Holz-Volumen Rechner – vanilla JS
// Mirrors the Excel logic:
// Radius (m) = Umfang(cm) / 100 / 2 / PI
// Volumen (m^3) = PI * Radius^2 * Länge(cm)/100
//
// Cookie/Local persistence:
// - Values are saved automatically to localStorage (preferred over cookies for size/reliability).
// - A "Gespeicherte Werte löschen" button clears the saved state.

const PI = Math.PI;
const fmt = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 6 });

const STORAGE_KEY = "holzVolumenRechner:v1";

const tableBody = document.querySelector("#calcTable tbody");
const sumCell = document.querySelector("#sumCell");
const addRowBtn = document.querySelector("#addRowBtn");
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

function getRowsFromDOM() {
  const rows = [];
  for (const tr of tableBody.querySelectorAll("tr")) {
    const lenInput = tr.querySelector('input[data-col="laenge"]');
    const umfInput = tr.querySelector('input[data-col="umfang"]');
    rows.push({
      laenge_cm: lenInput?.value ?? "",
      umfang_cm: umfInput?.value ?? ""
    });
  }
  return rows;
}

function saveState() {
  try {
    const payload = {
      rows: getRowsFromDOM(),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // If storage is blocked (private mode / settings), fail silently.
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
  } catch (e) {
    return null;
  }
}

function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}

function render({ skipSave = false } = {}) {
  let sum = 0;

  for (const tr of tableBody.querySelectorAll("tr")) {
    const lenInput = tr.querySelector('input[data-col="laenge"]');
    const umfInput = tr.querySelector('input[data-col="umfang"]');
    const rOut = tr.querySelector('[data-out="radius"]');
    const vOut = tr.querySelector('[data-out="volume"]');

    const { radiusM, volumeM3 } = calcRow(lenInput.value, umfInput.value);

    rOut.textContent = Number.isFinite(radiusM) ? fmt.format(radiusM) : "—";
    vOut.textContent = Number.isFinite(volumeM3) ? fmt.format(volumeM3) : "—";

    if (Number.isFinite(volumeM3)) sum += volumeM3;
  }

  sumCell.textContent = fmt.format(sum);

  if (!skipSave) saveState();
}

function addRow(values = { laenge_cm: "", umfang_cm: "" }) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input data-col="laenge" type="number" inputmode="decimal" step="any" min="0" placeholder="z.B. 500" value="${values.laenge_cm ?? ""}"></td>
    <td><input data-col="umfang" type="number" inputmode="decimal" step="any" min="0" placeholder="z.B. 88" value="${values.umfang_cm ?? ""}"></td>
    <td class="out" data-out="radius">—</td>
    <td class="out" data-out="volume">—</td>
    <td><button class="iconBtn" type="button" title="Zeile löschen" aria-label="Zeile löschen"><span>×</span></button></td>
  `;

  const inputs = tr.querySelectorAll("input");
  inputs.forEach(inp => inp.addEventListener("input", () => render()));

  tr.querySelector("button").addEventListener("click", () => {
    tr.remove();
    // keep at least one row
    if (tableBody.querySelectorAll("tr").length === 0) addRow();
    render();
  });

  tableBody.appendChild(tr);
}

function setRows(rows) {
  tableBody.innerHTML = "";
  if (Array.isArray(rows) && rows.length) {
    rows.forEach(r => addRow(r));
  } else {
    addRow();
  }
  render({ skipSave: true }); // render once without saving, then save explicitly
  saveState();
}

addRowBtn.addEventListener("click", () => {
  addRow();
  render();
});

clearBtn.addEventListener("click", () => {
  tableBody.innerHTML = "";
  addRow(); // keep one empty row
  render();
});

if (clearSavedBtn) {
  clearSavedBtn.addEventListener("click", () => {
    clearSavedState();
    tableBody.innerHTML = "";
    addRow();
    render({ skipSave: true });
    // don't auto-save immediately; leave it empty until user enters values
  });
}

// bootstrap: prefer saved state, fallback to embedded Excel values
const saved = loadState();
if (saved) {
  setRows(saved);
} else {
  const initial = Array.isArray(window.__INITIAL_ROWS__) ? window.__INITIAL_ROWS__ : [];
  setRows(initial);
}
