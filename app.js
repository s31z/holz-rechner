// Holz-Volumen Rechner (statische Seite)
// Formeln (wie Excel):
// Radius (m) = Umfang(cm) / 100 / 2 / PI
// Volumen (m³) = PI * Radius² * Länge(cm)/100
//
// UX:
// - Erste Nutzung: leer (keine vorausgefüllten Werte).
// - Pro Zeile: 2 Eingaben, dann "Speichern" (erst dann wird gerechnet).
// - Nach dem Speichern wird automatisch eine neue leere Zeile angehängt.
// - Ein Button "Alle Werte löschen" löscht Tabelle + gespeicherte Daten.
//
// Persistenz: localStorage (keine Cookies notwendig)

const PI = Math.PI;
const fmt = new Intl.NumberFormat("de-DE", { 
  minimumFractionDigits: 0,
  maximumFractionDigits: 2 });
const KEY = "holzVolumenRechner:v3";

const body = document.querySelector("#calcTable tbody");
const sumCell = document.querySelector("#sumCell");
const clearAllBtn = document.querySelector("#clearAllBtn");

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const calc = (Lcm, Ucm) => {
  const L = num(Lcm);
  const U = num(Ucm);
  if (!Number.isFinite(L) || !Number.isFinite(U) || L < 0 || U < 0) return { r: NaN, v: NaN };
  const r = (U / 100) / 2 / PI;
  const v = PI * r * r * (L / 100);
  return { r, v };
};

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data?.rows) ? data.rows : [];
  } catch { return []; }
};

const save = () => {
  try {
    const rows = [...body.querySelectorAll("tr")]
      .map(tr => ({ laenge_cm: tr.dataset.L || "", umfang_cm: tr.dataset.U || "" }))
      .filter(r => r.laenge_cm !== "" || r.umfang_cm !== "");
    localStorage.setItem(KEY, JSON.stringify({ rows }));
  } catch {}
};

const setSum = () => {
  let s = 0;
  for (const tr of body.querySelectorAll("tr")) {
    const { v } = calc(tr.dataset.L, tr.dataset.U);
    if (Number.isFinite(v)) s += v;
  }
  sumCell.textContent = fmt.format(s);
};

const setOutputs = (tr) => {
  const rOut = tr.querySelector('[data-out="radius"]');
  const vOut = tr.querySelector('[data-out="volume"]');
  const has = (tr.dataset.L || tr.dataset.U);
  if (!has) { rOut.textContent = "—"; vOut.textContent = "—"; return; }
  const { r, v } = calc(tr.dataset.L, tr.dataset.U);
  rOut.textContent = Number.isFinite(r) ? fmt.format(r) : "—";
  vOut.textContent = Number.isFinite(v) ? fmt.format(v) : "—";
};

const ensureEmptyLastRow = () => {
  const trs = body.querySelectorAll("tr");
  if (!trs.length) { addRow(); return; }
  const last = trs[trs.length - 1];
  if ((last.dataset.L || "") !== "" || (last.dataset.U || "") !== "") addRow();
};

function addRow(values = { laenge_cm: "", umfang_cm: "" }) {
  const tr = document.createElement("tr");
  tr.dataset.L = values.laenge_cm ?? "";
  tr.dataset.U = values.umfang_cm ?? "";

  tr.innerHTML = `
    <td><input data-in="L" type="number" inputmode="decimal" step="any" min="0" placeholder="z.B. 500" value="${values.laenge_cm ?? ""}"></td>
    <td><input data-in="U" type="number" inputmode="decimal" step="any" min="0" placeholder="z.B. 88" value="${values.umfang_cm ?? ""}"></td>
    <td><button class="saveBtn" type="button">✓</button></td>
    <td class="out" data-out="radius">—</td>
    <td class="out" data-out="volume">—</td>
    <td><button class="iconBtn" type="button" title="Zeile löschen" aria-label="Zeile löschen"><span>×</span></button></td>
  `;

  const inpL = tr.querySelector('input[data-in="L"]');
  const inpU = tr.querySelector('input[data-in="U"]');
  const btnSave = tr.querySelector(".saveBtn");

  btnSave.addEventListener("click", () => {
    tr.dataset.L = (inpL.value || "").trim();
    tr.dataset.U = (inpU.value || "").trim();
    setOutputs(tr);
    ensureEmptyLastRow();
    setSum();
    save();
  });

  tr.querySelector(".iconBtn").addEventListener("click", () => {
    tr.remove();
    if (!body.querySelector("tr")) addRow();
    ensureEmptyLastRow();
    [...body.querySelectorAll("tr")].forEach(setOutputs);
    setSum();
    save();
  });

  body.appendChild(tr);
  setOutputs(tr);
}

clearAllBtn.addEventListener("click", () => {
  try { localStorage.removeItem(KEY); } catch {}
  body.innerHTML = "";
  addRow();
  setSum();
});

// bootstrap
const rows = load();
if (rows.length) rows.forEach(addRow);
else addRow();
ensureEmptyLastRow();
setSum();
