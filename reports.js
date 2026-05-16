// BIO 40A Lab Exam — bug reporting
// Floating "🐛 Report" button on every page. Click it, type a short
// description, and submit — opens GitHub Issues in a new tab with the page
// context (tab, station/question, selected answer, image URL) pre-filled in
// the issue body. Also keeps a localStorage log of reports for offline review.

const REPO_SLUG = "producer456/bio40a-lab-exam";
const REPORTS_KEY = "bio40a-bug-reports-v1";

function loadReportsLocal() {
    try { return JSON.parse(localStorage.getItem(REPORTS_KEY)) || []; } catch { return []; }
}
function saveReportsLocal(arr) { localStorage.setItem(REPORTS_KEY, JSON.stringify(arr)); }

// Inspect the live DOM to figure out what page the user is currently on.
function getCurrentPageContext() {
    const ctx = {
        tab: "Unknown",
        url: location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
    };

    const practiceVisible = document.getElementById("view-practice")?.style.display !== "none";
    const bankVisible = document.getElementById("view-bank")?.style.display === "block";

    if (bankVisible) {
        ctx.tab = "Question Bank";
        const img = document.getElementById("bank-image");
        if (img && img.src) ctx.image = img.getAttribute("src");
        const cap = document.getElementById("bank-caption");
        if (cap) ctx.caption = cap.textContent;
        const prompt = document.querySelector("#bank-questions .question-prompt");
        if (prompt) ctx.prompt = prompt.textContent;
        const sel = document.querySelector("#bank-questions .option.selected span:last-child");
        if (sel) ctx.selectedAnswer = sel.textContent;
        // Read the active role / mode buttons
        const role = document.querySelector(".bank-role-btn.active")?.dataset.bankRole;
        const exam = document.querySelector(".bank-exam-btn.active")?.dataset.bankExam;
        if (role) ctx.bankRole = role;
        if (exam) ctx.bankMode = exam;
        // Try to grab the bank's current session question id
        if (window.bank && window.bank.session && window.bank.session.length) {
            const q = window.bank.session[window.bank.sessionIndex];
            if (q) {
                ctx.questionId = q.questionId;
                ctx.imageId = q.imageId;
                if (q.type === "marker") {
                    ctx.featureId = q.feature?.id;
                    ctx.correctAnswer = q.feature?.label;
                } else {
                    ctx.correctAnswer = q.answerLabel;
                }
            }
        } else if (window.bank && window.bank.role === "teacher" && window.bank.teacherList?.length) {
            const it = window.bank.teacherList[window.bank.teacherIndex];
            if (it) {
                ctx.teacherFeature = it.feature?.label;
                ctx.imageId = it.imageId;
            }
        }
    } else if (practiceVisible) {
        ctx.tab = "Practice Exam";
        const img = document.getElementById("station-image");
        if (img && img.src) ctx.image = img.getAttribute("src");
        const cap = document.getElementById("image-caption");
        if (cap) ctx.caption = cap.textContent;
        const prompts = Array.from(document.querySelectorAll("#questions .question-prompt"))
            .map(p => p.textContent).filter(Boolean);
        if (prompts.length) ctx.prompts = prompts;
        const selected = Array.from(document.querySelectorAll("#questions .option.selected span:last-child"))
            .map(s => s.textContent).filter(Boolean);
        if (selected.length) ctx.selectedAnswers = selected;
        const role = document.querySelector(".mode-btn.active")?.dataset.role;
        const exam = document.querySelector(".exam-btn.active")?.dataset.exam;
        if (role) ctx.role = role;
        if (exam) ctx.examMode = exam;
    }

    return ctx;
}

function formatIssueBody(description, context) {
    const lines = [];
    lines.push(description.trim());
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("**Context (auto-attached):**");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(context, null, 2));
    lines.push("```");
    return lines.join("\n");
}

function openGithubIssue(title, body) {
    const params = new URLSearchParams({
        title,
        body,
        labels: "bug,user-report",
    });
    const url = `https://github.com/${REPO_SLUG}/issues/new?${params.toString()}`;
    window.open(url, "_blank");
}

function showReportModal() {
    const ctx = getCurrentPageContext();
    document.getElementById("report-context").textContent = JSON.stringify(ctx, null, 2);
    document.getElementById("report-description").value = "";
    document.getElementById("report-title").value = `Bug on ${ctx.tab}${ctx.questionId ? ` (${ctx.questionId})` : ""}`;
    document.getElementById("report-modal").style.display = "flex";
    setTimeout(() => document.getElementById("report-description").focus(), 50);
    // Stash context for the submit handler
    window._reportCtx = ctx;
}

function hideReportModal() {
    document.getElementById("report-modal").style.display = "none";
}

