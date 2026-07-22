const diaryData = {
  classes: ['2A', '2B', '3A', '3B', '4A', '5A', '6A', '7A', '8A', '9A', '10A'],
  diaries: [
    {
      class: '5A',
      date: '2026-07-12',
      periods: [
        { period: 1, subject: 'Science', teacher: 'Ravi Sir', classwork: 'Plants and their parts', homework: 'Draw Diagram' },
        { period: 2, subject: 'English', teacher: "Neha Ma'am", classwork: 'Poem Reading', homework: 'Learn Poem' },
        { period: 3, subject: 'Maths', teacher: 'Amit Sir', classwork: 'Fractions', homework: 'Exercise 5.4' },
        { period: 4, subject: 'Computer', teacher: 'Priya Ma'am', classwork: 'MS Paint', homework: 'Practice' },
        { period: 5, subject: 'Hindi', teacher: 'Rina Ma'am', classwork: 'Grammar', homework: 'Worksheet' },
        { period: 6, subject: 'GK', teacher: 'Ashok Sir', classwork: 'Chapter 3', homework: 'Read Notes' }
      ]
    },
    {
      class: '6A',
      date: '2026-07-12',
      periods: [
        { period: 1, subject: 'Maths', teacher: 'Amit Sir', classwork: 'Decimals', homework: 'Practice sums' },
        { period: 2, subject: 'Science', teacher: 'Ravi Sir', classwork: 'Solar system', homework: 'Draw planet chart' },
        { period: 3, subject: 'English', teacher: "Neha Ma'am", classwork: 'Essay writing', homework: 'Write one page' },
        { period: 4, subject: 'Computer', teacher: 'Priya Ma'am', classwork: 'Keyboard shortcuts', homework: 'Practice typing' },
        { period: 5, subject: 'Art & Craft', teacher: 'Rina Ma'am', classwork: 'Origami', homework: 'Finish paper boat' },
        { period: 6, subject: 'GK', teacher: 'Ashok Sir', classwork: 'Current affairs', homework: 'Note latest news' }
      ]
    }
  ]
};

const state = {
  selectedClass: diaryData.classes[0],
  selectedDate: '',
  diary: null,
  filteredPeriods: []
};

const classSelect = document.getElementById('classSelect');
const diaryDateInput = document.getElementById('diaryDate');
const loadDiaryBtn = document.getElementById('loadDiaryBtn');
const diarySearch = document.getElementById('diarySearch');
const diaryTableBody = document.querySelector('#diaryTable tbody');
const infoClass = document.getElementById('infoClass');
const infoDate = document.getElementById('infoDate');
const infoPeriods = document.getElementById('infoPeriods');
const infoCompleted = document.getElementById('infoCompleted');
const infoPending = document.getElementById('infoPending');
const infoStatus = document.getElementById('infoStatus');
const summaryPeriods = document.getElementById('summaryPeriods');
const summaryCompleted = document.getElementById('summaryCompleted');
const summaryPending = document.getElementById('summaryPending');
const summarySubjects = document.getElementById('summarySubjects');
const summaryTeachers = document.getElementById('summaryTeachers');
const printPreview = document.getElementById('printPreview');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const downloadJpgBtn = document.getElementById('downloadJpgBtn');
const printDiaryBtn = document.getElementById('printDiaryBtn');
const reportModal = document.getElementById('reportModal');
const reportContent = document.getElementById('reportContent');
const reportMeta = document.getElementById('reportMeta');
const closeReportBtn = document.getElementById('closeReportBtn');
const modalPrintBtn = document.getElementById('modalPrintBtn');
const modalPdfBtn = document.getElementById('modalPdfBtn');
const modalJpgBtn = document.getElementById('modalJpgBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const messageBanner = document.getElementById('messageBanner');

function initDiaryPage() {
  populateSelect(classSelect, diaryData.classes);
  diaryDateInput.value = getDefaultDate();
  state.selectedDate = diaryDateInput.value;
  bindEvents();
  loadDiary();
}

function bindEvents() {
  loadDiaryBtn.addEventListener('click', loadDiary);
  classSelect.addEventListener('change', (event) => {
    state.selectedClass = event.target.value;
  });
  diaryDateInput.addEventListener('change', (event) => {
    state.selectedDate = event.target.value;
  });
  diarySearch.addEventListener('input', handleSearch);
  printDiaryBtn.addEventListener('click', openPrintModal);
  closeReportBtn.addEventListener('click', closePrintModal);
  modalPrintBtn.addEventListener('click', () => showMessage('Print dialog would open here', 2000));
  modalPdfBtn.addEventListener('click', () => showMessage('PDF download placeholder', 2000));
  modalJpgBtn.addEventListener('click', () => showMessage('JPG download placeholder', 2000));
  modalCloseBtn.addEventListener('click', closePrintModal);
  reportModal.addEventListener('click', (event) => {
    if (event.target === reportModal) closePrintModal();
  });
  downloadPdfBtn.addEventListener('click', () => showMessage('Download PDF button placeholder', 1800));
  downloadJpgBtn.addEventListener('click', () => showMessage('Download JPG button placeholder', 1800));
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

function loadDiary() {
  const diary = diaryData.diaries.find(
    (item) => item.class === state.selectedClass && item.date === state.selectedDate
  );
  state.diary = diary || null;
  state.filteredPeriods = state.diary ? [...state.diary.periods] : [];
  renderDiary();
  renderSummary();
  renderPrintPreview();
  showMessage(state.diary ? 'Diary loaded successfully' : 'No diary found for selected class and date', 1800, !state.diary);
}

function renderDiary() {
  if (!state.diary) {
    diaryTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Diary data is not available for this class and date.</td></tr>';
    return;
  }
  const rows = state.filteredPeriods.map((entry) => {
    return `
      <tr>
        <td>${entry.period}</td>
        <td>${entry.subject}</td>
        <td>${entry.teacher}</td>
        <td>${escapeHtml(entry.classwork)}</td>
        <td>${escapeHtml(entry.homework)}</td>
      </tr>
    `;
  });
  diaryTableBody.innerHTML = rows.join('');
}

function renderSummary() {
  const periods = state.diary ? state.diary.periods.length : 0;
  const completed = periods;
  const pending = 0;
  const subjects = state.diary ? [...new Set(state.diary.periods.map((entry) => entry.subject))].join(', ') : '-';
  const teachers = state.diary ? [...new Set(state.diary.periods.map((entry) => entry.teacher))].join(', ') : '-';

  infoClass.textContent = state.diary ? state.diary.class : state.selectedClass;
  infoDate.textContent = state.selectedDate ? formatDisplayDate(state.selectedDate) : '-';
  infoPeriods.textContent = periods;
  infoCompleted.textContent = completed;
  infoPending.textContent = pending;
  infoStatus.textContent = state.diary ? '✔ Complete' : 'Incomplete';
  infoStatus.parentElement.className = state.diary ? 'info-block status-block completed' : 'info-block status-block partial';

  summaryPeriods.textContent = periods;
  summaryCompleted.textContent = completed;
  summaryPending.textContent = pending;
  summarySubjects.textContent = subjects;
  summaryTeachers.textContent = teachers;
}

function renderPrintPreview() {
  const classesLabel = state.diary ? state.diary.class : state.selectedClass;
  const dateLabel = state.selectedDate ? formatDisplayDate(state.selectedDate) : '-';
  const rows = [
    '<div class="preview-header">',
    '<div class="preview-logo"><i class="fa-solid fa-school"></i></div>',
    '<div class="preview-title">',
    '<h3>Daily Class Log Diary</h3>',
    '<p>Class Daily Log Diary for school records</p>',
    '</div>',
    '</div>',
    '<div class="preview-meta">',
    `<span><strong>Class :</strong> ${classesLabel}</span>`,
    `<span><strong>Date :</strong> ${dateLabel}</span>`,
    '</div>'
  ];

  if (!state.diary) {
    rows.push('<div class="preview-empty-state">Diary data is not available for the selected class and date.</div>');
  } else {
    rows.push('<table class="preview-table">');
    rows.push('<thead><tr><th>Period</th><th>Subject</th><th>Teacher</th><th>Classwork</th><th>Homework</th></tr></thead>');
    rows.push('<tbody>');
    state.diary.periods.forEach((entry) => {
      rows.push(`
        <tr>
          <td>${entry.period}</td>
          <td>${entry.subject}</td>
          <td>${entry.teacher}</td>
          <td>${escapeHtml(entry.classwork)}</td>
          <td>${escapeHtml(entry.homework)}</td>
        </tr>
      `);
    });
    rows.push('</tbody></table>');
  }

  printPreview.innerHTML = rows.join('');
}

function handleSearch(event) {
  const query = event.target.value.trim().toLowerCase();
  if (!state.diary) {
    return;
  }
  state.filteredPeriods = state.diary.periods.filter((entry) => {
    return entry.teacher.toLowerCase().includes(query) || entry.subject.toLowerCase().includes(query);
  });
  renderDiary();
}

function openPrintModal() {
  reportMeta.textContent = `Class: ${state.selectedClass} | Date: ${formatDisplayDate(state.selectedDate)}`;
  reportContent.innerHTML = buildModalPreview();
  reportModal.classList.remove('hidden');
  reportModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePrintModal() {
  reportModal.classList.add('hidden');
  reportModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function buildModalPreview() {
  if (!state.diary) {
    return '<p class="preview-empty-state">Diary data is not available for the selected class and date.</p>';
  }

  const rows = [
    '<div class="modal-preview-shell">',
    '<div class="modal-preview-header">',
    '<div class="preview-logo"><i class="fa-solid fa-school"></i></div>',
    '<div class="preview-title">',
    '<h3>Daily Class Log Diary</h3>',
    '<p>Class: ' + state.diary.class + '</p>',
    '<p>Date: ' + formatDisplayDate(state.diary.date) + '</p>',
    '</div>',
    '</div>',
    '<table class="preview-table">',
    '<thead><tr><th>Period</th><th>Subject</th><th>Teacher</th><th>Classwork</th><th>Homework</th></tr></thead>',
    '<tbody>'
  ];

  state.diary.periods.forEach((entry) => {
    rows.push(`
      <tr>
        <td>${entry.period}</td>
        <td>${entry.subject}</td>
        <td>${entry.teacher}</td>
        <td>${escapeHtml(entry.classwork)}</td>
        <td>${escapeHtml(entry.homework)}</td>
      </tr>
    `);
  });

  rows.push('</tbody></table></div>');
  return rows.join('');
}

function showMessage(message, duration = 1600, isError = false) {
  messageBanner.textContent = message;
  messageBanner.style.background = isError ? '#dc2626' : 'rgba(37, 99, 235, 0.95)';
  messageBanner.classList.remove('hidden');
  clearTimeout(window.messageTimeout);
  window.messageTimeout = setTimeout(() => {
    messageBanner.classList.add('hidden');
  }, duration);
}

function formatDisplayDate(dateString) {
  const parsed = new Date(dateString);
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function escapeHtml(value) {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

initDiaryPage();
