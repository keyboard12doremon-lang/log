/*******************************************************
 * DAV INTERNATIONAL SCHOOL
 * Teacher Daily Log Management System
 * teacher.js
 *******************************************************/

/*******************************************************
 * Teacher Context
 *******************************************************/
function getTeacherContext() {
    return {
        teacherName: sessionStorage.getItem("teacherName") || ""
    };
}

/*******************************************************
 * Global State
 *******************************************************/
const teacherContext = getTeacherContext();

const state = {

    teacherName: teacherContext.teacherName,

    className: "",

    day: "",

    date: "",

    isClassTeacher: false,

    diary: [],

    classLog: null,

    teachers: []

};

/*******************************************************
 * DOM Elements
 *******************************************************/

// Header

const teacherNameEl = document.getElementById("teacherName");
const teacherDayEl = document.getElementById("teacherDay");
const teacherDateEl = document.getElementById("teacherDate");

// Teacher Diary

const diaryTableBody = document.querySelector("#teacherDiaryTable tbody");

const dailyPreview = document.getElementById("dailyPreview");

const openPreviewBtn = document.getElementById("openPreviewBtn");

const downloadClassLogBtn =
document.getElementById("downloadClassLogBtn");

// Teacher Preview Modal

const printModal =
document.getElementById("printModal");

const printPreviewContent =
document.getElementById("printPreviewContent");

const closePrintModalBtn =
document.getElementById("closePrintModalBtn");

const modalCloseBtn =
document.getElementById("modalCloseBtn");

const modalPrintBtn =
document.getElementById("modalPrintBtn");

const modalPdfBtn =
document.getElementById("modalPdfBtn");

const modalJpgBtn =
document.getElementById("modalJpgBtn");

// New Class Log Modal

const classLogModal =
document.getElementById("classLogModal");

const classLogTableBody =
document.querySelector("#classLogTable tbody");

const classLogClass =
document.getElementById("classLogClass");

const classLogDay =
document.getElementById("classLogDay");

const classLogDate =
document.getElementById("classLogDate");

const classTeacherName =
document.getElementById("classTeacherName");

const classLogExportContent =
document.getElementById("classLogExportContent");

const saveClassLogBtn =
document.getElementById("saveClassLogBtn");

const printClassLogBtn =
document.getElementById("printClassLogBtn");

const pdfClassLogBtn =
document.getElementById("pdfClassLogBtn");

const jpgClassLogBtn =
document.getElementById("jpgClassLogBtn");

const closeClassLogBtn =
document.getElementById("closeClassLogBtn");

const closeClassLogFooterBtn =
document.getElementById("closeClassLogFooterBtn");

// Alert

const alertModal =
document.getElementById("alertModal");

const alertTitle =
document.getElementById("alertTitle");

const alertBody =
document.getElementById("alertBody");

const closeAlertBtn =
document.getElementById("closeAlertBtn");

const alertCloseBtn =
document.getElementById("alertCloseBtn");

// Loading

const loadingOverlay =
document.getElementById("loadingOverlay");

// Banner

const messageBanner =
document.getElementById("messageBanner");

let modalOpenCount = 0;
let messageTimer = null;

/*******************************************************
 * Utility Helpers
 *******************************************************/
function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatDisplayDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function lockBodyScroll() {
    modalOpenCount += 1;
    document.body.style.overflow = "hidden";
}

function unlockBodyScroll() {
    modalOpenCount = Math.max(0, modalOpenCount - 1);

    if (modalOpenCount === 0) {
        document.body.style.overflow = "";
    }
}

function showLoading(show) {
    loadingOverlay.classList.toggle("hidden", !show);
    loadingOverlay.setAttribute("aria-hidden", String(!show));
}

function openAlert(title, body) {
    alertTitle.textContent = title;
    alertBody.innerHTML = body;
    alertModal.classList.remove("hidden");
    alertModal.setAttribute("aria-hidden", "false");
    lockBodyScroll();
}

function closeAlert() {
    alertModal.classList.add("hidden");
    alertModal.setAttribute("aria-hidden", "true");
    unlockBodyScroll();
}

