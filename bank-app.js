// BIO 40A — Question Bank tab logic
// - Student Mode: random session from filtered pool; arrow points at feature;
//   MC question with distractors from same image (or same tissue category).
// - Teacher Mode: shows feature label up front; tap the image to set the
//   marker's correct (x,y). Drag persists in localStorage and is exportable.

const BANK_STORAGE_COORDS = "bio40a-bank-coords-v1";
const BANK_STORAGE_RESPONSES = "bio40a-bank-responses-v1";

const bank = {
    role: "student",
    examMode: "practice",
    filter: "all",
    sessionLength: 25,
    session: [],           // current quiz array of pool entries
    sessionIndex: 0,
    responses: {},         // questionId -> chosen index (or label for tissue)
    submitted: false,
    coordOverrides: {},    // "imageId.featureId" -> {x, y}
    teacherIndex: 0,       // index into a flat list of all features when in Teacher Mode
    teacherList: [],
};

function $b(id) { return document.getElementById(id); }

function bankLoadCoords() {
    try { return JSON.parse(localStorage.getItem(BANK_STORAGE_COORDS)) || {}; } catch { return {}; }
}
function bankSaveCoords() { localStorage.setItem(BANK_STORAGE_COORDS, JSON.stringify(bank.coordOverrides)); }
function bankLoadResponses() {
    try { return JSON.parse(localStorage.getItem(BANK_STORAGE_RESPONSES)) || {}; } catch { return {}; }
}
function bankSaveResponses() { localStorage.setItem(BANK_STORAGE_RESPONSES, JSON.stringify(bank.responses)); }

function getCoord(imageId, featureId, defaultXY) {
    const o = bank.coordOverrides[`${imageId}.${featureId}`];
    return o ? { x: o.x, y: o.y } : { x: defaultXY.x, y: defaultXY.y };
}

function setCoord(imageId, featureId, x, y) {
    bank.coordOverrides[`${imageId}.${featureId}`] = { x, y };
    bankSaveCoords();
}

// ---------- filtering ----------
function poolForFilter(filter) {
    if (filter === "all") return QUESTION_POOL.slice();
    if (filter === "tissues") return QUESTION_POOL.filter(q => q.type === "identify");
    if (filter === "station_photos") return QUESTION_POOL.filter(q => q.type === "marker" && q.image && q.image.startsWith("images/station-"));
    if (filter === "models") return QUESTION_POOL.filter(q => q.type === "marker" && MODEL_BANK.some(m => m.id === q.imageId));
    if (filter === "bones") return QUESTION_POOL.filter(q => q.type === "marker" && BONE_BANK.some(b => b.id === q.imageId));
    if (filter === "skull") return QUESTION_POOL.filter(q => q.type === "marker" && /skull|face_orbit|disarticulated_cranial/.test(q.imageId));
    if (filter === "vertebrae") return QUESTION_POOL.filter(q => q.type === "marker" && /vertebra|cervical|lumbar|thoracic|sacrum/.test(q.imageId));
    if (filter === "upper") return QUESTION_POOL.filter(q => q.type === "marker" && /humerus|scapula|radius|ulna|hand|pectoral/.test(q.imageId));
    if (filter === "lower") return QUESTION_POOL.filter(q => q.type === "marker" && /femur|tibia|fibula|foot|pelvis|os_coxae/.test(q.imageId));
    return QUESTION_POOL.slice();
}

function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function startSession() {
    const pool = poolForFilter(bank.filter);
    const shuffled = shuffle(pool);
    const n = bank.sessionLength === "all" ? shuffled.length : Math.min(parseInt(bank.sessionLength, 10), shuffled.length);
    bank.session = shuffled.slice(0, n);
    bank.sessionIndex = 0;
    bank.responses = {};
    bankSaveResponses();
    bank.submitted = false;
    bankRender();
}

// ---------- distractors ----------
function pickDistractors(question) {
    if (question.type === "marker") {
        const others = question.allFeatures.filter(f => f.id !== question.feature.id);
        return shuffle(others).slice(0, 4).map(f => f.label);
    }
    // tissue: pick 4 from same category if possible, else from full pool
    const sameCat = question.allTissues.filter(t => t.label !== question.answerLabel && t.category === question.category);
    const others = question.allTissues.filter(t => t.label !== question.answerLabel && t.category !== question.category);
    const picks = shuffle(sameCat).slice(0, 3).concat(shuffle(others).slice(0, 2));
    return shuffle(picks).slice(0, 4).map(t => t.label);
}

