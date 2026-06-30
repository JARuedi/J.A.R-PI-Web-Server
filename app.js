/* ============================================================
   app.js  —  Digital Planner
   Sections:
     1. App  — view routing, auth, sidebar
     2. Calendar  — rendering, tasks, modal
============================================================ */

/* ============================================================
   1. APP — VIEW ROUTING & AUTH
============================================================ */
const App = (() => {
  /* --- View switching --- */
  function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(id);
    if (!target) return;
    target.classList.add('active');

    // Trigger slide-in animation for home view
    if (id === 'view-home') {
      // slight delay so CSS transition kicks in after display:flex
      requestAnimationFrame(() => requestAnimationFrame(() => {
        target.classList.add('slide-in');
      }));
      loadWelcomeMessage();
      Calendar.init();
    }
  }

  /* --- Auth helpers --- */
  function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  }

  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function clearError(elementId) {
    const el = document.getElementById(elementId);
    el.textContent = '';
    el.classList.add('hidden');
  }

  /* --- Login --- */
  /* --- Login --- */
function login() {
  clearError('login-error');
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const stored   = getStoredUser();

  if (!email || !password) {
    return showError('login-error', 'Please fill in all fields.');
  }
  if (stored && stored.email === email && stored.password === password) {
    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).catch(err => console.error('Logging error:', err));

    showView('view-home');
  } else {
    showError('login-error',
      'Incorrect email or password. ' +
      '<a href="#" onclick="App.showView(\'view-forgot-pw\')">Forgot password?</a> · ' +
      '<a href="#" onclick="App.showView(\'view-forgot-username\')">Forgot username?</a>'
    );
  }
}

  /* --- Register --- */
  function register() {
    clearError('reg-error');
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;

    if (!email || !password || !confirm) {
      return showError('reg-error', 'Please fill in all fields.');
    }
    if (password !== confirm) {
      return showError('reg-error', 'Passwords do not match.');
    }
    localStorage.setItem('user', JSON.stringify({ email, password }));
    alert('Account created successfully!');
    showView('view-login');
  }

  /* --- Forgot password (stub) --- */
  function forgotPassword() {
    const email = document.getElementById('forgot-pw-email').value.trim();
    if (!email) return alert('Please enter your email address.');
    alert(`If an account exists for ${email}, a reset link has been sent.`);
    showView('view-login');
  }

  /* --- Forgot username (stub) --- */
  function forgotUsername() {
    const email = document.getElementById('forgot-user-email').value.trim();
    if (!email) return alert('Please enter your email address.');
    alert(`If an account exists for ${email}, your username has been sent.`);
    showView('view-login');
  }

  /* --- Sign out --- */
  function signOut() {
    localStorage.removeItem('user');
    // Reset home view animation so it plays again next login
    const home = document.getElementById('view-home');
    home.classList.remove('slide-in');
    showView('view-login');
    toggleSidebar(true); // force close
  }

  /* --- Sidebar --- */
  function toggleSidebar(forceClose = false) {
    const sidebar  = document.getElementById('sidebarMenu');
    const overlay  = document.getElementById('sidebarOverlay');
    const isOpen   = sidebar.classList.contains('open');

    if (forceClose || isOpen) {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    } else {
      sidebar.classList.add('open');
      overlay.classList.add('visible');
    }
  }

  /* --- Welcome message --- */
  function loadWelcomeMessage() {
    const stored = getStoredUser();
    const el = document.getElementById('welcomeMessage');
    if (!el) return;

    if (stored && stored.name) {
      el.textContent = `Welcome, ${stored.name}`;
    } else if (stored && stored.email) {
      const name = stored.email.split('@')[0];
      el.textContent = `Welcome, ${name.charAt(0).toUpperCase() + name.slice(1)}`;
    } else {
      el.textContent = 'Welcome!';
    }
  }

  /* --- Allow Enter key on auth inputs --- */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const active = document.querySelector('.view.active');
    if (!active) return;
    const id = active.id;
    if (id === 'view-login')           login();
    else if (id === 'view-register')   register();
    else if (id === 'view-forgot-pw')  forgotPassword();
    else if (id === 'view-forgot-username') forgotUsername();
  });

  /* Public API */
  return { showView, login, register, forgotPassword, forgotUsername, signOut, toggleSidebar };

})();