function showMessage(message) {
    messageBanner.textContent = message;
    messageBanner.classList.remove("hidden");

    if (messageTimer) {
        clearTimeout(messageTimer);
    }

    messageTimer = setTimeout(() => {
        messageBanner.classList.add("hidden");
    }, 3000);
}

async function isClassTeacher(teacherName) {
    try {
        const response = await api("isClassTeacher", {
            teacherName: String(teacherName || "").trim()
        });

        if (response?.success && response?.data) {
            const className = response.data.class || response.data.className || "";

            if (className) {
                return success({
                    class: className,
                    teacher: response.data.teacher || teacherName
                });
            }
        }

        return error("Teacher is not a Class Teacher.");
    }
    catch (err) {
        return error(err.toString());
    }
}

function success(payload) {
    return {
        success: true,
        ...payload
    };
}

function error(message) {
    return {
        success: false,
        message
    };
}

/*******************************************************
 * Initialize Page
 *******************************************************/
document.addEventListener("DOMContentLoaded", initTeacherDiary);

async function initTeacherDiary() {

    bindEvents();

    try {

        showLoading(true);

        const today = new Date();

        const isoDate =
        today.toISOString().slice(0,10);

        state.date = isoDate;

        // TODO: Backend action required for teacher routine loading.
        const response = await api("getTeacherRoutine", {
            teacherName: state.teacherName,
            date: isoDate
        });

        if (!response?.success) {
            throw new Error(response?.message || "Unable to load teacher routine.");
        }

        const routineData = response?.data || {};

        state.teacherName = routineData.teacher || routineData.teacherName || state.teacherName;
        state.className = routineData.className || routineData.class || "";
        state.day = routineData.day || today.toLocaleDateString("en-US", {
            weekday: "long"
        });
        state.date = routineData.date || isoDate;

        const classTeacherCheck = await isClassTeacher(state.teacherName);
        state.isClassTeacher = Boolean(classTeacherCheck?.success && classTeacherCheck?.class);

        if (state.isClassTeacher && classTeacherCheck?.class) {
            state.className = classTeacherCheck.class;
        }

        state.diary = Array.isArray(routineData.periods)
            ? routineData.periods.map((entry) => ({
                ...entry,
                classwork: entry.classwork || "",
                homework: entry.homework || "",
                saved: Boolean(entry.saved)
            }))
            : [];

        renderTeacherHeader();

        renderDiaryTable();

        renderPreview();

        if (downloadClassLogBtn) {
            downloadClassLogBtn.style.display = "";
        }

    }

    catch(error){

        console.error(error);

        openAlert(

            "Loading Error",

            "Unable to load today's routine."

        );

    }

    finally{

        showLoading(false);

    }

}

/*******************************************************
 * Bind Events
 *******************************************************/
function bindEvents(){

    openPreviewBtn.addEventListener(

        "click",

        openTeacherPreview

    );

    downloadClassLogBtn.addEventListener(

        "click",

        loadClassLog

    );

    closePrintModalBtn.addEventListener(

        "click",

        closeTeacherPreview

    );

    modalCloseBtn.addEventListener(

        "click",

        closeTeacherPreview

    );

    closeClassLogBtn.addEventListener(

        "click",

        closeClassLog

    );

    closeClassLogFooterBtn.addEventListener(

        "click",

        closeClassLog

    );

    saveClassLogBtn.addEventListener(

        "click",

        saveClassLogChanges

    );

    printClassLogBtn.addEventListener(

        "click",

        printClassLog

    );

    pdfClassLogBtn.addEventListener(

        "click",

        downloadClassLogPDF

    );

    jpgClassLogBtn.addEventListener(

        "click",

        downloadClassLogJPG

    );

    closeAlertBtn.addEventListener(

        "click",

        closeAlert

    );

    alertCloseBtn.addEventListener(

        "click",

        closeAlert

    );

}

/*******************************************************
 * Render Teacher Header
 *******************************************************/
function renderTeacherHeader() {

    teacherNameEl.textContent = state.teacherName;

    teacherDayEl.textContent = state.day;

    teacherDateEl.textContent = formatDisplayDate(state.date);

}