// ---------- option order memoization per session ----------
function getOptionsForQuestion(question) {
    if (!bank._options) bank._options = {};
    if (bank._options[question.questionId]) return bank._options[question.questionId];
    const correct = question.type === "marker" ? question.feature.label : question.answerLabel;
    const distractors = pickDistractors(question);
    const opts = shuffle([correct, ...distractors]);
    bank._options[question.questionId] = opts;
    return opts;
}

// ---------- rendering ----------
function renderBankOverlay(question) {
    const svg = $b("bank-overlay");
    svg.innerHTML = "";
    if (question.type !== "marker") return;
    const c = getCoord(question.imageId, question.feature.id, question.feature);
    // Set viewBox so the arrow scales with image dimensions
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    // Arrow: shaft from (cx-12, cy-12) to (cx-2, cy-2)
    const cx = c.x * 100;
    const cy = c.y * 100;
    // tail offset to upper-left for visibility
    const tx = Math.max(2, cx - 14);
    const ty = Math.max(2, cy - 14);
    svg.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#ff3b30" />
            </marker>
        </defs>
        <line x1="${tx}" y1="${ty}" x2="${cx - 1.5}" y2="${cy - 1.5}" stroke="#ff3b30" stroke-width="0.6" marker-end="url(#arrowhead)" />
        <circle cx="${cx}" cy="${cy}" r="1.5" fill="#ff3b30" stroke="#fff" stroke-width="0.4" />
    `;
}

function renderBank() {
    bankRender();
}

function bankRender() {
    // Show/hide elements per role
    document.querySelectorAll(".bank-role-btn").forEach(b => b.classList.toggle("active", b.dataset.bankRole === bank.role));
    document.querySelectorAll(".bank-exam-btn").forEach(b => b.classList.toggle("active", b.dataset.bankExam === bank.examMode));

    $b("bank-quiz-mode-wrap").style.display = bank.role === "student" ? "inline-flex" : "none";
    $b("bank-filters").style.display = bank.role === "student" ? "flex" : "none";
    $b("bank-submit").style.display = (bank.role === "student" && bank.examMode === "exam" && bank.session.length && !bank.submitted) ? "block" : "none";

    if (bank.role === "teacher") {
        renderTeacherView();
    } else {
        renderStudentView();
    }
}

// ---------- TEACHER MODE: place markers ----------
function renderTeacherView() {
    // Build a flat list of every marker feature once
    if (!bank.teacherList.length) {
        const list = [];
        [BONE_BANK, MODEL_BANK, STATION_REUSE_BANK].forEach(b => b.forEach(item => {
            item.features.forEach(f => list.push({ imageId: item.id, image: item.image, title: item.title, feature: f }));
        }));
        bank.teacherList = list;
    }
    const total = bank.teacherList.length;
    const item = bank.teacherList[bank.teacherIndex];
    $b("bank-image").src = item.image;
    $b("bank-image").alt = item.title;
    $b("bank-caption").textContent = `${item.title} — drag/tap to place: "${item.feature.label}"`;

    // Draw the current marker
    renderBankOverlay({
        type: "marker", imageId: item.imageId, feature: item.feature, allFeatures: [item.feature]
    });

    // Click handler on the image-wrap to set coords
    const wrap = $b("bank-image-wrap");
    wrap.onclick = (e) => {
        const rect = $b("bank-image").getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        setCoord(item.imageId, item.feature.id, x, y);
        bankRender();
    };

    // Render simple instruction + nav
    $b("bank-questions").innerHTML = `
        <div class="question">
            <div class="question-prompt">Place marker: <span style="color:var(--teacher)">${item.feature.label}</span></div>
            <div style="color:var(--muted);font-size:13px;margin-bottom:6px">
                ${item.title}<br>
                Tap on the image where this feature actually is. Saved to your browser.
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="option" onclick="bank.teacherIndex=Math.max(0,bank.teacherIndex-1);bankRender();">◀ Previous feature</button>
                <button class="option" onclick="bank.teacherIndex=Math.min(${total - 1},bank.teacherIndex+1);bankRender();">Next feature ▶</button>
                <button class="option" onclick="bankJumpToNextUnplaced();">Skip to next unplaced</button>
            </div>
        </div>
    `;

    const placed = Object.keys(bank.coordOverrides).length;
    $b("bank-progress").innerHTML = `
        <div>Feature ${bank.teacherIndex + 1} / ${total}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(((bank.teacherIndex+1)/total)*100)}%"></div></div>
        <div style="margin-top:6px">Custom-placed: ${placed}</div>
    `;
    $b("bank-status").textContent = "Teacher Mode: tap on image to place the current feature's marker.";
}

function bankJumpToNextUnplaced() {
    for (let i = bank.teacherIndex + 1; i < bank.teacherList.length; i++) {
        const it = bank.teacherList[i];
        if (!bank.coordOverrides[`${it.imageId}.${it.feature.id}`]) {
            bank.teacherIndex = i;
            bankRender();
            return;
        }
    }
    bankToast("All remaining features use default coords.");
}

// ---------- STUDENT MODE: take the quiz ----------
function renderStudentView() {
    if (!bank.session.length) {
        $b("bank-image").src = "";
        $b("bank-overlay").innerHTML = "";
        $b("bank-caption").textContent = "Pick a filter and session length above, then Start New Session.";
        $b("bank-questions").innerHTML = `<div class="question"><div class="question-prompt">No session yet. Click "Start New Session" to begin.</div></div>`;
        $b("bank-progress").innerHTML = "";
        $b("bank-status").textContent = "";
        $b("bank-results").style.display = "none";
        return;
    }

    const q = bank.session[bank.sessionIndex];
    $b("bank-image").src = q.image;
    $b("bank-image").alt = q.title;
    $b("bank-caption").textContent = q.title;

    // Disable teacher click placement
    $b("bank-image-wrap").onclick = null;

    renderBankOverlay(q);

    const opts = getOptionsForQuestion(q);
    const answer = bank.responses[q.questionId];
    const correctLabel = q.type === "marker" ? q.feature.label : q.answerLabel;
    const reveal = (bank.examMode === "practice" && answer !== undefined) || (bank.examMode === "exam" && bank.submitted);

    let prompt;
    if (q.type === "marker") {
        prompt = "What structure is the arrow pointing to?";
    } else {
        prompt = "What tissue is shown in this slide?";
    }

    const optsHtml = opts.map((label, idx) => {
        const letter = String.fromCharCode(97 + idx);
        let cls = "option";
        if (answer === label) cls += " selected";
        if (reveal) {
            if (label === correctLabel) cls += " correct";
            else if (label === answer) cls += " incorrect";
        }
        return `<button class="${cls}" data-label="${label.replace(/"/g, '&quot;')}"><span class="letter">${letter}</span><span>${label}</span></button>`;
    }).join("");

    let feedback = "";
    if (bank.examMode === "practice" && answer !== undefined) {
        if (answer === correctLabel) feedback = `<div class="feedback good">✓ Correct!</div>`;
        else feedback = `<div class="feedback bad">✗ Correct: ${correctLabel}</div>`;
    }

    $b("bank-questions").innerHTML = `
        <div class="question">
            <div class="question-prompt">${prompt}</div>
            <div class="options">${optsHtml}</div>
            ${feedback}
        </div>
    `;

    $b("bank-questions").querySelectorAll(".option").forEach(btn => {
        btn.addEventListener("click", () => {
            if (bank.examMode === "practice" && bank.responses[q.questionId] !== undefined) return;
            if (bank.examMode === "exam" && bank.submitted) return;
            bank.responses[q.questionId] = btn.dataset.label;
            bankSaveResponses();
            bankRender();
        });
    });

    const total = bank.session.length;
    const answered = bank.session.filter(qq => bank.responses[qq.questionId] !== undefined).length;
    $b("bank-progress").innerHTML = `
        <div>Question ${bank.sessionIndex + 1} / ${total}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(((bank.sessionIndex+1)/total)*100)}%"></div></div>
        <div style="margin-top:6px">Answered: ${answered} / ${total}</div>
    `;
    $b("bank-status").textContent = bank.examMode === "exam"
        ? (bank.submitted ? "Exam submitted. Review your answers below." : "Exam in progress — answers won't show until submit.")
        : "Practice mode — instant feedback after each answer.";

    renderBankResults();
}