function submitReport() {
    const desc = document.getElementById("report-description").value.trim();
    const title = document.getElementById("report-title").value.trim() || "Bug report";
    if (!desc) {
        alert("Please describe the bug first.");
        return;
    }
    const ctx = window._reportCtx || getCurrentPageContext();
    const body = formatIssueBody(desc, ctx);

    // Save local copy for offline reference
    const all = loadReportsLocal();
    all.push({ title, description: desc, context: ctx, submitted: true });
    saveReportsLocal(all);

    openGithubIssue(title, body);
    hideReportModal();
    updateReportCount();
    showToastReport("Opened GitHub Issue draft in new tab — click 'Submit' there to file it.");
}

function saveLocalOnly() {
    const desc = document.getElementById("report-description").value.trim();
    const title = document.getElementById("report-title").value.trim() || "Bug report";
    if (!desc) { alert("Please describe the bug first."); return; }
    const ctx = window._reportCtx || getCurrentPageContext();
    const all = loadReportsLocal();
    all.push({ title, description: desc, context: ctx, submitted: false });
    saveReportsLocal(all);
    hideReportModal();
    updateReportCount();
    showToastReport("Saved locally — open Reports panel to file later.");
}

function showReportsList() {
    const list = document.getElementById("reports-list");
    const all = loadReportsLocal();
    if (!all.length) {
        list.innerHTML = `<div style="color:var(--muted);padding:12px">No reports saved locally yet.</div>`;
    } else {
        list.innerHTML = all.map((r, i) => {
            const when = r.context?.timestamp ? new Date(r.context.timestamp).toLocaleString() : "";
            const ctxBits = [];
            if (r.context?.tab) ctxBits.push(r.context.tab);
            if (r.context?.questionId) ctxBits.push(r.context.questionId);
            if (r.context?.imageId) ctxBits.push(r.context.imageId);
            return `
                <div class="report-item">
                    <div class="report-item-head">
                        <div>
                            <div class="report-item-title">${escapeHtml(r.title)}</div>
                            <div class="report-item-meta">${when} · ${ctxBits.join(" · ")} ${r.submitted ? '· <span style="color:var(--good)">filed</span>' : '· <span style="color:var(--warn)">local only</span>'}</div>
                        </div>
                        <div class="report-item-actions">
                            <button class="action-btn" data-idx="${i}" data-act="refile">Re-file on GitHub</button>
                            <button class="action-btn" data-idx="${i}" data-act="delete">Delete</button>
                        </div>
                    </div>
                    <div class="report-item-desc">${escapeHtml(r.description)}</div>
                </div>
            `;
        }).join("");
        list.querySelectorAll("[data-act]").forEach(btn => {
            btn.addEventListener("click", () => {
                const i = parseInt(btn.dataset.idx, 10);
                const r = loadReportsLocal()[i];
                if (!r) return;
                if (btn.dataset.act === "delete") {
                    if (!confirm("Delete this report from your local log?")) return;
                    const arr = loadReportsLocal();
                    arr.splice(i, 1);
                    saveReportsLocal(arr);
                    showReportsList();
                    updateReportCount();
                } else if (btn.dataset.act === "refile") {
                    openGithubIssue(r.title, formatIssueBody(r.description, r.context));
                }
            });
        });
    }
    document.getElementById("reports-modal").style.display = "flex";
}

function hideReportsList() {
    document.getElementById("reports-modal").style.display = "none";
}

function exportReports() {
    const blob = new Blob([JSON.stringify(loadReportsLocal(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bio40a-bug-reports.json";
    a.click();
    URL.revokeObjectURL(url);
}

function clearAllReports() {
    if (!confirm("Delete ALL local reports? (GitHub issues you've already filed are not affected.)")) return;
    saveReportsLocal([]);
    showReportsList();
    updateReportCount();
}

function updateReportCount() {
    const n = loadReportsLocal().length;
    const el = document.getElementById("reports-count");
    if (el) el.textContent = n ? `Reports (${n})` : "Reports";
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

function showToastReport(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(showToastReport._t);
    showToastReport._t = setTimeout(() => t.classList.remove("show"), 2600);
}

function initReports() {
    document.getElementById("report-fab")?.addEventListener("click", showReportModal);
    document.getElementById("reports-count")?.addEventListener("click", showReportsList);
    document.getElementById("report-cancel")?.addEventListener("click", hideReportModal);
    document.getElementById("report-save-local")?.addEventListener("click", saveLocalOnly);
    document.getElementById("report-submit")?.addEventListener("click", submitReport);
    document.getElementById("reports-close")?.addEventListener("click", hideReportsList);
    document.getElementById("reports-export")?.addEventListener("click", exportReports);
    document.getElementById("reports-clear")?.addEventListener("click", clearAllReports);
    // Click backdrop closes
    document.getElementById("report-modal")?.addEventListener("click", (e) => {
        if (e.target.id === "report-modal") hideReportModal();
    });
    document.getElementById("reports-modal")?.addEventListener("click", (e) => {
        if (e.target.id === "reports-modal") hideReportsList();
    });
    updateReportCount();
}

document.addEventListener("DOMContentLoaded", initReports);