/*******************************************************
 * Render Teacher Diary Table
 *******************************************************/
function renderDiaryTable() {
    diaryTableBody.innerHTML = "";

    if (!state.diary.length) {
        diaryTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No periods assigned today.</td></tr>';
        return;
    }

    state.diary.forEach((entry, index) => {
        const tr = document.createElement("tr");
        tr.dataset.index = index;

        const actionHtml = entry.saved
            ? '<button class="secondary-btn edit-row-btn">Edit</button>'
            : '<button class="primary-btn save-row-btn">Save</button>';
        const classworkDisabled = entry.saved ? "disabled" : "";
        const homeworkDisabled = entry.saved ? "disabled" : "";

        tr.innerHTML = [
            "<td>",
            entry.period,
            "</td>",
            "<td class=\"subject-cell\"><strong>",
            escapeHtml(entry.class || ""),
            "</strong><br><small>",
            escapeHtml(entry.subject || ""),
            "</small></td>",
            "<td><textarea class=\"classwork-input\" data-field=\"classwork\" placeholder=\"Enter Classwork...\" ",
            classworkDisabled,
            ">",
            escapeHtml(entry.classwork || ""),
            "</textarea></td>",
            "<td><textarea class=\"homework-input\" data-field=\"homework\" placeholder=\"Enter Homework...\" ",
            homeworkDisabled,
            ">",
            escapeHtml(entry.homework || ""),
            "</textarea></td>",
            "<td>",
            actionHtml,
            "</td>"
        ].join("");

        diaryTableBody.appendChild(tr);
    });

    attachTableEvents();
}

/*******************************************************
 * Attach Events
 *******************************************************/
function attachTableEvents() {

    const rows =
    diaryTableBody.querySelectorAll("tr");

    rows.forEach(row => {

        const index =
        Number(row.dataset.index);

        const saveBtn =
        row.querySelector(".save-row-btn");

        const editBtn =
        row.querySelector(".edit-row-btn");

        const classwork =
        row.querySelector(".classwork-input");

        const homework =
        row.querySelector(".homework-input");

        if (saveBtn) {

            saveBtn.addEventListener(

                "click",

                () => saveRow(index,row)

            );

        }

        if (editBtn) {

            editBtn.addEventListener(

                "click",

                () => editRow(index)

            );

        }

        if (classwork) {

            classwork.addEventListener(

                "input",

                () => {

                    state.diary[index].classwork =
                    classwork.value;

                    renderPreview();

                }

            );

        }

        if (homework) {

            homework.addEventListener(

                "input",

                () => {

                    state.diary[index].homework =
                    homework.value;

                    renderPreview();

                }

            );

        }

    });

}

/*******************************************************
 * Save One Period
 *******************************************************/
async function saveRow(index,row){

    try{

        showLoading(true);

        const classwork =
        row.querySelector(".classwork-input")
        .value
        .trim();

        const homework =
        row.querySelector(".homework-input")
        .value
        .trim();

        const period =
        state.diary[index];

        const saveResponse = await api(
            "saveDailyLog",
            {
                date: state.date,
                day: state.day,
                class: period.class || state.className,
                className: period.class || state.className,
                period: period.period,
                subject: period.subject,
                teacher: state.teacherName,
                classwork,
                homework
            }
        );

        if (!saveResponse?.success) {
            throw new Error(saveResponse?.message || "Unable to save this period.");
        }

        period.classwork =
        classwork;

        period.homework =
        homework;

        period.saved =
        true;

        renderDiaryTable();

        renderPreview();

        showMessage(

            "Period Saved Successfully"

        );

    }

    catch(error){

        console.error(error);

        openAlert(

            "Save Failed",

            "Unable to save this period."

        );

    }

    finally{

        showLoading(false);

    }

}

/*******************************************************
 * Edit Row
 *******************************************************/
function editRow(index){

    state.diary[index].saved = false;

    renderDiaryTable();

}

/*******************************************************
 * Teacher Preview
 *******************************************************/
