const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6];

const state = {
  selectedClass: '',
  selectedClassTeacher: '',
  effectiveDate: '',
  timetable: {},
  activeCell: null,
  subjects: [],
  teachers: [],
  classes: [],
  schoolName: ''
};

const classSelect = document.getElementById('classSelect');
const classTeacherSelect = document.getElementById('classTeacherSelect');
const effectiveDateInput = document.getElementById('effectiveDate');
const loadTimetableBtn = document.getElementById('loadTimetableBtn');
const timetableTable = document.getElementById('timetableTable');
const previewContainer = document.getElementById('previewContainer');
const previewFullBtn = document.getElementById('previewFullBtn');
const saveTimetableBtn = document.getElementById('saveTimetableBtn');
const resetTimetableBtn = document.getElementById('resetTimetableBtn');
const entryModal = document.getElementById('entryModal');
const closeEntryModalBtn = document.getElementById('closeEntryModalBtn');
const cancelEntryBtn = document.getElementById('cancelEntryBtn');
const entryForm = document.getElementById('entryForm');
const subjectSelect = document.getElementById('subjectSelect');
const teacherSelect = document.getElementById('teacherSelect');
const modalClassValue = document.getElementById('modalClassValue');
const modalDayValue = document.getElementById('modalDayValue');
const modalPeriodValue = document.getElementById('modalPeriodValue');
const printModal = document.getElementById('printModal');
const printPreviewContent = document.getElementById('printPreviewContent');
const closePrintModalBtn = document.getElementById('closePrintModalBtn');
const closePrintActionsBtn = document.getElementById('closePrintActionsBtn');

async function init() {

    try {
 

    // Load master data
    const master = await api("getMasterData");

    state.classes = master.data.classes;
    state.subjects = master.data.subjects;
    state.teachers = master.data.teachers;

    populateSelect(classSelect, state.classes);
    populateSelect(classTeacherSelect, state.teachers);
    populateSelect(subjectSelect, state.subjects);
    populateSelect(teacherSelect, state.teachers);

    state.selectedClass = state.classes[0] || "";
    state.selectedClassTeacher = state.teachers[0] || "";

    classSelect.value = state.selectedClass;
    classTeacherSelect.value = state.selectedClassTeacher;

    effectiveDateInput.value = getDefaultDate();
    state.effectiveDate = effectiveDateInput.value;

    bindEvents();

    await loadTimetable();

}
catch(err){

    console.error(err);

    alert("Unable to load initial data.");


    }

}

init();

function bindEvents() {
  classSelect.addEventListener("change", async () => {

    state.selectedClass = classSelect.value;

    const res = await api("getClassTeacher", {
        class: state.selectedClass
    });

    if (res.success) {
        classTeacherSelect.value = res.data.teacher;
        state.selectedClassTeacher = res.data.teacher;
    }

    await loadTimetable();
});
let eventsBound = false;

function bindEvents() {

    if (eventsBound) return;

    eventsBound = true;

    // all your addEventListener() calls...
}

  loadTimetableBtn.addEventListener('click', () => {
    loadTimetable();
  });

  timetableTable.addEventListener('click', handleTableCellClick);

  entryForm.addEventListener('submit', handleEntrySave);
  closeEntryModalBtn.addEventListener('click', closeEntryModal);
  cancelEntryBtn.addEventListener('click', closeEntryModal);
  entryModal.addEventListener('click', (event) => {
    if (event.target === entryModal) {
      closeEntryModal();
    }
  });

  previewFullBtn.addEventListener('click', openPrintablePreview);
  closePrintModalBtn.addEventListener('click', closePrintablePreview);
  closePrintActionsBtn.addEventListener('click', closePrintablePreview);
  printModal.addEventListener('click', (event) => {
    if (event.target === printModal) {
      closePrintablePreview();
    }
  });

 saveTimetableBtn.addEventListener("click", async () => {

    const payload = {
        className: state.selectedClass,
        classTeacher: state.selectedClassTeacher,
        effectiveDate: state.effectiveDate,
        timetable: state.timetable
    };

    try {

        const res = await api("saveRoutine", payload);

        alert(res.message || "Saved successfully.");

    } catch(err) {

        console.error(err);
        alert("Save failed.");

    }

});
  resetTimetableBtn.addEventListener('click', () => {
    state.timetable = createEmptyTimetable();
    renderTimetable();
    renderPreview();
  });
}

function populateSelect(selectElement, values) {
  selectElement.innerHTML = values
    .map((value) => `<option value="${value}">${value}</option>`)
    .join('');
}

function getDefaultDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function loadTimetable() {
  try {
    state.selectedClass = classSelect.value || state.selectedClass;
    state.effectiveDate = effectiveDateInput.value || getDefaultDate();
    const res = await api('loadRoutine', { className: state.selectedClass, effectiveDate: state.effectiveDate });
    const timetable = res?.data?.timetable || res.timetable || {};
    state.timetable = Object.keys(timetable).length ? timetable : createEmptyTimetable();
    renderTimetable();
    renderPreview();
  } catch (err) {
    console.error('Failed to load timetable:', err);
    alert('Failed to load timetable from server.');
    state.timetable = createEmptyTimetable();
    renderTimetable();
    renderPreview();
  }
}

