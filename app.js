"use strict";

const $ = (id) => document.getElementById(id);
const state = { files: [], findings: [] };
const demoFindings = [
  { area: "Front bumper", damage: "Surface scratch", severity: "Minor", confidence: 94, costMin: 250, costMax: 550 },
  { area: "Driver-side door", damage: "Small dent", severity: "Moderate", confidence: 88, costMin: 450, costMax: 900 }
];

fetch("/health").then((r) => r.json()).then((data) => {
  $("mode").textContent = data.mode === "live" ? "Live AI mode" : "Demo mode";
}).catch(() => { $("mode").textContent = "Offline"; });

function addFiles(list) {
  const valid = [...list].filter((file) => /^image\/(jpeg|png|webp)$/.test(file.type));
  state.files.push(...valid.slice(0, 8 - state.files.length));
  renderPreviews();
}

function renderPreviews() {
  $("previews").replaceChildren(...state.files.map((file, index) => {
    const box = document.createElement("div"); box.className = "preview";
    const img = document.createElement("img"); img.src = URL.createObjectURL(file); img.alt = `Selected vehicle photo ${index + 1}`;
    const remove = document.createElement("button"); remove.textContent = "Remove"; remove.type = "button";
    remove.onclick = () => { URL.revokeObjectURL(img.src); state.files.splice(index, 1); renderPreviews(); };
    box.append(img, remove); return box;
  }));
  $("photo-count").textContent = `${state.files.length} / 8`;
  $("analyze").disabled = state.files.length === 0;
}

$("photos").addEventListener("change", (event) => addFiles(event.target.files));
for (const name of ["dragenter", "dragover"]) $("drop").addEventListener(name, (e) => { e.preventDefault(); $("drop").classList.add("drag"); });
for (const name of ["dragleave", "drop"]) $("drop").addEventListener(name, (e) => { e.preventDefault(); $("drop").classList.remove("drag"); });
$("drop").addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

async function fileToData(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); });
}

$("analyze").onclick = async () => {
  $("analyze").disabled = true; $("status").textContent = "Analyzing photos…";
  try {
    const images = await Promise.all(state.files.map(async (file) => ({ mediaType: file.type, data: await fileToData(file) })));
    const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || "Analysis failed");
    state.findings = data.findings; showReport(data.mode);
  } catch (error) { $("status").textContent = error.message; }
  finally { $("analyze").disabled = state.files.length === 0; }
};

$("load-demo").onclick = () => {
  $("year").value = "2022"; $("make").value = "Honda"; $("model").value = "Accord"; $("reference").value = "DEMO-001";
  state.findings = structuredClone(demoFindings); showReport("demo");
};

function showReport(mode) {
  $("status").textContent = mode === "demo" ? "Demo findings loaded." : "Analysis complete.";
  $("report").hidden = false; renderFindings(); $("report").scrollIntoView({ behavior: "smooth" });
}

function renderFindings() {
  const totalMin = state.findings.reduce((sum, item) => sum + Number(item.costMin || 0), 0);
  const totalMax = state.findings.reduce((sum, item) => sum + Number(item.costMax || 0), 0);
  $("summary").innerHTML = `<div class="metric"><span>Findings</span><strong>${state.findings.length}</strong></div><div class="metric"><span>Estimated range</span><strong>$${totalMin.toLocaleString()}–$${totalMax.toLocaleString()}</strong></div><div class="metric"><span>Review status</span><strong>Required</strong></div>`;
  $("findings").replaceChildren(...state.findings.map((finding, index) => findingEditor(finding, index)));
}

function field(label, value, oninput, type = "text") {
  const wrap = document.createElement("label"); wrap.textContent = label; const input = document.createElement("input"); input.type = type; input.value = value; input.oninput = () => oninput(input.value); wrap.append(input); return wrap;
}

function findingEditor(item, index) {
  const row = document.createElement("div"); row.className = "finding";
  row.append(field("Area / damage", `${item.area}: ${item.damage}`, (v) => { item.area = v; item.damage = ""; }), field("Severity", item.severity, (v) => item.severity = v), field("Cost maximum ($)", item.costMax, (v) => item.costMax = Number(v), "number"));
  const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove"; remove.onclick = () => { state.findings.splice(index, 1); renderFindings(); }; row.append(remove); return row;
}

$("add").onclick = () => { state.findings.push({ area: "New finding", damage: "", severity: "Unreviewed", confidence: 0, costMin: 0, costMax: 0 }); renderFindings(); };
$("print").onclick = () => window.print();
$("download").onclick = () => {
  const report = { generatedAt: new Date().toISOString(), vehicle: { year: $("year").value, make: $("make").value, model: $("model").value, referenceId: $("reference").value }, findings: state.findings, disclaimer: "Preliminary demonstration output; human review required." };
  const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })); link.download = "vehicle-inspection-report.json"; link.click(); URL.revokeObjectURL(link.href);
};