function renderPreview() {
    let html = "";
    html += '<table class="preview-table"><thead><tr><th>Period</th><th>Subject</th><th>Classwork</th><th>Homework</th></tr></thead><tbody>';

    state.diary.forEach((item) => {
        html += '<tr><td>' + escapeHtml(String(item.period)) + '</td><td>' + escapeHtml(item.subject || "") + '</td><td>' + escapeHtml(item.classwork || "") + '</td><td>' + escapeHtml(item.homework || "") + '</td></tr>';
    });

    html += '</tbody></table>';
    dailyPreview.innerHTML = html;
}

/*******************************************************
 * Open Teacher Preview
 *******************************************************/
function openTeacherPreview() {

    printPreviewContent.innerHTML =
        buildPrintablePreview();

    printModal.classList.remove("hidden");

    printModal.setAttribute(
        "aria-hidden",
        "false"
    );

    lockBodyScroll();

}

/*******************************************************
 * Close Teacher Preview
 *******************************************************/
function closeTeacherPreview() {

    printModal.classList.add("hidden");

    printModal.setAttribute(
        "aria-hidden",
        "true"
    );

    unlockBodyScroll();

}

/*******************************************************
 * Printable HTML
 *******************************************************/
function buildPrintablePreview() {
    let html = "";
    html += '<div class="print-document">';
    html += '<div class="print-header"><h2>DAV INTERNATIONAL SCHOOL</h2><h3>Teacher Daily Log</h3></div>';
    html += '<div class="print-meta">';
    html += '<div><strong>Teacher :</strong> ' + escapeHtml(state.teacherName) + '</div>';
    html += '<div><strong>Class :</strong> ' + escapeHtml(state.className) + '</div>';
    html += '<div><strong>Day :</strong> ' + escapeHtml(state.day) + '</div>';
    html += '<div><strong>Date :</strong> ' + escapeHtml(formatDisplayDate(state.date)) + '</div>';
    html += '</div>';
    html += '<table class="print-table"><thead><tr><th>Period</th><th>Subject</th><th>Classwork</th><th>Homework</th></tr></thead><tbody>';

    state.diary.forEach((item) => {
        html += '<tr><td>' + escapeHtml(String(item.period)) + '</td><td>' + escapeHtml(item.subject || "") + '</td><td>' + escapeHtml(item.classwork || "") + '</td><td>' + escapeHtml(item.homework || "") + '</td></tr>';
    });

    html += '</tbody></table><br><br><div class="signature-row"><div>_______________________<br>Teacher Signature</div><div>_______________________<br>Principal</div></div></div>';
    return html;
}

/*******************************************************
 * Print Teacher Preview
 *******************************************************/
function printTeacherPreview() {
    const popup = window.open("", "_blank");

    if (!popup) {
        openAlert("Print Failed", "Please allow popups to print the teacher preview.");
        return;
    }

    popup.document.write('<html><head><title>Teacher Daily Log</title><style>body{font-family:Arial;margin:30px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #000;padding:8px;text-align:left;}h2,h3{text-align:center;}.signature-row{display:flex;justify-content:space-between;margin-top:60px;}</style></head><body>' + buildPrintablePreview() + '</body></html>');
    popup.document.close();
    popup.focus();
    popup.print();
}

/*******************************************************
 * PDF (Teacher)
 *******************************************************/
async function downloadTeacherPDF() {

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("p", "mm", "a4");

    const canvas = await html2canvas(
        printPreviewContent,
        {
            scale:2
        }
    );

    const img = canvas.toDataURL("image/png");

    const width = 190;

    const height =
        canvas.height * width /
        canvas.width;

    pdf.addImage(
        img,
        "PNG",
        10,
        10,
        width,
        height
    );

    pdf.save(
        state.className + "_" + state.date + "_TeacherLog.pdf"
    );

}

/*******************************************************
 * JPG (Teacher)
 *******************************************************/
async function downloadTeacherJPG(){

    const canvas =
        await html2canvas(
            printPreviewContent,
            {
                scale:2
            }
        );

    const link =
        document.createElement("a");

    link.download =
        state.className + "_" + state.date + "_TeacherLog.jpg";

    link.href =
        canvas.toDataURL("image/jpeg",1);

    link.click();

}