/* ============================================================
   2. CALENDAR — RENDERING & TASK MANAGEMENT
============================================================ */
const Calendar = (() => {

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  let currentDate = new Date();

  /* ---- Public init (called when home view is shown) ---- */
  function init() {
    currentDate = new Date();
    render(currentDate);
  }

  /* ---- Navigation ---- */
  function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    render(currentDate, 'prev');
  }

  function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    render(currentDate, 'next');
  }

  /* ---- Main render ---- */
  function render(date, direction = null) {
    const year  = date.getFullYear();
    const month = date.getMonth();

    document.getElementById('monthYear').textContent = `${MONTH_NAMES[month]} ${year}`;
    renderTaskList(year, month);

    const grid = buildGrid(year, month);

    const slide = document.getElementById('calendarSlide');

    if (direction) {
      slide.appendChild(grid);
      slide.style.transition = 'transform 0.4s ease';
      slide.style.transform  = direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)';

      setTimeout(() => {
        slide.innerHTML = '';
        slide.style.transition = 'none';
        slide.style.transform  = 'translateX(0)';
        slide.appendChild(grid);
      }, 400);
    } else {
      slide.innerHTML = '';
      slide.appendChild(grid);
    }
  }

  /* ---- Build calendar grid element ---- */
  function buildGrid(year, month) {
    const grid = document.createElement('div');
    grid.className = 'calendar';

    // Day-name headers
    DAY_NAMES.forEach(name => {
      const d = document.createElement('div');
      d.className = 'day';
      d.textContent = name;
      grid.appendChild(d);
    });

    // Empty cells before first day
    const firstDay     = new Date(year, month, 1).getDay();
    const daysInMonth  = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'date-cell';
      grid.appendChild(empty);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      grid.appendChild(buildDayCell(year, month, day));
    }

    return grid;
  }

  /* ---- Build a single day cell ---- */
  function buildDayCell(year, month, day) {
    const dateKey   = makeKey(year, month, day);
    const savedTask = localStorage.getItem(dateKey);

    const cell = document.createElement('div');
    cell.className = 'date-cell';
    cell.textContent = day;

    // Task dot
    if (savedTask) {
      const dot = document.createElement('div');
      dot.className = 'task-indicator';
      cell.appendChild(dot);
    }

    // + icon (always shown on hover)
    const plus = document.createElement('div');
    plus.className = 'plus-icon';
    plus.textContent = '+';
    plus.addEventListener('click', () => openModal(year, month, day, dateKey, false));
    cell.appendChild(plus);

    // Edit / Delete icons (only when task exists)
    if (savedTask) {
      const edit = document.createElement('div');
      edit.className = 'edit-icon';
      edit.textContent = '✎';
      edit.addEventListener('click', () => openModal(year, month, day, dateKey, true));
      cell.appendChild(edit);

      const trash = document.createElement('div');
      trash.className = 'trashcan-icon';
      trash.textContent = '−';
      trash.addEventListener('click', () => deleteTask(dateKey));
      cell.appendChild(trash);
    }

    return cell;
  }

  /* ---- Task list panel ---- */
  function renderTaskList(year, month) {
    const header = document.getElementById('taskHeader');
    const list   = document.getElementById('monthlyTasks');
    header.textContent = `Tasks for ${MONTH_NAMES[month]}`;
    list.innerHTML = '';

    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix) && !k.endsWith('-dueDate'))
      .sort()
      .forEach(key => {
        const task    = localStorage.getItem(key);
        const dueDate = localStorage.getItem(`${key}-dueDate`);
        const [y, m, d] = key.split('-');

        const li = document.createElement('li');
        li.textContent = `${m}/${d}/${y}: ${task}`;

        if (dueDate) {
          const span = document.createElement('span');
          span.textContent = ` (Due: ${dueDate})`;
          span.style.color = '#FF6347';
          li.appendChild(span);
        }
        list.appendChild(li);
      });
  }

  /* ---- Modal helpers ---- */
  function openModal(year, month, day, dateKey, isEdit) {
    const modal    = document.getElementById('taskModal');
    const label    = document.getElementById('selectedDateLabel');
    const input    = document.getElementById('taskInput');
    const dueInput = document.getElementById('dueDateInput');

    label.textContent        = `${isEdit ? 'Edit' : 'Add'} Task — ${MONTH_NAMES[month]} ${day}, ${year}`;
    input.value              = isEdit ? (localStorage.getItem(dateKey) || '') : '';
    dueInput.value           = isEdit ? (localStorage.getItem(`${dateKey}-dueDate`) || '') : '';
    dueInput.style.display   = isEdit && dueInput.value ? 'block' : 'none';
    input.dataset.dateKey    = dateKey;

    modal.classList.add('open');
    input.focus();
  }

  function closeModal() {
    document.getElementById('taskModal').classList.remove('open');
  }

  function closeModalOnOverlay(e) {
    if (e.target === document.getElementById('taskModal')) closeModal();
  }

  function showDueDate() {
    document.getElementById('dueDateInput').style.display = 'block';
  }

  /* ---- Save / Delete ---- */
  function saveTask() {
    const input   = document.getElementById('taskInput');
    const dueDate = document.getElementById('dueDateInput').value.trim();
    const key     = input.dataset.dateKey;
    const task    = input.value.trim();

    if (task) {
      localStorage.setItem(key, task);
      if (dueDate) localStorage.setItem(`${key}-dueDate`, dueDate);
      else         localStorage.removeItem(`${key}-dueDate`);
    } else {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}-dueDate`);
    }

    closeModal();
    render(currentDate);
  }

  function deleteTask(dateKey) {
    localStorage.removeItem(dateKey);
    localStorage.removeItem(`${dateKey}-dueDate`);
    render(currentDate);
  }

  /* ---- Utility ---- */
  function makeKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /* Public API */
  return { init, prevMonth, nextMonth, saveTask, deleteTask, closeModal, closeModalOnOverlay, showDueDate };

})();