function createEmptyTimetable() {
  return WORKING_DAYS.reduce((acc, day) => {
    acc[day] = {};
    PERIODS.forEach((period) => {
      acc[day][period] = null;
    });
    return acc;
  }, {});
}

function renderTimetable() {
  const rows = ['<thead><tr><th>Day / Period</th>', ...PERIODS.map((p) => `<th>Period ${p}</th>`), '<th class="lunch-head">Lunch</th></tr></thead>', '<tbody>'];

  WORKING_DAYS.forEach((day) => {
    rows.push(`<tr><th>${day}</th>`);
    PERIODS.forEach((period) => {
      const entry = state.timetable[day]?.[period];
      rows.push(`<td class="timetable-cell" data-day="${day}" data-period="${period}">`);
      if (entry && entry.subject && entry.teacher) {
        rows.push(`<div class="entry-label">${entry.subject}</div><div class="entry-teacher">${entry.teacher}</div>`);
      } else {
        rows.push(`<span class="empty-cell">+ Add</span>`);
      }
      rows.push('</td>');
    });
    rows.push(`<td class="lunch-cell">R<br />E<br />C<br />E<br />S<br />S</td></tr>`);
  });

  rows.push('</tbody>');
  timetableTable.innerHTML = rows.join('');
}

function renderPreview() {
  const previewRows = ['<div class="preview-grid">', '<div class="preview-row">', '<div class="preview-cell"><strong>Day</strong></div>'];
  PERIODS.forEach((period) => previewRows.push(`<div class="preview-cell"><strong>Period ${period}</strong></div>`));
  previewRows.push('<div class="preview-cell"><strong>Lunch</strong></div></div>');

  WORKING_DAYS.forEach((day) => {
    previewRows.push('<div class="preview-row">');
    previewRows.push(`<div class="preview-cell"><strong>${day}</strong></div>`);
    PERIODS.forEach((period) => {
      const entry = state.timetable[day]?.[period];
      previewRows.push(`<div class="preview-cell">${renderCellText(entry)}</div>`);
    });
    previewRows.push('<div class="preview-cell">Lunch</div></div>');
  });

  previewRows.push('</div>');
  previewContainer.innerHTML = previewRows.join('');
}

function renderCellText(entry) {
  if (entry && entry.subject && entry.teacher) {
    return `<strong>${entry.subject}</strong><span>${entry.teacher}</span>`;
  }
  return '<span class="empty-cell">—</span>';
}

function handleTableCellClick(event) {
  const cell = event.target.closest('.timetable-cell');
  if (!cell) {
    return;
  }

  const day = cell.getAttribute('data-day');
  const period = Number(cell.getAttribute('data-period'));
  openEntryModal(day, period);
}

function openEntryModal(day, period) {
  state.activeCell = { day, period };
  modalClassValue.textContent = state.selectedClass;
  modalDayValue.textContent = day;
  modalPeriodValue.textContent = period;
  entryModal.classList.remove('hidden');
  entryModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeEntryModal() {
  entryModal.classList.add('hidden');
  entryModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.activeCell = null;
}

function handleEntrySave(event) {
  event.preventDefault();
  if (!state.activeCell) {
    return;
  }

  const day = state.activeCell.day;
  const period = state.activeCell.period;
  const entry = {
    subject: subjectSelect.value,
    teacher: teacherSelect.value
  };

  if (!state.timetable[day]) {
    state.timetable[day] = {};
  }

  state.timetable[day][period] = entry;
  closeEntryModal();
  renderTimetable();
  renderPreview();
}

function openPrintablePreview() {
  printPreviewContent.innerHTML = buildPrintableMarkup();
  printModal.classList.remove('hidden');
  printModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePrintablePreview() {
  printModal.classList.add('hidden');
  printModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function buildPrintableMarkup() {
  const rows = ['<div class="printable-document">', '<div class="print-header">', '<div class="print-logo"><i class="fa-solid fa-school"></i></div>', '<div class="print-title">', `<h4>${state.schoolName || 'School'}</h4>`, '<p>Weekly Class Timetable</p>', '</div>', '</div>', '<div class="print-meta">', `<span><strong>Class :</strong> ${state.selectedClass}</span>`, `<span><strong>Class Teacher :</strong> ${state.selectedClassTeacher}</span>`, `<span><strong>Effective Date :</strong> ${formatDisplayDate(state.effectiveDate)}</span>`, '</div>', '<table><thead><tr><th>Day</th>'];

  PERIODS.forEach((period) => rows.push(`<th>Period ${period}</th>`));
  rows.push('<th>Lunch</th></tr></thead><tbody>');

  WORKING_DAYS.forEach((day) => {
    rows.push('<tr>');
    rows.push(`<td>${day}</td>`);
    PERIODS.forEach((period) => {
      const entry = state.timetable[day]?.[period];
      rows.push(`<td>${renderCellText(entry)}</td>`);
    });
    rows.push('<td>Lunch</td></tr>');
  });

  rows.push('</tbody></table></div>');
  return rows.join('');
}

function formatDisplayDate(dateString) {
  if (!dateString) {
    return '';
  }

  const parsed = new Date(dateString);
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}