/*******************************************************
 * PDF (Class Log)
 *******************************************************/
async function downloadClassLogPDF() {

    if (!state.classLog) {
        openAlert(
            "No Class Log",
            "Open the class log before downloading a PDF."
        );

        return;
    }

    try {
        showLoading(true);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        const exportTarget = classLogExportContent || classLogModal;
        const canvas = await html2canvas(exportTarget, {
            scale: 2,
            backgroundColor: "#fff"
        });

        const img = canvas.toDataURL("image/png");
        const width = 190;
        const height = canvas.height * width / canvas.width;

        pdf.addImage(img, "PNG", 10, 10, width, height);
        pdf.save((state.classLog.className || "ClassLog") + "_" + state.classLog.date + "_ClassLog.pdf");
    }

    catch (error) {
        console.error(error);
        openAlert("Download Failed", "Unable to generate the PDF export.");
    }

    finally {
        showLoading(false);
    }
}

/*******************************************************
 * JPG (Class Log)
 *******************************************************/
async function downloadClassLogJPG() {

    if (!state.classLog) {
        openAlert(
            "No Class Log",
            "Open the class log before downloading a JPG."
        );

        return;
    }

    try {
        showLoading(true);

        const exportTarget = classLogExportContent || classLogModal;
        const canvas = await html2canvas(exportTarget, {
            scale: 2,
            backgroundColor: "#fff"
        });

        const link = document.createElement("a");
        link.download = (state.classLog.className || "ClassLog") + "_" + state.classLog.date + "_ClassLog.jpg";
        link.href = canvas.toDataURL("image/jpeg", 1);
        link.click();
    }

    catch (error) {
        console.error(error);
        openAlert("Download Failed", "Unable to generate the JPG export.");
    }

    finally {
        showLoading(false);
    }
}

/*******************************************************
 * Submit Teacher Diary
 *******************************************************/
async function submitDiary(){

    const unsaved =
        state.diary.some(
            row => !row.saved
        );

    if(unsaved){

        openAlert(

            "Unsaved Records",

            "Please save every period before submitting."

        );

        return;

    }

    try{

        showLoading(true);

        for (const [index, entry] of state.diary.entries()) {
            if (entry.saved) {
                continue;
            }

            const saveResponse = await api("saveDailyLog", {
                date: state.date,
                day: state.day,
                class: entry.class || state.className,
                className: entry.class || state.className,
                period: entry.period,
                subject: entry.subject,
                teacher: state.teacherName,
                classwork: entry.classwork || "",
                homework: entry.homework || ""
            });

            if (!saveResponse?.success) {
                throw new Error(saveResponse?.message || "Unable to submit the daily log.");
            }

            state.diary[index].saved = true;
        }

        renderDiaryTable();
        renderPreview();
        showMessage("Daily Log Submitted Successfully");

    }

    catch(error){

        console.error(error);

        openAlert(

            "Submission Failed",

            "Unable to submit today's diary."

        );

    }

    finally{

        showLoading(false);

    }

}

/*******************************************************
 * Connect Modal Buttons
 *******************************************************/
modalPrintBtn.addEventListener(

    "click",

    printTeacherPreview

);

modalPdfBtn.addEventListener(

    "click",

    downloadTeacherPDF

);

modalJpgBtn.addEventListener(

    "click",

    downloadTeacherJPG

);

/*******************************************************
 * Load Class Log
 *******************************************************/
