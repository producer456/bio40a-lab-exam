// BIO 40A Lab Exam Simulator
// Roles: teacher (sets answer key) / student (takes the quiz)
// Student modes: practice (instant feedback) / exam (timed, score at end)

const STORAGE_KEY_ANSWERS = "bio40a-labexam-answer-key-v1";
const STORAGE_KEY_STUDENT = "bio40a-labexam-student-responses-v1";

const state = {
    role: "teacher",
    examMode: "practice",
    stationIndex: 0,
    answerKey: {},
    studentResponses: {},
    submitted: false,
    timerStart: null,
    timerInterval: null,
};

function $(id) { return document.getElementById(id); }

function loadKey() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_ANSWERS);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveKey() {
    localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(state.answerKey));
}

function loadStudent() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_STUDENT);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveStudent() {
    localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(state.studentResponses));
}

function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove("show"), 1800);
}

function totalQuestions() {
    return STATIONS.reduce((n, s) => n + s.questions.length, 0);
}

function keyedCount() {
    return Object.keys(state.answerKey).length;
}

function answeredCount() {
    return Object.keys(state.studentResponses).length;
}

function renderTabs() {
    const tabs = $("station-tabs");
    tabs.innerHTML = "";
    STATIONS.forEach((s, i) => {
        const tab = document.createElement("button");
        tab.className = "station-tab";
        if (i === state.stationIndex) tab.classList.add("active");
        const allKeyed = s.questions.every(q => state.answerKey[q.id] !== undefined);
        const allAnswered = s.questions.every(q => state.studentResponses[q.id] !== undefined);
        if (state.role === "teacher" && allKeyed) tab.classList.add("set-by-teacher");
        if (state.role === "student" && allAnswered) tab.classList.add("answered");
        tab.textContent = `S${s.id}`;
        tab.title = s.title;
        tab.addEventListener("click", () => {
            state.stationIndex = i;
            render();
        });
        tabs.appendChild(tab);
    });
}

function renderStation() {
    const station = STATIONS[state.stationIndex];
    $("station-image").src = station.image;
    $("station-image").alt = station.title;
    $("image-caption").textContent = `${station.title} — ${station.caption}`;

    const qContainer = $("questions");
    qContainer.innerHTML = "";

    station.questions.forEach((q) => {
        const qDiv = document.createElement("div");
        qDiv.className = "question";

        const prompt = document.createElement("div");
        prompt.className = "question-prompt";
        prompt.textContent = q.prompt;
        qDiv.appendChild(prompt);

        const opts = document.createElement("div");
        opts.className = "options";

        const teacherKey = state.answerKey[q.id];
        const studentAns = state.studentResponses[q.id];

        q.options.forEach((opt, idx) => {
            const btn = document.createElement("button");
            btn.className = "option";
            const letter = String.fromCharCode(97 + idx); // a, b, c...
            btn.innerHTML = `<span class="letter">${letter}</span><span>${opt}</span>`;

            if (state.role === "teacher") {
                if (teacherKey === idx) btn.classList.add("teacher-key");
                btn.addEventListener("click", () => {
                    state.answerKey[q.id] = idx;
                    saveKey();
                    toast(`Saved: ${opt}`);
                    render();
                });
            } else {
                // student
                if (studentAns === idx) btn.classList.add("selected");

                const reveal = state.examMode === "practice" && studentAns !== undefined
                    || (state.examMode === "exam" && state.submitted);

                if (reveal && teacherKey !== undefined) {
                    if (idx === teacherKey) btn.classList.add("correct");
                    else if (idx === studentAns) btn.classList.add("incorrect");
                }

                btn.addEventListener("click", () => {
                    if (state.examMode === "practice" && studentAns !== undefined) return;
                    if (state.examMode === "exam" && state.submitted) return;
                    state.studentResponses[q.id] = idx;
                    saveStudent();
                    render();
                });
            }

            opts.appendChild(btn);
        });

        qDiv.appendChild(opts);

        // Feedback row (practice mode only, after answer)
        if (state.role === "student" && state.examMode === "practice" && studentAns !== undefined) {
            const fb = document.createElement("div");
            if (teacherKey === undefined) {
                fb.className = "feedback warn";
                fb.textContent = "⚠ No answer key set for this question — switch to Teacher Mode to set one.";
            } else if (studentAns === teacherKey) {
                fb.className = "feedback good";
                fb.textContent = "✓ Correct!";
            } else {
                fb.className = "feedback bad";
                fb.textContent = `✗ Correct answer: ${q.options[teacherKey]}`;
            }
            qDiv.appendChild(fb);
        }

        qContainer.appendChild(qDiv);
    });
}

