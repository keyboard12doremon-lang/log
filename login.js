const teacherPasswords = {
  "Shweta  Ma'am": "7562968711",
  "Ranvijay Sir": "9507248376",
  "Ragini Ma'am": "9110966592",
  "Shashank Sir": "9430674236",
  "Deeksha Ma'am": "9234887661",
  "Smita Ma'am": "8409188970",
  "Girish Sir": "7070767911",
  "Amarjeet Sir": "7562968711",
  "Aayush Sir": "9229726349",
  "Aisha Ma'am": "7562968711",
  "Suman Sir": "7562968711",
  "Sarita Ma'am": "7562968711",
  "Raj Laxmi Ma'am": "7562968711",
  "Nikki Ma'am": "7562968711",
  "Sunita Ma'am": "7562968711",
  "Priyanka Ma'am": "7562968711",
  "Kanchan Ma'am": "7562968711",
  "Khushboo Ma'am": "7562968711",
  "Sneha Ma'am": "7562968711",
  "Vaishnavi Ma'am": "7562968711"
};
const adminPassword = 'admin123';


const teacherSelect = document.getElementById("teacherName");

Object.keys(teacherPasswords).forEach(name => {
    teacherSelect.add(new Option(name, name));
});

document.getElementById('adminLoginBtn').addEventListener('click', () => {
  const pw = document.getElementById('adminPassword').value.trim();
  const err = document.getElementById('adminError');
  if (!pw) return showBanner(err, 'Password required');
  if (pw === adminPassword) {
    window.location.href = 'admin.html';
    return;
  }
  showBanner(err, 'Invalid Administrator Password');
});

document.getElementById("teacherLoginBtn").addEventListener("click", () => {
  const name = document.getElementById("teacherName").value;
  const pw = document.getElementById("teacherPassword").value.trim();
  const err = document.getElementById("teacherError");

  if (!name) {
    return showBanner(err, "Please select a teacher.");
  }

  if (!pw) {
    return showBanner(err, "Password required.");
  }

  // Validate teacher password
  if (teacherPasswords[name] && teacherPasswords[name] === pw) {

    // Store only teacher name.
    // Class teacher information will come from the backend.
    sessionStorage.setItem("teacherName", name);

    window.location.href = "teacher.html";
    return;
  }

  showBanner(err, "Invalid Teacher Password.");
});
function showBanner(el, msg, ms = 2000) {
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), ms);
}