async function loadClassLog() {

    const classTeacherCheck = await isClassTeacher(state.teacherName);
    state.isClassTeacher = Boolean(classTeacherCheck?.success && classTeacherCheck?.class);

    if (!state.isClassTeacher) {

        openAlert(

            "Not a Class Teacher",

            "You are not the class teacher of any class."

        );

        return;

    }

    if (classTeacherCheck?.class) {
        state.className = classTeacherCheck.class;
    }

    try {

        showLoading(true);

        const response = await api("loadClassLog", {
            class: state.className,
            className: state.className,
            date: state.date
        });

        if (!response?.success) {
            throw new Error(response?.message || "Unable to load class log.");
        }

        const classLogData = response?.data || response || {};
        const rawEntries = Array.isArray(classLogData.entries)
            ? classLogData.entries
            : Array.isArray(classLogData.logs)
                ? classLogData.logs
                : [];

        const normalizedEntries = rawEntries.map((entry) => ({
            period: entry.period,
            subject: entry.subject || "",
            classwork: entry.classwork || "",
            homework: entry.homework || "",
            teacher: entry.teacher || state.teacherName
        }));

        state.classLog = {
            className: classLogData.className || classLogData.class || state.className,
            day: classLogData.day || state.day,
            date: classLogData.date || state.date,
            classTeacher: classLogData.classTeacher || state.teacherName,
            teachers: Array.isArray(classLogData.teachers) && classLogData.teachers.length
                ? classLogData.teachers
                : [state.teacherName],
            logs: normalizedEntries
        };

        renderClassLogHeader();
        renderClassLogTable();
        openClassLogModal();
        showMessage("Class log copy is ready. You can edit and download it.");

    }

    catch (error) {

        console.error(error);

        openAlert(

            "Loading Error",

            error.message

        );

    }

    finally {

        showLoading(false);

    }

}

/*******************************************************
 * Open Class Log Modal
 *******************************************************/
function openClassLogModal() {

    classLogModal.classList.remove("hidden");

    classLogModal.setAttribute(

        "aria-hidden",

        "false"

    );

    lockBodyScroll();

}

/*******************************************************
 * Close Class Log Modal
 *******************************************************/
function closeClassLog() {

    classLogModal.classList.add(

        "hidden"

    );

    classLogModal.setAttribute(

        "aria-hidden",

        "true"

    );

    unlockBodyScroll();

}

/*******************************************************
 * Render Header
 *******************************************************/
function renderClassLogHeader() {

    if (!state.classLog) return;

    classLogClass.textContent =

        state.classLog.className;

    classLogDay.textContent =

        state.classLog.day;

    classLogDate.textContent =

        formatDisplayDate(

            state.classLog.date

        );

    classTeacherName.textContent =

        state.classLog.classTeacher ||

        state.teacherName;

}

/*******************************************************
 * Render Table
 *******************************************************/
async function renderClassLogTable() {

    classLogTableBody.innerHTML = "";

    const logs = state.classLog?.logs || [];

    for (const [index, row] of logs.entries()) {

        const tr = document.createElement("tr");

        const teacherCell = await buildTeacherDropdown(
            row.teacher || state.teacherName
        );

        tr.innerHTML = `
            <td>${row.period || index + 1}</td>
            <td><strong>${escapeHtml(row.subject || "")}</strong></td>
            <td><textarea class="classlog-classwork">${escapeHtml(row.classwork || "")}</textarea></td>
            <td><textarea class="classlog-homework">${escapeHtml(row.homework || "")}</textarea></td>
            <td>${teacherCell}</td>
        `;

        classLogTableBody.appendChild(tr);
    }
}

/*******************************************************
 * Teacher Dropdown
 *******************************************************/
async function buildTeacherDropdown(selectedTeacher = "") {

    const res = await api("getMasterData");

    const teachers = (res.success && res.data.teachers)
        ? res.data.teachers
        : [];

    const options = teachers.map((name) => {
        const value = escapeHtml(name);
        const selected = name === selectedTeacher ? "selected" : "";
        return `<option value="${value}" ${selected}>${value}</option>`;
    }).join("");

    return `<select class="classlog-teacher">${options}</select>`;
}
/*******************************************************
 * Save Class Log Changes
 *******************************************************/
async function saveClassLogChanges() {

    try {

        showLoading(true);

        const logs = collectClassLogRows();

        if (!logs.length) {

            openAlert(

                "Nothing to Save",

                "No class log entries were found."

            );

            return;

        }

        const payload = {
            class: state.classLog.className,
            className: state.classLog.className,
            date: state.classLog.date,
            day: state.classLog.day,
            logs: logs
        };

        console.log(

            "Updating Class Log",

            payload

        );

        const response = await api(
            "updateClassLog",
            payload
        );

        if (!response?.success) {
            throw new Error(response?.message || "Unable to save class log.");
        }

        state.classLog.logs = logs;

        showMessage(

            "Class Log Updated Successfully"

        );

    }

    catch(error){

        console.error(error);

        openAlert(

            "Save Failed",

            error.message

        );

    }

    finally{

        showLoading(false);

    }

}