function renderProgress() {
    const total = totalQuestions();
    let count, label;
    if (state.role === "teacher") {
        count = keyedCount();
        label = `Answer key set: ${count} / ${total}`;
    } else {
        count = answeredCount();
        label = `Answered: ${count} / ${total}`;
    }
    const pct = total ? Math.round((count / total) * 100) : 0;
    $("progress").innerHTML = `
        <div>${label}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div style="margin-top:6px">Station ${state.stationIndex + 1} of ${STATIONS.length}</div>
    `;
}

function renderControls() {
    // role toggle
    document.querySelectorAll(".mode-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.role === state.role);
    });
    // exam-mode toggle only visible for student
    $("exam-toggle").style.display = state.role === "student" ? "inline-flex" : "none";
    document.querySelectorAll(".exam-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.exam === state.examMode);
    });

    // Submit button only shown in exam mode (student, not yet submitted)
    const showSubmit = state.role === "student" && state.examMode === "exam" && !state.submitted;
    $("btn-submit-exam").style.display = showSubmit ? "block" : "none";

    // Timer only in exam mode
    const showTimer = state.role === "student" && state.examMode === "exam" && !state.submitted;
    $("timer").style.display = showTimer ? "block" : "none";

    // Reset button label
    $("btn-reset-student").textContent = state.role === "teacher" ? "Reset Answer Key" : "Reset My Answers";

    // Key status
    const keyed = keyedCount();
    const total = totalQuestions();
    let status = "";
    if (state.role === "student" && keyed < total) {
        status = `⚠ Only ${keyed}/${total} answers set in the key. Switch to Teacher Mode to finish setting them.`;
    } else if (state.role === "teacher") {
        status = keyed === total
            ? "✓ Answer key is complete."
            : `${keyed}/${total} answers set in the key.`;
    }
    $("key-status").textContent = status;

    // Prev/Next
    $("btn-prev").disabled = state.stationIndex === 0;
    $("btn-next").disabled = state.stationIndex === STATIONS.length - 1;
}

function render() {
    renderTabs();
    renderStation();
    renderProgress();
    renderControls();
    renderResults();
}

function renderResults() {
    const r = $("results");
    if (state.role !== "student" || state.examMode !== "exam" || !state.submitted) {
        r.style.display = "none";
        return;
    }
    let correct = 0, incorrect = 0, blank = 0, noKey = 0;
    const items = [];
    STATIONS.forEach(s => {
        s.questions.forEach(q => {
            const ans = state.studentResponses[q.id];
            const key = state.answerKey[q.id];
            let status, klass, detail;
            if (key === undefined) {
                status = "no-key"; klass = "unknown";
                detail = `<span class="q-detail">(no answer key set — switch to Teacher Mode to set one)</span>`;
                noKey++;
            } else if (ans === undefined) {
                status = "blank"; klass = "bad";
                detail = `<span class="your-answer">Blank.</span> <span class="correct-answer">Correct: ${q.options[key]}</span>`;
                blank++;
            } else if (ans === key) {
                status = "correct"; klass = "";
                detail = `<span class="your-answer">✓ ${q.options[ans]}</span>`;
                correct++;
            } else {
                status = "wrong"; klass = "bad";
                detail = `<span class="your-answer">Your answer: ${q.options[ans]}</span> · <span class="correct-answer">Correct: ${q.options[key]}</span>`;
                incorrect++;
            }
            items.push(`
                <div class="review-item ${klass}">
                    <div class="q-prompt">${s.title} — ${q.prompt}</div>
                    <div>${detail}</div>
                </div>
            `);
        });
    });
    const total = totalQuestions();
    const graded = total - noKey;
    const pct = graded ? Math.round((correct / graded) * 100) : 0;

    r.innerHTML = `
        <h2>Exam Results</h2>
        <div class="score-summary">
            <div class="score-big">${pct}%</div>
            <div class="score-detail">
                ${correct} correct · ${incorrect} wrong · ${blank} blank
                ${noKey ? ` · ${noKey} ungraded (no key)` : ""}
            </div>
        </div>
        <div class="review-list">${items.join("")}</div>
        <div style="margin-top:16px;">
            <button class="action-btn" id="btn-retake">Retake Exam</button>
        </div>
    `;
    r.style.display = "block";
    $("btn-retake").addEventListener("click", () => {
        if (!confirm("Clear your answers and retake the exam?")) return;
        state.studentResponses = {};
        saveStudent();
        state.submitted = false;
        state.stationIndex = 0;
        startTimer();
        render();
    });
}