function renderBankResults() {
    const r = $b("bank-results");
    if (!(bank.examMode === "exam" && bank.submitted)) {
        r.style.display = "none";
        return;
    }
    let correct = 0, incorrect = 0, blank = 0;
    const items = bank.session.map(q => {
        const ans = bank.responses[q.questionId];
        const cl = q.type === "marker" ? q.feature.label : q.answerLabel;
        let klass = "", body;
        if (ans === undefined) { klass = "bad"; blank++; body = `<span class="your-answer">Blank.</span> <span class="correct-answer">Correct: ${cl}</span>`; }
        else if (ans === cl) { correct++; body = `<span class="your-answer">✓ ${ans}</span>`; }
        else { klass = "bad"; incorrect++; body = `<span class="your-answer">Your: ${ans}</span> · <span class="correct-answer">Correct: ${cl}</span>`; }
        return `<div class="review-item ${klass}">
            <div class="q-prompt">${q.title}</div>
            <div>${body}</div>
        </div>`;
    }).join("");
    const total = bank.session.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    r.innerHTML = `
        <h2>Session Results</h2>
        <div class="score-summary">
            <div class="score-big">${pct}%</div>
            <div class="score-detail">${correct} correct · ${incorrect} wrong · ${blank} blank · (${total} total)</div>
        </div>
        <div class="review-list">${items}</div>
        <div style="margin-top:16px;">
            <button class="action-btn" onclick="startSession();">New Session</button>
        </div>
    `;
    r.style.display = "block";
}