/*******************************************************
 * Read Edited Table
 *******************************************************/
function collectClassLogRows(){

    const rows =

        classLogTableBody.querySelectorAll("tr");

    const logs = [];

    rows.forEach(row=>{

        const period =

            Number(

                row.cells[0].textContent

            );

        const subject =

            row.cells[1]

            .textContent

            .trim();

        const classwork =

            row.querySelector(

                ".classlog-classwork"

            ).value.trim();

        const homework =

            row.querySelector(

                ".classlog-homework"

            ).value.trim();

        const teacher =

            row.querySelector(

                ".classlog-teacher"

            ).value;

        logs.push({

            period,

            subject,

            classwork,

            homework,

            teacher

        });

    });

    return logs;

}
/*******************************************************
 * Build Printable Class Log
 *******************************************************/
function buildClassLogPreview() {
    if (!state.classLog) return "";

    const data = state.classLog;
    const rows = collectClassLogRows();

    let html = "";
    html += '<div id="classLogPrintArea" class="print-document">';
    html += '<div class="report-header">';
    html += '<h1>DAV INTERNATIONAL SCHOOL</h1>';
    html += '<h2>CLASS DAILY LOG REPORT</h2>';
    html += '</div>';
    html += '<table class="report-info">';
    html += '<tr><td><strong>Class :</strong> ' + escapeHtml(data.className) + '</td><td><strong>Day :</strong> ' + escapeHtml(data.day) + '</td></tr>';
    html += '<tr><td><strong>Date :</strong> ' + formatDisplayDate(data.date) + '</td><td><strong>Class Teacher :</strong> ' + escapeHtml(data.classTeacher || state.teacherName) + '</td></tr>';
    html += '</table>';
    html += '<br>';
    html += '<table class="print-table">';
    html += '<thead><tr><th width="8%">Period</th><th width="15%">Subject</th><th width="32%">Classwork</th><th width="30%">Homework</th><th width="15%">Teacher</th></tr></thead>';
    html += '<tbody>';

    rows.forEach((row) => {
        html += '<tr>';
        html += '<td>' + escapeHtml(String(row.period)) + '</td>';
        html += '<td>' + escapeHtml(row.subject || "") + '</td>';
        html += '<td>' + escapeHtml(row.classwork || "") + '</td>';
        html += '<td>' + escapeHtml(row.homework || "") + '</td>';
        html += '<td>' + escapeHtml(row.teacher || "") + '</td>';
        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '<br><br><br>';
    html += '<div class="signature-row">';
    html += '<div>_______________________<br>Class Teacher</div>';
    html += '<div>_______________________<br>Principal</div>';
    html += '</div></div>';

    return html;
}

/*******************************************************
 * Print Class Log
 *******************************************************/
function printClassLog() {
    const html = buildClassLogPreview();
    const popup = window.open("", "_blank", "width=900,height=900");

    if (!popup) {
        openAlert("Print Failed", "Please allow popups to print the class log.");
        return;
    }

    popup.document.write('<!DOCTYPE html><html><head><title>Class Daily Log</title><style>body{font-family:Arial;padding:30px;color:#000;}h1{text-align:center;margin:0;font-size:26px;}h2{text-align:center;margin:6px 0 25px;font-size:20px;}.report-info{width:100%;border-collapse:collapse;}.report-info td{padding:8px;}.print-table{width:100%;border-collapse:collapse;}.print-table th,.print-table td{border:1px solid #000;padding:8px;vertical-align:top;text-align:left;}.print-table th{background:#eee;}.signature-row{display:flex;justify-content:space-between;margin-top:60px;}</style></head><body>' + html + '</body></html>');
    popup.document.close();
    popup.focus();
    popup.print();
}