function startTimer() {
    stopTimer();
    state.timerStart = Date.now();
    tickTimer();
    state.timerInterval = setInterval(tickTimer, 1000);
}

function stopTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = null;
}

function tickTimer() {
    if (!state.timerStart) return;
    const elapsed = Math.floor((Date.now() - state.timerStart) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    $("timer-value").textContent = `${m}:${String(s).padStart(2, "0")}`;
}

function setRole(role) {
    state.role = role;
    if (role === "student") {
        // restart timer when entering exam mode
        if (state.examMode === "exam" && !state.submitted) startTimer();
        else stopTimer();
    } else {
        stopTimer();
    }
    render();
}

function setExamMode(mode) {
    state.examMode = mode;
    state.submitted = false;
    if (mode === "exam") startTimer();
    else stopTimer();
    render();
}

function submitExam() {
    if (!confirm("Submit your exam? You won't be able to change answers.")) return;
    state.submitted = true;
    stopTimer();
    render();
    $("results").scrollIntoView({ behavior: "smooth" });
}

function resetCurrentRole() {
    if (state.role === "teacher") {
        if (!confirm("Clear the entire answer key?")) return;
        state.answerKey = {};
        saveKey();
    } else {
        if (!confirm("Clear your answers?")) return;
        state.studentResponses = {};
        saveStudent();
        state.submitted = false;
        if (state.examMode === "exam") startTimer();
    }
    render();
}

function exportKey() {
    const blob = new Blob([JSON.stringify(state.answerKey, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bio40a-lab-exam-key.json";
    a.click();
    URL.revokeObjectURL(url);
}

function importKey(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            state.answerKey = data;
            saveKey();
            toast("Answer key imported");
            render();
        } catch {
            toast("Invalid file");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}

function wireEvents() {
    document.querySelectorAll(".mode-btn").forEach(b => {
        b.addEventListener("click", () => setRole(b.dataset.role));
    });
    document.querySelectorAll(".exam-btn").forEach(b => {
        b.addEventListener("click", () => setExamMode(b.dataset.exam));
    });
    $("btn-prev").addEventListener("click", () => {
        if (state.stationIndex > 0) { state.stationIndex--; render(); }
    });
    $("btn-next").addEventListener("click", () => {
        if (state.stationIndex < STATIONS.length - 1) { state.stationIndex++; render(); }
    });
    $("btn-submit-exam").addEventListener("click", submitExam);
    $("btn-reset-student").addEventListener("click", resetCurrentRole);
    $("btn-export").addEventListener("click", exportKey);
    $("btn-import").addEventListener("click", () => $("import-file").click());
    $("import-file").addEventListener("change", importKey);
}

function init() {
    state.answerKey = loadKey();
    state.studentResponses = loadStudent();
    wireEvents();
    render();
}

document.addEventListener("DOMContentLoaded", init);