function bankSubmit() {
    if (!confirm("Submit this exam session?")) return;
    bank.submitted = true;
    bankRender();
    $b("bank-results").scrollIntoView({ behavior: "smooth" });
}

function bankExportCoords() {
    const blob = new Blob([JSON.stringify(bank.coordOverrides, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bio40a-bank-coords.json";
    a.click();
    URL.revokeObjectURL(url);
}

function bankImportCoords(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            bank.coordOverrides = JSON.parse(ev.target.result);
            bankSaveCoords();
            bankToast("Coords imported");
            bankRender();
        } catch { bankToast("Invalid file"); }
    };
    reader.readAsText(f);
    e.target.value = "";
}

function bankResetCoords() {
    if (!confirm("Reset all custom marker positions back to defaults?")) return;
    bank.coordOverrides = {};
    bankSaveCoords();
    bankRender();
}

function bankToast(msg) {
    const t = $b("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(bankToast._timer);
    bankToast._timer = setTimeout(() => t.classList.remove("show"), 1800);
}

function bankWire() {
    document.querySelectorAll(".bank-role-btn").forEach(b => b.addEventListener("click", () => {
        bank.role = b.dataset.bankRole;
        bankRender();
    }));
    document.querySelectorAll(".bank-exam-btn").forEach(b => b.addEventListener("click", () => {
        bank.examMode = b.dataset.bankExam;
        bank.submitted = false;
        bankRender();
    }));
    $b("bank-filter-select").addEventListener("change", (e) => bank.filter = e.target.value);
    $b("bank-session-length").addEventListener("change", (e) => bank.sessionLength = e.target.value);
    $b("btn-start-bank").addEventListener("click", () => { bank._options = {}; startSession(); });
    $b("bank-prev").addEventListener("click", () => {
        if (bank.role === "teacher") { bank.teacherIndex = Math.max(0, bank.teacherIndex - 1); }
        else { bank.sessionIndex = Math.max(0, bank.sessionIndex - 1); }
        bankRender();
    });
    $b("bank-next").addEventListener("click", () => {
        if (bank.role === "teacher") { bank.teacherIndex = Math.min(bank.teacherList.length - 1, bank.teacherIndex + 1); }
        else { bank.sessionIndex = Math.min(bank.session.length - 1, bank.sessionIndex + 1); }
        bankRender();
    });
    $b("bank-submit").addEventListener("click", bankSubmit);
    $b("bank-export-coords").addEventListener("click", bankExportCoords);
    $b("bank-import-coords").addEventListener("click", () => $b("bank-import-file").click());
    $b("bank-import-file").addEventListener("change", bankImportCoords);
    $b("bank-reset-coords").addEventListener("click", bankResetCoords);
}

window.bankInit = function () {
    bank.coordOverrides = bankLoadCoords();
    bank.responses = bankLoadResponses();
    bankWire();
    bankRender();
};

// Expose for inline onclick handlers (renderTeacherView, renderBankResults)
window.bank = bank;
window.bankRender = bankRender;
window.bankJumpToNextUnplaced = bankJumpToNextUnplaced;
window.startSession = startSession;
