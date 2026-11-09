/* ==========================================================
   THE GLOBALPATH — index.js
   ⚠️ TEST MODE: localStorage (NO Firebase, NO Python)
   Pages: public | login | signup | student | admin
   
   ⭐ PROFESSIONAL ADMIN PORTAL — 14 SECTIONS
   - Dashboard with KPIs + Chart.js (4 charts)
   - Students (clickable → 10-tab profile)
   - Applications Management
   - Services Management
   - Bookings (progress modal + payment verify)
   - Documents Management
   - Notifications (individual + broadcast)
   - Contact Messages
   - Consultants Management
   - Tasks & Follow-ups
   - Calendar & Deadlines
   - Reports & Analytics
   - Activity Logs (Audit Trail)
   - Settings (Firebase-ready)
   - Global Search
   ========================================================== */

(function () {
  'use strict';

  /* ==========================================================
     1. CONSTANTS
     ========================================================== */
  const LEVEL_LABELS = { UG: 'Undergraduate', Grad: 'Graduate', PhD: 'PhD' };

  const STATUS_COLORS = {
    'new': '#60a5fa',
    'pending-verification': '#fbbf24',
    'in-progress': '#60a5fa',
    'completed': '#34d399',
    'cancelled': '#f87171'
  };

  const STATUS_LABELS = {
    'new': 'Booked',
    'pending-verification': 'Pending Verification',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };

  const STATUS_APPLICATION_LABELS = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'under-review': 'Under Review',
    'documents-pending': 'Documents Pending',
    'submitted': 'Submitted',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'on-hold': 'On Hold'
  };

  const DEFAULT_STEPS = [
    'Booking Confirmed',
    'Payment Verified',
    'Documents Received',
    'Work in Progress',
    'Completed'
  ];

  const DEFAULT_SERVICES = [
    { id: '01', name: 'Consultation Session', price: '1,500 PKR', active: true },
    { id: '02', name: 'Personal Statement Review', price: '2,000-3,000 PKR', active: true },
    { id: '03', name: 'Personal Statement Writing', price: '3,000-6,000 PKR', active: true },
    { id: '04', name: 'Study Plan Review', price: '2,000-3,000 PKR', active: true },
    { id: '05', name: 'Study Plan Writing', price: '3,000-6,000 PKR', active: true },
    { id: '06', name: 'LOR Review', price: '1,000-2,000 PKR', active: true },
    { id: '07', name: 'LOR Draft Writing', price: '2,000-3,500 PKR', active: true },
    { id: '08', name: 'CV / Resume Review', price: '1,000-1,500 PKR', active: true },
    { id: '09', name: 'CV / Resume Writing', price: '1,500-2,000 PKR', active: true },
    { id: '10', name: 'Complete Guidance (1 Month)', price: '6,000-8,000 PKR', active: true },
    { id: '11', name: 'Profile Review (Docs Only)', price: '8,000-10,000 PKR', active: true },
    { id: '12', name: 'Overall Profile Assessment', price: '15,000-18,000 PKR', active: true },
    { id: '13', name: 'Application Submission', price: '10,000-12,000 PKR', active: true },
    { id: '14', name: 'Documents Review + Submission', price: '18,000-20,000 PKR', active: true },
    { id: '15', name: 'Complete End-to-End Support', price: '24,000-35,000 PKR', active: true }
  ];

  /* ==========================================================
     2. STORAGE KEYS
     ========================================================== */
  const K = {
    students: 'tgp_students',
    currentStudent: 'tgp_current_student',
    bookings: 'tgp_bookings',
    docs: 'tgp_documents',
    notifs: 'tgp_notifications',
    messages: 'tgp_contact_messages',
    theme: 'tgp_theme'
  };

  const NEW_ADMIN_K = {
    applications: 'tgp_applications',
    consultants: 'tgp_consultants',
    tasks: 'tgp_tasks',
    events: 'tgp_events',
    activityLogs: 'tgp_activity_logs',
    services: 'tgp_services'
  };

  /* ==========================================================
     3. STORAGE HELPERS
     ========================================================== */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error('Storage write failed:', key, e); }
  }

  /* ==========================================================
     4. UTILITIES
     ========================================================== */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const on = (s, e, f) => { const el = $(s); if (el) el.addEventListener(e, f); };

  function getPageType() { return document.body?.dataset?.page || 'public'; }

  function formatDate(ts) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleDateString(); } catch { return '—'; }
  }

  function formatDateTime(ts) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString(); } catch { return ''; }
  }

  function genId(prefix) {
    return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function showAuthMsg(text, isError = false) {
    const el = $('#authMessage');
    if (!el) return;
    el.textContent = text;
    el.style.color = isError ? '#f87171' : 'var(--gold-400)';
  }

  function getSessionStudent() {
    const id = localStorage.getItem(K.currentStudent);
    if (!id) return null;
    return read(K.students, []).find(s => s.id === id) || null;
  }

  function clearSession() {
    localStorage.removeItem(K.currentStudent);
  }

  /* ==========================================================
     5. THEME TOGGLE
     ========================================================== */
  (function initTheme() {
    const saved = localStorage.getItem(K.theme) || 'dark';
    document.body.dataset.theme = saved;

    function updateUI(theme) {
      const label = $('#themeLabel');
      const icon = $('#themeIcon');
      if (!label || !icon) return;
      if (theme === 'light') {
        label.textContent = 'Light Mode';
        icon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>';
      } else {
        label.textContent = 'Dark Mode';
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      }
    }
    updateUI(saved);

    on('#themeToggleBtn', 'click', () => {
      const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = next;
      localStorage.setItem(K.theme, next);
      updateUI(next);
    });
  })();

  /* ==========================================================
     6. SCROLL TO TOP + PROGRESS CIRCLE
     ========================================================== */
  (function initScrollTop() {
    const btn = $('#scrollTopBtn');
    const bar = $('#scrollProgressBar');
    if (!btn || !bar) return;

    const C = 2 * Math.PI * 21;
    bar.style.strokeDasharray = C;
    bar.style.strokeDashoffset = C;

    let ticking = false;
    function update() {
      const s = window.scrollY || 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(s / h, 1) : 0;
      bar.style.strokeDashoffset = C * (1 - p);
      btn.classList.toggle('visible', s > 200);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    update();
  })();

  /* ==========================================================
     7. MENU TOGGLE
     ========================================================== */
  (function initMenu() {
    const t = $('.menu-toggle'), n = $('.site-nav');
    if (!t || !n) return;
    t.addEventListener('click', () => {
      const open = n.classList.toggle('open');
      t.classList.toggle('open', open);
      t.setAttribute('aria-expanded', open);
    });
    n.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
      if (window.innerWidth <= 720) { n.classList.remove('open'); t.classList.remove('open'); }
    }));
  })();

  /* ==========================================================
     8. CONTACT FORM
     ========================================================== */
  (function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      if (!name || !email) return;

      const msgs = read(K.messages, []);
      msgs.push({
        id: genId('msg'), name, email,
        service: (data.get('service') || '').toString(),
        message: (data.get('message') || '').toString().trim(),
        read: false, createdAt: Date.now()
      });
      write(K.messages, msgs);

      const m = $('#formMessage');
      if (m) {
        m.textContent = `Thanks, ${name}! We'll reach out shortly.`;
        m.style.color = 'var(--gold-400)';
      }
      form.reset();
    });
  })();

  /* ==========================================================
     9. ADMIN — CREDENTIALS & STATE
     ========================================================== */
  const ADMIN_CREDENTIALS = {
    email: 'theglobalpath@gmail.com',
    password: 'madam'
  };

  const ADMIN_SESSION_KEY = 'tgp_current_admin';

  let adminSidebarInitialized = false;
  let adminDashboardInitialized = false;
  let adminEventsBound = false;
  let adminDataRendered = false;

  function isAdminLoggedIn() {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  }

  function setAdminSession() {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  }

  function clearAdminSession() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  /* ==========================================================
     10. ADMIN PAGE BOOT
     ========================================================== */
  if (getPageType() === 'admin') {
    initAdminPage();
  }

  function initAdminPage() {
    const loadingEl = $('#adminLoading');
    const authEl = $('#adminAuth');
    const dashEl = $('#adminDashboard');
    const authMsg = $('#authMessage');

    if (!authEl || !dashEl) {
      console.error('Admin page: missing elements');
      return;
    }

    if (loadingEl) loadingEl.style.display = 'none';

    if (isAdminLoggedIn()) {
      authEl.classList.add('hidden');
      dashEl.classList.remove('hidden');
      initAdminDashboard();
    } else {
      authEl.classList.remove('hidden');
      dashEl.classList.add('hidden');
    }

    const loginForm = $('#adminLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = (loginForm.email.value || '').trim().toLowerCase();
        const password = loginForm.password.value;
        const btn = $('#adminLoginBtn');

        if (!email || !password) {
          if (authMsg) {
            authMsg.textContent = 'Please fill in both fields.';
            authMsg.style.color = '#f87171';
          }
          return;
        }

        if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
          if (authMsg) {
            authMsg.textContent = '❌ Invalid admin credentials.';
            authMsg.style.color = '#f87171';
          }
          return;
        }

        if (btn) { btn.disabled = true; btn.textContent = 'Logging in…'; }
        setAdminSession();

        if (authMsg) {
          authMsg.textContent = '✅ Login successful.';
          authMsg.style.color = 'var(--gold-400)';
        }

        authEl.classList.add('hidden');
        dashEl.classList.remove('hidden');
        loginForm.reset();
        initAdminDashboard();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (btn) {
          btn.disabled = false;
          btn.textContent = '🔒 Secure Login';
        }
      });
    }

    on('#logoutBtn', 'click', () => {
      clearAdminSession();
      adminSidebarInitialized = false;
      adminDashboardInitialized = false;
      adminEventsBound = false;
      adminDataRendered = false;
      if (messagesObserver) { messagesObserver.disconnect(); messagesObserver = null; }

      authEl.classList.remove('hidden');
      dashEl.classList.add('hidden');
      if (authMsg) {
        authMsg.textContent = 'Logged out successfully.';
        authMsg.style.color = 'var(--gold-400)';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ==========================================================
     11. ADMIN DASHBOARD — INIT
     ========================================================== */
  function initAdminDashboard() {
    if (!adminSidebarInitialized) {
      initAdminSidebarToggle();
      adminSidebarInitialized = true;
    }

    if (!adminDashboardInitialized) {
      initAdminSidebarNav();
      adminDashboardInitialized = true;
    }

    if (!adminDataRendered) {
      renderAdminOverview();
      renderAdminStudents();
      renderAdminBookings();
      renderAdminDocuments();
      renderDocumentsStudentFilter();
      renderAdminMessages();
      renderAdminStudentsDropdown();
      renderAdminSentNotifs();
      adminDataRendered = true;
    } else {
      renderAdminOverview();
    }

    bindAdminEvents();
    initMessagesSeenObserver();
    initAdminNewSections();
  }

  function initAdminSidebarToggle() {
    const sidebar = document.getElementById('portalSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const openBtn = document.getElementById('sidebarOpenBtn');
    const closeBtn = document.getElementById('sidebarCloseBtn');
    if (!sidebar || !overlay) return;

    function openSb() {
      sidebar.classList.add('open');
      overlay.classList.add('open');
      document.body.classList.add('sidebar-open');
    }
    function closeSb() {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }

    if (openBtn) openBtn.addEventListener('click', openSb);
    if (closeBtn) closeBtn.addEventListener('click', closeSb);
    overlay.addEventListener('click', closeSb);

    sidebar.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 820) setTimeout(closeSb, 250);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSb();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 820 && sidebar.classList.contains('open')) closeSb();
    });
  }

  function initAdminSidebarNav() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.dataset.scroll);
        if (target) {
          const headerH = 76 + 20;
          window.scrollTo({ top: target.offsetTop - headerH, behavior: 'smooth' });

          if (link.dataset.scroll === 'messagesSection') {
            setTimeout(markAllMessagesRead, 500);
          }
        }
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  /* ==========================================================
     12. ADMIN EVENTS (existing)
     ========================================================== */
  let adminScrollBound = false;

  function bindAdminEvents() {
    if (adminEventsBound) return;
    adminEventsBound = true;

    on('#studentSearch', 'input', debounce(renderAdminStudents, 300));
    on('#studentLevelFilter', 'change', renderAdminStudents);

    on('#bookingSearch', 'input', debounce(renderAdminBookings, 300));
    on('#bookingStatusFilter', 'change', renderAdminBookings);

    on('#documentSearch', 'input', debounce(renderAdminDocuments, 300));
    on('#documentStudentFilter', 'change', renderAdminDocuments);

    const notifForm = $('#sendNotificationForm');
    if (notifForm) {
      notifForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentId = $('#notifStudent').value;
        const title = ($('#notifTitle').value || '').trim();
        const message = ($('#notifMessage').value || '').trim();
        const category = ($('#notifCategory')?.value || 'announcement');
        const priority = ($('#notifPriority')?.value || 'normal');
        const statusEl = $('#notifStatus');

        if (!studentId || !title || !message) {
          if (statusEl) {
            statusEl.textContent = 'Please fill in all fields.';
            statusEl.style.color = '#f87171';
          }
          return;
        }

        const students = read(K.students, []);
        const targets = studentId === '__ALL__' ? students : students.filter(s => s.id === studentId);

        if (targets.length === 0) {
          if (statusEl) {
            statusEl.textContent = 'No students to notify.';
            statusEl.style.color = '#f87171';
          }
          return;
        }

        const notifs = read(K.notifs, []);
        targets.forEach(student => {
          notifs.push({
            id: genId('nt'),
            userId: student.id,
            title,
            message,
            category,
            priority,
            read: false,
            sentBy: 'admin',
            createdAt: Date.now()
          });
        });
        write(K.notifs, notifs);

        if (statusEl) {
          statusEl.textContent = `✅ Notification sent to ${targets.length} student${targets.length > 1 ? 's' : ''}!`;
          statusEl.style.color = '#34d399';
        }
        notifForm.reset();
        renderAdminOverview();
        renderAdminSentNotifs();
        addActivityLog('Notification sent', `${title} (${targets.length} recipients)`, 'notification');
        setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 4000);
      });
    }

    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-close-progress]')) closeProgressModal();
      if (e.target.matches('[data-close-proof]')) closePaymentProofModal();
      if (e.target.matches('[data-close-student-profile]')) closeStudentProfileModal();
    });

    const slider = document.getElementById('progressSlider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) || 0;
        const previewFill = document.getElementById('progressPreviewFill');
        const previewValue = document.getElementById('progressPreviewValue');
        if (previewFill) previewFill.style.width = val + '%';
        if (previewValue) previewValue.textContent = val + '%';
        updateProgressPreviewColor(val);
      });
    }

    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.preset);
        const slider = document.getElementById('progressSlider');
        const previewFill = document.getElementById('progressPreviewFill');
        const previewValue = document.getElementById('progressPreviewValue');
        if (slider) slider.value = val;
        if (previewFill) previewFill.style.width = val + '%';
        if (previewValue) previewValue.textContent = val + '%';
        updateProgressPreviewColor(val);
      });
    });

    on('#progressSaveBtn', 'click', saveProgress);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProgressModal();
        closePaymentProofModal();
        closeStudentProfileModal();
        document.getElementById('consultantModal')?.classList.remove('show');
        document.getElementById('taskModal')?.classList.remove('show');
        document.getElementById('eventModal')?.classList.remove('show');
        document.body.style.overflow = '';
      }
    });

    if (!adminScrollBound) {
      adminScrollBound = true;
      window.addEventListener('scroll', debounce(() => {
        if (!isAdminLoggedIn()) return;
        checkMessagesVisibility();
      }, 250), { passive: true });
    }

    window.addEventListener('storage', (e) => {
      if (!isAdminLoggedIn()) return;

      if (e.key === K.students) {
        renderAdminOverview();
        renderAdminStudents();
        renderAdminStudentsDropdown();
        renderDocumentsStudentFilter();
      } else if (e.key === K.bookings) {
        renderAdminOverview();
        renderAdminBookings();
        renderAdminCharts();
      } else if (e.key === K.docs) {
        renderAdminOverview();
        renderAdminDocuments();
      } else if (e.key === K.messages) {
        renderAdminOverview();
        renderAdminMessages();
      } else if (e.key === K.notifs) {
        renderAdminOverview();
        renderAdminSentNotifs();
      }
    });
  }

  /* ==========================================================
     13. ADMIN RENDER — OVERVIEW
     ========================================================== */
  function renderAdminOverview() {
    const students = read(K.students, []);
    const bookings = read(K.bookings, []);
    const messages = read(K.messages, []);
    const notifs = read(K.notifs, []);
    const docs = read(K.docs, []);

    const active = bookings.filter(b => ['new', 'pending-verification', 'in-progress'].includes(b.status));
    const completed = bookings.filter(b => b.status === 'completed');
    const pending = bookings.filter(b => b.status === 'pending-verification');
    const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.amount || 0), 0);
    const unreadMsgs = messages.filter(m => !m.read).length;

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('metricStudents', students.length);
    setText('metricBookings', bookings.length);
    setText('metricActive', active.length);
    setText('metricCompleted', completed.length);
    setText('metricRevenue', revenue.toLocaleString());
    setText('metricPending', pending.length);
    setText('metricMessages', unreadMsgs);
    setText('metricNotifs', notifs.length);
    setText('metricDocs', docs.length);

    setText('studentsCount', students.length);
    setText('bookingsCount', bookings.length);
    setText('studentsTag', `${students.length} registered`);
    setText('bookingsTag', `${bookings.length} total`);
    setText('messagesTag', `${messages.length} total`);
    setText('documentsTag', `${docs.length} files`);

    const msgBadge = document.getElementById('messagesCount');
    if (msgBadge) {
      msgBadge.textContent = unreadMsgs;
      msgBadge.hidden = unreadMsgs === 0;
      if (unreadMsgs > 0) msgBadge.classList.add('badge-pulse');
      else msgBadge.classList.remove('badge-pulse');
    }

    const docsBadge = document.getElementById('documentsCount');
    if (docsBadge) {
      docsBadge.textContent = docs.length;
      docsBadge.hidden = docs.length === 0;
    }

    renderRecentActivity(students, bookings, messages, notifs);
    renderPendingActions(pending, unreadMsgs, bookings);
    renderTopServices(bookings);
    renderRevenueChart(bookings);
    updateAdminKPIs();
  }

  function renderRecentActivity(students, bookings, messages, notifs) {
    const container = document.getElementById('recentActivityList');
    if (!container) return;

    const events = [];
    students.slice(-3).forEach(s => events.push({ icon: '👤', text: `New student: ${s.name}`, time: s.createdAt }));
    bookings.slice(-3).forEach(b => events.push({ icon: '📋', text: `New booking: ${b.service}`, time: b.createdAt }));
    messages.slice(-2).forEach(m => events.push({ icon: '💬', text: `Message from ${m.name}`, time: m.createdAt }));
    notifs.slice(-2).forEach(n => events.push({ icon: '🔔', text: `Notification: ${n.title}`, time: n.createdAt }));

    events.sort((a, b) => (b.time || 0) - (a.time || 0));
    const recent = events.slice(0, 6);

    if (recent.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding: 1rem;">No activity yet.</div>`;
      return;
    }

    container.innerHTML = recent.map(e => `
      <div style="display: flex; gap: 0.75rem; align-items: center; padding: 0.65rem 0.85rem; background: rgba(212,162,76,0.03); border: 1px solid var(--border); border-radius: 10px;">
        <span style="font-size: 1.1rem;">${e.icon}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.85rem; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.text}</div>
          <div style="font-size: 0.72rem; color: var(--muted);">${formatDateTime(e.time)}</div>
        </div>
      </div>
    `).join('');
  }

  function renderPendingActions(pending, unreadMsgs, bookings) {
    const container = document.getElementById('pendingActionsList');
    if (!container) return;

    const actions = [];
    if (pending.length > 0) {
      actions.push({ icon: '⏳', text: `${pending.length} payment${pending.length > 1 ? 's' : ''} pending verification`, color: '#fbbf24' });
    }
    if (unreadMsgs > 0) {
      actions.push({ icon: '💬', text: `${unreadMsgs} unread message${unreadMsgs > 1 ? 's' : ''}`, color: '#60a5fa' });
    }
    const newBookings = bookings.filter(b => b.status === 'new').length;
    if (newBookings > 0) {
      actions.push({ icon: '📋', text: `${newBookings} new booking${newBookings > 1 ? 's' : ''} to review`, color: '#c084fc' });
    }
    const stalled = bookings.filter(b => {
      if (b.status === 'completed' || b.status === 'cancelled') return false;
      const daysSince = (Date.now() - (b.createdAt || Date.now())) / (1000 * 60 * 60 * 24);
      return daysSince > 7 && (b.progress || 0) < 25;
    }).length;
    if (stalled > 0) {
      actions.push({ icon: '⚠️', text: `${stalled} booking${stalled > 1 ? 's' : ''} need attention`, color: '#f87171' });
    }

    if (actions.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding: 1rem;">✅ All caught up! No pending actions.</div>`;
      return;
    }

    container.innerHTML = actions.map(a => `
      <div style="display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem 0.85rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-left: 3px solid ${a.color}; border-radius: 10px;">
        <span style="font-size: 1.1rem;">${a.icon}</span>
        <div style="flex: 1; font-size: 0.85rem; color: var(--text);">${a.text}</div>
      </div>
    `).join('');
  }

  function renderTopServices(bookings) {
    const container = document.getElementById('topServicesList');
    if (!container) return;

    const serviceCount = {};
    bookings.forEach(b => {
      const s = b.service || 'Unknown';
      serviceCount[s] = (serviceCount[s] || 0) + 1;
    });

    const sorted = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding: 1rem;">No data yet.</div>`;
      return;
    }

    const max = sorted[0][1];
    container.innerHTML = sorted.map(([name, count]) => {
      const pct = Math.round((count / max) * 100);
      return `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.35rem;">
            <span style="color: var(--text); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 65%;">${name}</span>
            <span style="color: var(--gold-400); font-weight: 700;">${count}</span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--gold-500), var(--gold-400)); border-radius: 999px;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderRevenueChart(bookings) {
    const container = document.getElementById('revenueChart');
    if (!container) return;

    const monthlyRevenue = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = 0;
    }

    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const d = new Date(b.createdAt || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += (b.amount || 0);
      }
    });

    const entries = Object.entries(monthlyRevenue);
    const maxRev = Math.max(...entries.map(e => e[1]), 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    container.innerHTML = `
      <div style="display: flex; align-items: flex-end; gap: 0.5rem; height: 140px; padding: 0.5rem 0;">
        ${entries.map(([key, val]) => {
      const [, m] = key.split('-');
      const heightPct = Math.max((val / maxRev) * 100, 4);
      return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; height: 100%;">
              <div style="flex: 1; width: 100%; display: flex; align-items: flex-end;">
                <div style="width: 100%; height: ${heightPct}%; background: linear-gradient(180deg, var(--gold-400), var(--gold-600)); border-radius: 6px 6px 0 0;" title="${val.toLocaleString()} PKR"></div>
              </div>
              <span style="font-size: 0.68rem; color: var(--muted);">${monthNames[parseInt(m) - 1]}</span>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  /* ==========================================================
     14. ADMIN RENDER — STUDENTS
     ========================================================== */
  function renderAdminStudents() {
    const tbody = document.getElementById('studentsBody');
    if (!tbody) return;

    const search = ($('#studentSearch')?.value || '').toLowerCase();
    const level = $('#studentLevelFilter')?.value || '';

    let students = read(K.students, []);
    const bookings = read(K.bookings, []);

    if (search) {
      students = students.filter(s => {
        const text = [s.name, s.email, s.phone, s.country].join(' ').toLowerCase();
        return text.includes(search);
      });
    }
    if (level) {
      students = students.filter(s => s.level === level);
    }

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:2rem;">No students found.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => {
      const studentBookings = bookings.filter(b => b.userId === s.id).length;
      return `
        <tr class="student-row-clickable" data-student-id="${s.id}" title="Click to view full profile">
          <td><strong>${s.name || '—'}</strong></td>
          <td style="font-size:0.85rem;">${s.email || '—'}</td>
          <td style="font-size:0.85rem;">${s.phone || '—'}</td>
          <td>${LEVEL_LABELS[s.level] || s.level || '—'}</td>
          <td><span class="tag" style="font-size: 0.7rem;">${studentBookings}</span></td>
          <td style="font-size:0.82rem; color:var(--muted);">${formatDate(s.createdAt)}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-student-id]').forEach(tr => {
      tr.addEventListener('click', () => {
        openStudentProfileModal(tr.dataset.studentId);
      });
    });
  }

  /* ==========================================================
     15. ADMIN RENDER — BOOKINGS
     ========================================================== */
  function renderAdminBookings() {
    const tbody = document.getElementById('bookingsBody');
    if (!tbody) return;

    const search = ($('#bookingSearch')?.value || '').toLowerCase();
    const status = $('#bookingStatusFilter')?.value || '';

    let bookings = read(K.bookings, []);
    bookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (search) {
      bookings = bookings.filter(b => {
        const text = [b.bookingRef, b.service, b.name, b.educationLevel].join(' ').toLowerCase();
        return text.includes(search);
      });
    }
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--muted); padding:2rem;">No bookings found.</td></tr>`;
      return;
    }

    const studentsArr = read(K.students, []);
    const studentMap = new Map(studentsArr.map(s => [s.id, s]));

    tbody.innerHTML = bookings.map(b => {
      const student = studentMap.get(b.userId);
      const progress = Math.min(Math.max(b.progress || 0, 0), 100);
      const color = STATUS_COLORS[b.status] || '#94a3b8';
      const statusLabel = STATUS_LABELS[b.status] || b.status;
      let barColor = 'linear-gradient(90deg, #d4a24c, #e8c372)';
      if (progress >= 100) barColor = 'linear-gradient(90deg, #34d399, #6ee7b7)';
      else if (progress >= 60) barColor = 'linear-gradient(90deg, #60a5fa, #93c5fd)';

      const methodIcon = { jazzcash: '📱', easypaisa: '📱', bank: '🏦', whatsapp: '💬' }[b.paymentMethod] || '💰';
      const methodLabel = { jazzcash: 'JazzCash', easypaisa: 'EasyPaisa', bank: 'Bank', whatsapp: 'Contact' }[b.paymentMethod] || b.paymentMethod || '—';

      const hasProof = !!(b.paymentProof || b.paymentProofName);
      const needsVerify = b.status === 'pending-verification';

      const proofBtn = hasProof
        ? `<button class="payment-action-btn proof-btn" data-proof-id="${b.id}" title="View payment proof">👁 Proof</button>`
        : `<span style="font-size: 0.72rem; color: var(--muted);">No proof</span>`;

      const verifyBtn = needsVerify
        ? `<button class="payment-action-btn verify-btn" data-verify-id="${b.id}" title="Mark payment as verified">✓ Verify</button>`
        : '';

      let paymentStatusBadge = '';
      if (b.status === 'pending-verification') {
        paymentStatusBadge = `<span class="payment-status-badge pending">⏳ Pending</span>`;
      } else if (b.paymentVerified) {
        paymentStatusBadge = `<span class="payment-status-badge verified">✓ Verified</span>`;
      } else if (b.paymentMethod === 'whatsapp') {
        paymentStatusBadge = `<span class="payment-status-badge contact">💬 Contact</span>`;
      }

      return `
        <tr>
          <td><strong style="color:var(--gold-400); font-family:monospace; font-size:0.8rem;">${b.bookingRef || b.id.substring(0, 8)}</strong></td>
          <td style="font-size:0.85rem;">
            <div style="font-weight:600;">${student?.name || b.name || '—'}</div>
            <div style="font-size:0.75rem; color:var(--muted);">${student?.email || b.email || ''}</div>
          </td>
          <td style="font-size:0.85rem;">${b.service || '—'}</td>
          <td style="font-size:0.85rem; font-weight:600; color: var(--gold-400);">${b.amount ? b.amount.toLocaleString() + ' PKR' : '—'}</td>
          <td style="font-size:0.82rem; min-width: 140px;">
            <div style="margin-bottom: 6px;">
              <span style="font-weight: 600; color: var(--text);">${methodIcon} ${methodLabel}</span>
            </div>
            ${paymentStatusBadge}
            <div style="display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap;">
              ${proofBtn}
              ${verifyBtn}
            </div>
          </td>
          <td style="min-width: 150px;">
            <div class="progress-thumb-admin"
                 data-booking-id="${b.id}"
                 data-progress="${progress}"
                 title="Click to update progress"
                 style="width: 140px; height: 14px; background: rgba(255,255,255,0.12); border: 1px solid rgba(212,162,76,0.4); border-radius: 999px; overflow: hidden; cursor: pointer; margin-bottom: 5px;">
              <div style="width: ${Math.max(progress, 3)}%; height: 100%; background: ${barColor}; border-radius: 999px; transition: width 0.3s ease;"></div>
            </div>
            <span style="font-size: 0.78rem; color: ${progress > 0 ? 'var(--gold-400)' : 'var(--muted)'}; font-weight: 800;">${progress}%</span>
          </td>
          <td>
            <select data-status-id="${b.id}" style="font-size:0.78rem; padding:4px 6px; border-radius:6px; background:rgba(15,24,45,0.9); color:var(--text); border:1px solid var(--border);">
              <option value="new" ${b.status === 'new' ? 'selected' : ''}>Booked</option>
              <option value="pending-verification" ${b.status === 'pending-verification' ? 'selected' : ''}>Pending</option>
              <option value="in-progress" ${b.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td style="font-size:0.82rem; color:var(--muted);">${formatDate(b.createdAt)}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-status-id]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const bookings = read(K.bookings, []);
        const idx = bookings.findIndex(b => b.id === sel.dataset.statusId);
        if (idx === -1) return;
        bookings[idx].status = e.target.value;
        write(K.bookings, bookings);
        renderAdminOverview();
        renderAdminBookings();
        addActivityLog('Booking status changed', `Set to ${e.target.value}`, 'booking');
      });
    });

    tbody.querySelectorAll('.progress-thumb-admin').forEach(el => {
      el.addEventListener('click', () => {
        const bookingId = el.dataset.bookingId;
        const currentProgress = parseInt(el.dataset.progress) || 0;
        const booking = read(K.bookings, []).find(b => b.id === bookingId);
        if (!booking) return;
        const student = studentMap.get(booking.userId);
        const subtitle = `${booking.service || 'Service'} — ${student?.name || booking.name || 'Student'}`;
        openProgressModal(bookingId, currentProgress, subtitle);
      });
    });

    tbody.querySelectorAll('[data-proof-id]').forEach(btn => {
      btn.addEventListener('click', () => openPaymentProofModal(btn.dataset.proofId));
    });

    tbody.querySelectorAll('[data-verify-id]').forEach(btn => {
      btn.addEventListener('click', () => verifyPayment(btn.dataset.verifyId));
    });
  }

  /* ==========================================================
     15.5. ADMIN RENDER — DOCUMENTS
     ========================================================== */
  function renderAdminDocuments() {
    const tbody = document.getElementById('documentsBody');
    if (!tbody) return;

    const search = ($('#documentSearch')?.value || '').toLowerCase();
    const studentFilter = $('#documentStudentFilter')?.value || '';

    const docs = read(K.docs, []);
    const students = read(K.students, []);
    const studentMap = new Map(students.map(s => [s.id, s]));

    let filtered = docs;
    if (search) {
      filtered = filtered.filter(d => {
        const student = studentMap.get(d.userId);
        const text = [d.docName, d.fileName, student?.name, student?.email].join(' ').toLowerCase();
        return text.includes(search);
      });
    }
    if (studentFilter) {
      filtered = filtered.filter(d => d.userId === studentFilter);
    }

    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:2rem;">No documents found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(d => {
      const student = studentMap.get(d.userId);
      const sizeKB = d.fileSize ? Math.round(d.fileSize / 1024) : 0;
      const sizeStr = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';
      return `
        <tr>
          <td>
            <div style="font-weight: 600;">${student?.name || 'Unknown'}</div>
            <div style="font-size: 0.75rem; color: var(--muted);">${student?.email || ''}</div>
          </td>
          <td><strong>${d.docName || 'Document'}</strong></td>
          <td style="font-size: 0.85rem;">📎 ${d.fileName || '—'}</td>
          <td style="font-size: 0.82rem;">${sizeStr}</td>
          <td style="font-size: 0.82rem; color: var(--muted);">${formatDate(d.createdAt)}</td>
          <td>
            ${d.fileDataURL ? `<a href="${d.fileDataURL}" download="${d.fileName || 'document'}" class="payment-action-btn proof-btn" style="text-decoration: none;">⬇ Download</a>` : '<span style="color: var(--muted); font-size: 0.82rem;">—</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderDocumentsStudentFilter() {
    const select = document.getElementById('documentStudentFilter');
    if (!select) return;

    const students = read(K.students, []);
    if (students.length === 0) {
      select.innerHTML = `<option value="">No students</option>`;
      return;
    }

    select.innerHTML = `<option value="">All students</option>` +
      students.map(s => `<option value="${s.id}">${s.name || 'Unnamed'}</option>`).join('');
  }

  /* ==========================================================
     15.6. PROGRESS MODAL
     ========================================================== */
  let currentEditingBookingId = null;

  function openProgressModal(bookingId, currentProgress, subtitle) {
    currentEditingBookingId = bookingId;
    const modal = document.getElementById('progressModal');
    const slider = document.getElementById('progressSlider');
    const previewFill = document.getElementById('progressPreviewFill');
    const previewValue = document.getElementById('progressPreviewValue');
    const subtitleEl = document.getElementById('progressModalSubtitle');

    if (!modal || !slider) return;

    slider.value = currentProgress;
    previewFill.style.width = currentProgress + '%';
    previewValue.textContent = currentProgress + '%';
    if (subtitleEl) subtitleEl.textContent = subtitle || '';

    updateProgressPreviewColor(currentProgress);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function updateProgressPreviewColor(val) {
    const previewFill = document.getElementById('progressPreviewFill');
    const previewValue = document.getElementById('progressPreviewValue');
    if (!previewFill) return;

    let bg = 'linear-gradient(90deg, #d4a24c, #e8c372)';
    let color = 'var(--gold-400)';

    if (val >= 100) {
      bg = 'linear-gradient(90deg, #34d399, #6ee7b7)';
      color = '#34d399';
    } else if (val >= 60) {
      bg = 'linear-gradient(90deg, #60a5fa, #93c5fd)';
      color = '#60a5fa';
    } else if (val === 0) {
      bg = 'linear-gradient(90deg, #94a0bb, #cbd5e1)';
      color = 'var(--muted)';
    }

    previewFill.style.background = bg;
    if (previewValue) previewValue.style.color = color;
  }

  function closeProgressModal() {
    const modal = document.getElementById('progressModal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
    currentEditingBookingId = null;
  }

  function saveProgress() {
    if (!currentEditingBookingId) return;
    const slider = document.getElementById('progressSlider');
    const val = Math.min(Math.max(parseInt(slider.value) || 0, 0), 100);

    const bookings = read(K.bookings, []);
    const idx = bookings.findIndex(b => b.id === currentEditingBookingId);
    if (idx === -1) return;

    bookings[idx].progress = val;
    if (val >= 100) bookings[idx].status = 'completed';
    else if (val > 0 && bookings[idx].status === 'new') bookings[idx].status = 'in-progress';
    write(K.bookings, bookings);

    addActivityLog('Progress updated', `${bookings[idx].service} → ${val}%`, 'booking');

    closeProgressModal();
    renderAdminBookings();
    renderAdminOverview();
    renderAdminCharts();
  }

  /* ==========================================================
     15.7. PAYMENT PROOF MODAL
     ========================================================== */
  function openPaymentProofModal(bookingId) {
    const booking = read(K.bookings, []).find(b => b.id === bookingId);
    if (!booking) return;

    const modal = document.getElementById('paymentProofModal');
    const content = document.getElementById('paymentProofContent');
    const subtitle = document.getElementById('paymentProofSubtitle');
    if (!modal || !content) return;

    if (subtitle) {
      subtitle.textContent = `${booking.service || 'Service'} — ${booking.bookingRef || booking.id.substring(0, 8)} — ${booking.amount ? booking.amount.toLocaleString() + ' PKR' : ''}`;
    }

    if (booking.paymentProof) {
      const isImage = booking.paymentProof.startsWith('data:image');
      if (isImage) {
        content.innerHTML = `
          <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 8px; border: 1px solid var(--border);">
            <img src="${booking.paymentProof}" alt="Payment Proof" style="max-width: 100%; max-height: 60vh; border-radius: 8px; display: block; margin: 0 auto;" />
          </div>
          <p style="margin-top: 0.85rem; color: var(--muted); font-size: 0.82rem; text-align: center;">
            📎 ${booking.paymentProofName || 'Payment screenshot'}
          </p>
        `;
      } else {
        content.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
            <p style="color: var(--muted); margin-bottom: 1rem;">${booking.paymentProofName || 'PDF document'}</p>
            <a href="${booking.paymentProof}" download="${booking.paymentProofName || 'payment-proof'}" class="btn btn-primary">
              ⬇ Download PDF
            </a>
          </div>
        `;
      }
    } else {
      content.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <p style="color: var(--muted); font-weight: 600; margin-bottom: 0.5rem;">No payment proof uploaded</p>
          <p style="color: var(--muted); font-size: 0.85rem;">
            ${booking.paymentProofName ? `File name: ${booking.paymentProofName}` : 'Student did not upload a screenshot.'}
          </p>
        </div>
      `;
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closePaymentProofModal() {
    const modal = document.getElementById('paymentProofModal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  /* ==========================================================
     15.8. VERIFY PAYMENT
     ========================================================== */
  function verifyPayment(bookingId) {
    const booking = read(K.bookings, []).find(b => b.id === bookingId);
    if (!booking) return;

    if (!confirm(`Mark payment as verified for ${booking.bookingRef || 'this booking'}?\n\nStatus will change to "In Progress".`)) return;

    const bookings = read(K.bookings, []);
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return;

    bookings[idx].status = 'in-progress';
    bookings[idx].paymentVerified = true;
    bookings[idx].paymentVerifiedAt = Date.now();
    write(K.bookings, bookings);

    const notifs = read(K.notifs, []);
    notifs.push({
      id: genId('nt'),
      userId: booking.userId,
      title: '✅ Payment Verified',
      message: `Your payment for ${booking.service || 'your service'} has been verified. Work will start soon.`,
      read: false,
      sentBy: 'admin',
      createdAt: Date.now()
    });
    write(K.notifs, notifs);

    addActivityLog('Payment verified', `${booking.service} — ${booking.amount} PKR`, 'payment');

    renderAdminBookings();
    renderAdminOverview();
    renderAdminSentNotifs();
  }

  /* ==========================================================
     15.9. MESSAGES SEEN TRACKING
     ========================================================== */
  let messagesObserver = null;

  function initMessagesSeenObserver() {
    if (messagesObserver) {
      messagesObserver.disconnect();
      messagesObserver = null;
    }

    const section = document.getElementById('messagesSection');
    if (!section) return;

    messagesObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
          markAllMessagesRead();
        }
      });
    }, {
      threshold: [0, 0.1, 0.3, 0.5, 0.75, 1],
      rootMargin: '0px 0px -50px 0px'
    });

    messagesObserver.observe(section);
    setTimeout(checkMessagesVisibility, 500);
  }

  function checkMessagesVisibility() {
    const section = document.getElementById('messagesSection');
    if (!section) return;

    const messages = read(K.messages, []);
    const unreadCount = messages.filter(m => !m.read).length;
    if (unreadCount === 0) return;

    const rect = section.getBoundingClientRect();
    if (rect.height === 0) return;

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(viewportHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;

    if (visibleRatio >= 0.15 || visibleHeight >= 200) {
      markAllMessagesRead();
    }
  }

  function markAllMessagesRead() {
    const msgs = read(K.messages, []);
    let changed = false;
    msgs.forEach(m => {
      if (!m.read) { m.read = true; m.readAt = Date.now(); changed = true; }
    });
    if (changed) {
      write(K.messages, msgs);
      renderAdminOverview();
      renderAdminMessages();
    }
  }

  /* ==========================================================
     15.10. STUDENT PROFILE MODAL (with edit + save)
     ========================================================== */
  let currentViewedStudentId = null;
  let isEditingStudentProfile = false;

  function openStudentProfileModal(studentId) {
    const student = read(K.students, []).find(s => s.id === studentId);
    if (!student) return;

    currentViewedStudentId = studentId;
    isEditingStudentProfile = false;
    const modal = document.getElementById('studentProfileModal');
    const content = document.getElementById('studentProfileModalContent');
    if (!modal || !content) {
      console.warn('[Profile Modal] Modal HTML not found in admin.html');
      return;
    }

    renderStudentProfileContent(content, student, false);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function renderStudentProfileContent(content, student, editing) {
    const bookings = read(K.bookings, []).filter(b => b.userId === student.id);
    const docs = read(K.docs, []).filter(d => d.userId === student.id);
    const notifs = read(K.notifs, []).filter(n => n.userId === student.id);
    const activeBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');

    if (editing) {
      content.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="display: inline-grid; place-items: center; width: 76px; height: 76px; border-radius: 20px; background: linear-gradient(135deg, var(--gold-500), var(--gold-400)); color: #0a0f1e; font-weight: 800; font-size: 1.85rem; margin-bottom: 0.85rem;">
            ${(student.name || 'S').charAt(0).toUpperCase()}
          </div>
          <h3 style="margin: 0; font-size: 1.3rem;">Editing ${student.name || 'Student'}</h3>
        </div>

        <form id="adminEditStudentForm" class="stack-form" style="text-align: left;">
          <div class="form-row">
            <label>Full Name <input type="text" name="name" value="${(student.name || '').replace(/"/g, '&quot;')}" required /></label>
            <label>Email <input type="email" name="email" value="${(student.email || '').replace(/"/g, '&quot;')}" required /></label>
          </div>
          <div class="form-row">
            <label>Phone <input type="tel" name="phone" value="${(student.phone || '').replace(/"/g, '&quot;')}" /></label>
            <label>Country <input type="text" name="country" value="${(student.country || '').replace(/"/g, '&quot;')}" /></label>
          </div>
          <div class="form-row">
            <label>Date of Birth <input type="date" name="dob" value="${student.dob || ''}" /></label>
            <label>
              Education Level
              <select name="level">
                <option value="UG" ${student.level === 'UG' ? 'selected' : ''}>Undergraduate</option>
                <option value="Grad" ${student.level === 'Grad' ? 'selected' : ''}>Graduate</option>
                <option value="PhD" ${student.level === 'PhD' ? 'selected' : ''}>PhD</option>
              </select>
            </label>
          </div>
          <div class="form-row">
            <label>
              Gender
              <select name="gender">
                <option value="">— Select —</option>
                <option value="Male" ${student.gender === 'Male' ? 'selected' : ''}>Male</option>
                <option value="Female" ${student.gender === 'Female' ? 'selected' : ''}>Female</option>
                <option value="Other" ${student.gender === 'Other' ? 'selected' : ''}>Other</option>
                <option value="Prefer not to say" ${student.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
              </select>
            </label>
            <label>Last Qualification <input type="text" name="qualification" value="${(student.qualification || '').replace(/"/g, '&quot;')}" /></label>
          </div>
          <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
            <button type="submit" class="btn btn-primary" style="flex: 1;">💾 Save Changes</button>
            <button type="button" id="cancelEditStudent" class="btn btn-secondary" style="flex: 1;">Cancel</button>
          </div>
        </form>
      `;

      const form = document.getElementById('adminEditStudentForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const students = read(K.students, []);
          const idx = students.findIndex(s => s.id === currentViewedStudentId);
          if (idx === -1) return;

          students[idx] = {
            ...students[idx],
            name: (form.name.value || '').trim(),
            email: (form.email.value || '').trim().toLowerCase(),
            phone: (form.phone.value || '').trim(),
            country: (form.country.value || '').trim(),
            dob: form.dob.value,
            level: form.level.value,
            gender: form.gender.value,
            qualification: (form.qualification.value || '').trim(),
            updatedAt: Date.now()
          };
          write(K.students, students);

          addActivityLog('Student updated', students[idx].name, 'student');

          const updated = students[idx];
          isEditingStudentProfile = false;
          renderStudentProfileContent(content, updated, false);
          renderAdminStudents();
          renderAdminOverview();
          renderAdminStudentsDropdown();
        });
      }

      const cancelBtn = document.getElementById('cancelEditStudent');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          isEditingStudentProfile = false;
          renderStudentProfileContent(content, student, false);
        });
      }

      return;
    }

    const bookingsHTML = bookings.length > 0
      ? bookings.slice(0, 5).map(b => {
        const progress = Math.min(Math.max(b.progress || 0, 0), 100);
        const color = STATUS_COLORS[b.status] || '#94a3b8';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; padding: 0.7rem 0.9rem; background: rgba(212,162,76,0.04); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 0.5rem;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text);">${b.service || 'Service'}</div>
                <div style="font-size: 0.7rem; color: var(--muted);">${b.bookingRef || ''} · ${progress}%</div>
              </div>
              <span style="font-size: 0.68rem; font-weight: 700; color: ${color}; padding: 3px 8px; background: ${color}15; border: 1px solid ${color}40; border-radius: 999px; white-space: nowrap;">
                ${STATUS_LABELS[b.status] || b.status}
              </span>
            </div>
          `;
      }).join('')
      : `<div class="empty-state" style="padding: 1rem;">No bookings yet.</div>`;

    const docsHTML = docs.length > 0
      ? docs.slice(0, 5).map(d => `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; padding: 0.7rem 0.9rem; background: rgba(212,162,76,0.04); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 0.5rem;">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text);">📎 ${d.docName || 'Document'}</div>
              <div style="font-size: 0.7rem; color: var(--muted);">${formatDate(d.createdAt)}</div>
            </div>
            ${d.fileDataURL ? `<a href="${d.fileDataURL}" download="${d.fileName}" style="color: var(--gold-400); font-size: 0.78rem; font-weight: 600; text-decoration: none; white-space: nowrap;">⬇ Download</a>` : ''}
          </div>
        `).join('')
      : `<div class="empty-state" style="padding: 1rem;">No documents uploaded.</div>`;

    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="display: inline-grid; place-items: center; width: 76px; height: 76px; border-radius: 20px; background: linear-gradient(135deg, var(--gold-500), var(--gold-400)); color: #0a0f1e; font-weight: 800; font-size: 1.85rem; margin-bottom: 0.85rem;">
          ${(student.name || 'S').charAt(0).toUpperCase()}
        </div>
        <h3 style="margin: 0 0 0.3rem; font-size: 1.4rem;">${student.name || 'Student'}</h3>
        <p style="margin: 0; color: var(--gold-400); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">
          ${LEVEL_LABELS[student.level] || student.level || 'Student'}
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin-bottom: 1.5rem;">
        <div style="text-align: center; padding: 0.75rem; background: rgba(212,162,76,0.06); border: 1px solid var(--border); border-radius: 10px;">
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--gold-400);">${bookings.length}</div>
          <div style="font-size: 0.68rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;">Bookings</div>
        </div>
        <div style="text-align: center; padding: 0.75rem; background: rgba(212,162,76,0.06); border: 1px solid var(--border); border-radius: 10px;">
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--gold-400);">${docs.length}</div>
          <div style="font-size: 0.68rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;">Documents</div>
        </div>
        <div style="text-align: center; padding: 0.75rem; background: rgba(212,162,76,0.06); border: 1px solid var(--border); border-radius: 10px;">
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--gold-400);">${activeBookings.length}</div>
          <div style="font-size: 0.68rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;">Active</div>
        </div>
      </div>

      <div style="display: flex; gap: 0.6rem; margin-bottom: 1.5rem;">
        <button id="editStudentProfileBtn" class="btn btn-secondary" style="flex: 1; padding: 0.65rem; font-size: 0.85rem;">✏ Edit Profile</button>
        <button id="sendMsgToStudentBtn" class="btn btn-primary" style="flex: 1; padding: 0.65rem; font-size: 0.85rem;">📨 Send Message</button>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin: 0 0 0.85rem; font-size: 0.9rem; color: var(--text); text-transform: uppercase; letter-spacing: 0.05em;">📋 Personal Info</h4>
        <div class="student-profile-grid">
          <div style="padding: 0.5rem 0; border-bottom: 1px dashed rgba(148,160,187,0.15);">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700;">Email</div>
            <div style="font-size: 0.85rem; color: var(--text); word-break: break-all;">${student.email || '—'}</div>
          </div>
          <div style="padding: 0.5rem 0; border-bottom: 1px dashed rgba(148,160,187,0.15);">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700;">Phone</div>
            <div style="font-size: 0.85rem; color: var(--text);">${student.phone || '—'}</div>
          </div>
          <div style="padding: 0.5rem 0; border-bottom: 1px dashed rgba(148,160,187,0.15);">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700;">Country</div>
            <div style="font-size: 0.85rem; color: var(--text);">${student.country || '—'}</div>
          </div>
          <div style="padding: 0.5rem 0; border-bottom: 1px dashed rgba(148,160,187,0.15);">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700;">Date of Birth</div>
            <div style="font-size: 0.85rem; color: var(--text);">${student.dob ? formatDate(student.dob) : '—'}</div>
          </div>
          <div style="padding: 0.5rem 0; border-bottom: 1px dashed rgba(148,160,187,0.15);">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700;">Gender</div>
            <div style="font-size: 0.85rem; color: var(--text);">${student.gender || '—'}</div>
          </div>
          <div style="padding: 0.5rem 0; border-bottom: 1px dashed rgba(148,160,187,0.15);">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700;">Qualification</div>
            <div style="font-size: 0.85rem; color: var(--text);">${student.qualification || '—'}</div>
          </div>
        </div>
        <div style="margin-top: 0.6rem; font-size: 0.72rem; color: var(--muted);">Joined: ${formatDate(student.createdAt)}</div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin: 0 0 0.85rem; font-size: 0.9rem; color: var(--text); text-transform: uppercase; letter-spacing: 0.05em;">📚 Bookings (${bookings.length})</h4>
        ${bookingsHTML}
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="margin: 0 0 0.85rem; font-size: 0.9rem; color: var(--text); text-transform: uppercase; letter-spacing: 0.05em;">📄 Documents (${docs.length})</h4>
        ${docsHTML}
      </div>

      <div id="studentMsgFormWrap" style="display: none; padding-top: 1.5rem; border-top: 1px solid var(--border);">
        <h4 style="margin: 0 0 1rem; color: var(--text); font-size: 0.95rem;">📨 Send Message</h4>
        <form id="profileSendMessageForm" class="stack-form">
          <input type="hidden" id="profileMsgStudentId" value="${student.id}" />
          <label>
            <span>Title</span>
            <input type="text" id="profileMsgTitle" placeholder="e.g. Documents Received" required maxlength="80" />
          </label>
          <label>
            <span>Message</span>
            <textarea id="profileMsgBody" rows="3" placeholder="Write your message…" required maxlength="500"></textarea>
          </label>
          <p class="form-message" id="profileMsgStatus" aria-live="polite" style="margin: 0; min-height: auto;"></p>
          <button class="btn btn-primary" type="submit" style="width: 100%;">📨 Send Message</button>
        </form>
      </div>
    `;

    const editBtn = document.getElementById('editStudentProfileBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        isEditingStudentProfile = true;
        renderStudentProfileContent(content, student, true);
      });
    }

    const sendMsgBtn = document.getElementById('sendMsgToStudentBtn');
    const msgFormWrap = document.getElementById('studentMsgFormWrap');
    if (sendMsgBtn && msgFormWrap) {
      sendMsgBtn.addEventListener('click', () => {
        msgFormWrap.style.display = msgFormWrap.style.display === 'none' ? 'block' : 'none';
        if (msgFormWrap.style.display === 'block') {
          document.getElementById('profileMsgTitle')?.focus();
        }
      });
    }

    const msgForm = document.getElementById('profileSendMessageForm');
    if (msgForm) {
      msgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = (document.getElementById('profileMsgTitle').value || '').trim();
        const message = (document.getElementById('profileMsgBody').value || '').trim();
        const statusEl = document.getElementById('profileMsgStatus');

        if (!title || !message) {
          if (statusEl) {
            statusEl.textContent = 'Please fill in both fields.';
            statusEl.style.color = '#f87171';
          }
          return;
        }

        const notifs = read(K.notifs, []);
        notifs.push({
          id: genId('nt'),
          userId: student.id,
          title,
          message,
          read: false,
          sentBy: 'admin',
          createdAt: Date.now()
        });
        write(K.notifs, notifs);

        if (statusEl) {
          statusEl.textContent = '✅ Message sent successfully!';
          statusEl.style.color = '#34d399';
        }
        msgForm.reset();
        setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);

        addActivityLog('Message sent', `${title} → ${student.name}`, 'notification');

        renderAdminOverview();
        renderAdminSentNotifs();
      });
    }
  }

  function closeStudentProfileModal() {
    const modal = document.getElementById('studentProfileModal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
    currentViewedStudentId = null;
    isEditingStudentProfile = false;
  }

  /* ==========================================================
     16. ADMIN RENDER — MESSAGES
     ========================================================== */
  function renderAdminMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;

    const messages = read(K.messages, []);
    messages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (messages.length === 0) {
      container.innerHTML = `<div class="empty-state">No messages yet.</div>`;
      return;
    }

    container.innerHTML = messages.map(m => `
      <div class="notif-row ${m.read ? '' : 'unread'}">
        <strong>${m.name || 'Unknown'} ${m.service ? `· <span style="font-weight:500; font-size:0.82rem; color:var(--muted);">${m.service}</span>` : ''}</strong>
        <p style="font-size:0.82rem; color:var(--muted); margin-bottom:0.4rem;">${m.email || ''}</p>
        <p>${m.message || ''}</p>
        <small>
          ${formatDateTime(m.createdAt)}
          ${!m.read ? ` · <button data-mark-read="${m.id}" style="background:transparent; border:0; color:var(--gold-400); cursor:pointer; font-size:0.75rem; font-weight:700; text-decoration:underline; padding:0;">Mark as read</button>` : ''}
        </small>
      </div>
    `).join('');

    container.querySelectorAll('[data-mark-read]').forEach(btn => {
      btn.addEventListener('click', () => {
        const msgs = read(K.messages, []);
        const idx = msgs.findIndex(m => m.id === btn.dataset.markRead);
        if (idx === -1) return;
        msgs[idx].read = true;
        write(K.messages, msgs);
        renderAdminMessages();
        renderAdminOverview();
      });
    });
  }

  /* ==========================================================
     17. ADMIN RENDER — STUDENTS DROPDOWN
     ========================================================== */
  function renderAdminStudentsDropdown() {
    const select = document.getElementById('notifStudent');
    if (!select) return;

    const students = read(K.students, []);

    if (students.length === 0) {
      select.innerHTML = `<option value="">— No students registered yet —</option>`;
      return;
    }

    select.innerHTML = `<option value="">— Choose a student —</option>` +
      `<option value="__ALL__" style="font-weight:700;color:var(--gold-400);">📢 All Students (${students.length})</option>` +
      students.map(s => `<option value="${s.id}">${s.name || 'Unnamed'} (${s.email || 'no email'})</option>`).join('');
  }

  /* ==========================================================
     18. ADMIN RENDER — SENT NOTIFICATIONS
     ========================================================== */
  function renderAdminSentNotifs() {
    const container = document.getElementById('sentNotifsList');
    if (!container) return;

    const studentsArr = read(K.students, []);
    const studentMap = new Map(studentsArr.map(s => [s.id, s]));

    const notifs = read(K.notifs, [])
      .filter(n => n.sentBy === 'admin')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 10);

    if (notifs.length === 0) {
      container.innerHTML = `<div class="empty-state">No notifications sent yet.</div>`;
      return;
    }

    container.innerHTML = notifs.map(n => {
      const student = studentMap.get(n.userId);
      const isRead = n.read;
      return `
        <div style="padding:0.85rem 1rem; background:rgba(212,162,76,0.04); border:1px solid var(--border); border-radius:10px; margin-bottom:0.6rem; ${isRead ? 'opacity:0.7;' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:start; gap:0.5rem; margin-bottom:0.2rem;">
            <strong style="color:var(--text); font-size:0.9rem;">${n.title}</strong>
            <span style="font-size:0.68rem; padding:2px 6px; border-radius:4px; ${isRead ? 'background:rgba(52,211,153,0.15);color:#34d399;' : 'background:rgba(251,191,36,0.15);color:#fbbf24;'}">
              ${isRead ? '✓ Read' : '⏳ Unread'}
            </span>
          </div>
          <p style="margin:0; font-size:0.82rem; color:var(--muted);">To: ${student?.name || 'Unknown'}</p>
          <small style="font-size:0.75rem; color:var(--muted);">${formatDateTime(n.createdAt)}</small>
        </div>
      `;
    }).join('');

    // Update notification stats
    const allNotifs = read(K.notifs, []).filter(n => n.sentBy === 'admin');
    const readCount = allNotifs.filter(n => n.read).length;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('statNotifTotal', allNotifs.length);
    setText('statNotifUnread', allNotifs.length - readCount);
    setText('statNotifRead', readCount);

    // Update admin notification badge
    const adminBadge = document.getElementById('notifsAdminCount');
    if (adminBadge) {
      adminBadge.textContent = allNotifs.length - readCount;
      adminBadge.hidden = (allNotifs.length - readCount) === 0;
    }
  }

  /* ==========================================================
     ⭐ NEW ADMIN SECTIONS — Charts, Applications, Services,
     Consultants, Tasks, Calendar, Reports, Activity Logs
     ========================================================== */
  let chartGrowthInstance = null;
  let chartApplicationStatusInstance = null;
  let chartServicesInstance = null;
  let chartCountriesInstance = null;

  function initAdminNewSections() {
    if (window.Chart) {
      Chart.defaults.color = '#94a0bb';
      Chart.defaults.borderColor = 'rgba(212, 162, 76, 0.12)';
      Chart.defaults.font.family = "'Inter', sans-serif";
    }

    renderAdminCharts();
    renderApplicationsAdmin();
    renderServicesAdmin();
    renderConsultantsAdmin();
    renderTasksAdmin();
    renderCalendarAdmin();
    renderActivityLogsAdmin();
    renderUpcomingDeadlines();

    bindNewAdminEvents();

    const savedName = localStorage.getItem('tgp_admin_name');
    if (savedName) {
      const nameInput = document.getElementById('adminName');
      if (nameInput) nameInput.value = savedName;
    }

    updateAdminKPIs();
  }

  function renderAdminCharts() {
    if (!window.Chart) {
      console.warn('[Charts] Chart.js not loaded');
      return;
    }

    const students = read(K.students, []);
    const bookings = read(K.bookings, []);
    const applications = read(NEW_ADMIN_K.applications, []);

    // Chart 1: Student Growth
    const growthCtx = document.getElementById('chartGrowth');
    if (growthCtx) {
      const growthData = getLast6MonthsData(students, 'createdAt');
      if (chartGrowthInstance) chartGrowthInstance.destroy();
      chartGrowthInstance = new Chart(growthCtx, {
        type: 'line',
        data: {
          labels: growthData.labels,
          datasets: [{
            label: 'New Students',
            data: growthData.values,
            borderColor: '#d4a24c',
            backgroundColor: 'rgba(212, 162, 76, 0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#e8c372',
            pointBorderColor: '#0a0f1e',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }

    // Chart 2: Application Status
    const appStatusCtx = document.getElementById('chartApplicationStatus');
    if (appStatusCtx) {
      const statusCounts = {};
      Object.values(STATUS_APPLICATION_LABELS).forEach(l => statusCounts[l] = 0);
      applications.forEach(a => {
        const label = STATUS_APPLICATION_LABELS[a.status] || a.status;
        if (statusCounts[label] !== undefined) statusCounts[label]++;
      });

      if (chartApplicationStatusInstance) chartApplicationStatusInstance.destroy();
      chartApplicationStatusInstance = new Chart(appStatusCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: ['#94a0bb', '#60a5fa', '#fbbf24', '#f97316', '#a855f7', '#34d399', '#f87171', '#64748b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { padding: 10, boxWidth: 12, font: { size: 10 } } }
          }
        }
      });
    }

    // Chart 3: Services
    const servicesCtx = document.getElementById('chartServices');
    if (servicesCtx) {
      const serviceCount = {};
      bookings.forEach(b => {
        const s = b.service || 'Other';
        serviceCount[s] = (serviceCount[s] || 0) + 1;
      });
      const sorted = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

      if (chartServicesInstance) chartServicesInstance.destroy();
      chartServicesInstance = new Chart(servicesCtx, {
        type: 'bar',
        data: {
          labels: sorted.map(e => e[0].length > 20 ? e[0].slice(0, 18) + '…' : e[0]),
          datasets: [{
            label: 'Bookings',
            data: sorted.map(e => e[1]),
            backgroundColor: 'rgba(212, 162, 76, 0.7)',
            borderColor: '#d4a24c',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
            x: { ticks: { font: { size: 9 } } }
          }
        }
      });
    }

    // Chart 4: Countries
    const countriesCtx = document.getElementById('chartCountries');
    if (countriesCtx) {
      const countryCount = {};
      students.forEach(s => {
        const c = s.country || 'Not Specified';
        countryCount[c] = (countryCount[c] || 0) + 1;
      });
      const sorted = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

      if (chartCountriesInstance) chartCountriesInstance.destroy();
      chartCountriesInstance = new Chart(countriesCtx, {
        type: 'polarArea',
        data: {
          labels: sorted.map(e => e[0]),
          datasets: [{
            data: sorted.map(e => e[1]),
            backgroundColor: [
              'rgba(212, 162, 76, 0.7)', 'rgba(168, 85, 247, 0.7)',
              'rgba(96, 165, 250, 0.7)', 'rgba(52, 211, 153, 0.7)',
              'rgba(251, 191, 36, 0.7)', 'rgba(248, 113, 113, 0.7)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { padding: 8, boxWidth: 10, font: { size: 10 } } }
          }
        }
      });
    }
  }

  function getLast6MonthsData(items, dateField) {
    const labels = [];
    const values = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en', { month: 'short' });
      labels.push(monthLabel);

      const count = items.filter(item => {
        if (!item[dateField]) return false;
        const itemDate = new Date(item[dateField]);
        return itemDate.getFullYear() === d.getFullYear() && itemDate.getMonth() === d.getMonth();
      }).length;

      values.push(count);
    }

    return { labels, values };
  }

  function updateAdminKPIs() {
    const students = read(K.students, []);
    const bookings = read(K.bookings, []);
    const docs = read(K.docs, []);
    const messages = read(K.messages, []);
    const tasks = read(NEW_ADMIN_K.tasks, []);

    const active = bookings.filter(b => ['new', 'pending-verification', 'in-progress'].includes(b.status));
    const pending = bookings.filter(b => b.status === 'pending-verification');
    const completed = bookings.filter(b => b.status === 'completed');
    const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.amount || 0), 0);
    const unreadMsgs = messages.filter(m => !m.read).length;
    const activeTasks = tasks.filter(t => !t.completed).length;

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('kpiStudents', students.length);
    setText('kpiActive', active.length);
    setText('kpiPending', pending.length);
    setText('kpiCompleted', completed.length);
    setText('kpiRevenue', revenue.toLocaleString());
    setText('kpiDocs', docs.length);
    setText('kpiMessages', unreadMsgs);
    setText('kpiTasks', activeTasks);
  }

  function renderUpcomingDeadlines() {
    const container = document.getElementById('upcomingDeadlinesList');
    if (!container) return;

    const events = read(NEW_ADMIN_K.events, []);
    const now = Date.now();
    const in30Days = now + 30 * 86400000;

    const upcoming = events
      .filter(e => e.date && new Date(e.date).getTime() >= now && new Date(e.date).getTime() <= in30Days)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 6);

    if (upcoming.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding: 1rem;">No upcoming deadlines in next 30 days.</div>`;
      return;
    }

    container.innerHTML = upcoming.map(e => {
      const d = new Date(e.date);
      const day = d.getDate();
      const month = d.toLocaleString('en', { month: 'short' });
      const daysLeft = Math.ceil((d - now) / 86400000);

      return `
        <div class="deadline-item-admin">
          <div class="deadline-date-badge">
            <small>${month}</small>
            <strong>${day}</strong>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: var(--text); font-size: 0.9rem;">${e.title}</div>
            <div style="font-size: 0.78rem; color: var(--muted);">${e.type} · ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ---------- Applications ---------- */
  function renderApplicationsAdmin() {
    const tbody = document.getElementById('applicationsBody');
    if (!tbody) return;

    const apps = read(NEW_ADMIN_K.applications, []);
    const students = read(K.students, []);
    const studentMap = new Map(students.map(s => [s.id, s]));

    const search = ($('#applicationSearch')?.value || '').toLowerCase();
    const statusFilter = $('#applicationStatusFilter')?.value || '';

    let filtered = apps;
    if (search) {
      filtered = filtered.filter(a => {
        const student = studentMap.get(a.studentId);
        const text = [a.scholarship, a.country, student?.name, student?.email].join(' ').toLowerCase();
        return text.includes(search);
      });
    }
    if (statusFilter) {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    const badge = document.getElementById('applicationsCount');
    if (badge) {
      badge.textContent = apps.length;
      badge.hidden = apps.length === 0;
    }
    const tag = document.getElementById('applicationsTag');
    if (tag) tag.textContent = `${apps.length} applications`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--muted); padding:2rem;">No applications yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(a => {
      const student = studentMap.get(a.studentId);
      const statusLabel = STATUS_APPLICATION_LABELS[a.status] || a.status;
      const progress = Math.min(Math.max(a.progress || 0, 0), 100);
      const deadline = a.deadline ? formatDate(a.deadline) : '—';
      const isUrgent = a.deadline && new Date(a.deadline).getTime() - Date.now() < 7 * 86400000;

      return `
        <tr>
          <td><strong>${student?.name || 'Unknown'}</strong><br><small style="color:var(--muted);">${student?.email || ''}</small></td>
          <td>${a.scholarship || '—'}</td>
          <td>${a.country || '—'}</td>
          <td style="${isUrgent ? 'color:#f87171;font-weight:700;' : ''}">${deadline}</td>
          <td>
            <div style="width: 100px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden; margin-bottom: 3px;">
              <div style="width: ${Math.max(progress, 3)}%; height: 100%; background: linear-gradient(90deg, var(--gold-500), var(--gold-400)); border-radius: 999px;"></div>
            </div>
            <small>${progress}%</small>
          </td>
          <td>
            <select data-app-status-id="${a.id}" style="font-size:0.78rem; padding:4px 6px; border-radius:6px; background:rgba(15,24,45,0.9); color:var(--text); border:1px solid var(--border);">
              ${Object.entries(STATUS_APPLICATION_LABELS).map(([val, label]) =>
        `<option value="${val}" ${a.status === val ? 'selected' : ''}>${label}</option>`
      ).join('')}
            </select>
          </td>
          <td style="font-size:0.82rem; color:var(--muted);">${formatDate(a.createdAt)}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-app-status-id]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const apps = read(NEW_ADMIN_K.applications, []);
        const idx = apps.findIndex(a => a.id === sel.dataset.appStatusId);
        if (idx === -1) return;
        apps[idx].status = e.target.value;
        apps[idx].updatedAt = Date.now();
        write(NEW_ADMIN_K.applications, apps);
        addActivityLog('Application status changed', `Set to ${STATUS_APPLICATION_LABELS[e.target.value]}`, 'application');
        renderApplicationsAdmin();
        renderAdminCharts();
      });
    });
  }

  /* ---------- Services ---------- */
  function renderServicesAdmin() {
    const container = document.getElementById('servicesAdminList');
    if (!container) return;

    let services = read(NEW_ADMIN_K.services, []);
    if (services.length === 0) {
      write(NEW_ADMIN_K.services, DEFAULT_SERVICES);
      services = DEFAULT_SERVICES;
    }

    const bookings = read(K.bookings, []);
    const bookingCounts = {};
    bookings.forEach(b => {
      bookingCounts[b.service] = (bookingCounts[b.service] || 0) + 1;
    });

    container.innerHTML = services.map(s => `
      <div class="service-admin-card">
        <h4>${s.name}</h4>
        <p style="color:var(--gold-400); font-weight:600; font-size:0.85rem;">${s.price}</p>
        <div class="service-meta">
          <span style="color:var(--muted);">${bookingCounts[s.name] || 0} bookings</span>
          <span style="padding: 2px 8px; border-radius: 6px; font-size: 0.68rem; font-weight: 700; ${s.active ? 'background:rgba(52,211,153,0.15);color:#34d399;' : 'background:rgba(248,113,113,0.15);color:#f87171;'}">
            ${s.active ? '● Active' : '● Inactive'}
          </span>
        </div>
      </div>
    `).join('');
  }

  /* ---------- Consultants ---------- */
  function renderConsultantsAdmin() {
    const container = document.getElementById('consultantsList');
    if (!container) return;

    const consultants = read(NEW_ADMIN_K.consultants, []);
    const students = read(K.students, []);

    if (consultants.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding: 2rem;">No consultants added yet. Click "+ Add Consultant" to start.</div>`;
      return;
    }

    container.innerHTML = consultants.map(c => {
      const assignedCount = students.filter(s => s.consultantId === c.id).length;
      return `
        <div class="service-admin-card">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <h4 style="margin: 0;">${c.name}</h4>
            <button data-consultant-edit="${c.id}" style="background:transparent; border:0; color:var(--gold-400); cursor:pointer; font-size:0.85rem;">✏</button>
          </div>
          <p>📧 ${c.email || '—'}<br>📱 ${c.phone || '—'}</p>
          <p style="color:var(--gold-400); font-size:0.82rem;">${c.specialization || 'General'}</p>
          <div class="service-meta">
            <span style="color:var(--muted);">${assignedCount} students assigned</span>
            <button data-consultant-delete="${c.id}" style="background:transparent; border:0; color:#f87171; cursor:pointer; font-size:0.75rem;">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-consultant-edit]').forEach(btn => {
      btn.addEventListener('click', () => openConsultantModal(btn.dataset.consultantEdit));
    });

    container.querySelectorAll('[data-consultant-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this consultant?')) return;
        const consultants = read(NEW_ADMIN_K.consultants, []);
        const updated = consultants.filter(c => c.id !== btn.dataset.consultantDelete);
        write(NEW_ADMIN_K.consultants, updated);
        addActivityLog('Consultant deleted', 'Removed from team', 'consultant');
        renderConsultantsAdmin();
      });
    });
  }

  function openConsultantModal(consultantId) {
    const modal = document.getElementById('consultantModal');
    if (!modal) return;

    const isEdit = !!consultantId;
    document.getElementById('consultantModalTitle').textContent = isEdit ? 'Edit Consultant' : 'Add Consultant';
    document.getElementById('consultantId').value = consultantId || '';

    if (isEdit) {
      const consultants = read(NEW_ADMIN_K.consultants, []);
      const c = consultants.find(x => x.id === consultantId);
      if (c) {
        document.getElementById('consultantName').value = c.name || '';
        document.getElementById('consultantEmail').value = c.email || '';
        document.getElementById('consultantPhone').value = c.phone || '';
        document.getElementById('consultantSpec').value = c.specialization || '';
      }
    } else {
      document.getElementById('consultantForm').reset();
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  /* ---------- Tasks ---------- */
  function renderTasksAdmin() {
    const container = document.getElementById('tasksList');
    if (!container) return;

    const tasks = read(NEW_ADMIN_K.tasks, [])
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.due && b.due) return new Date(a.due) - new Date(b.due);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

    const badge = document.getElementById('tasksCount');
    if (badge) {
      const activeCount = tasks.filter(t => !t.completed).length;
      badge.textContent = activeCount;
      badge.hidden = activeCount === 0;
    }

    if (tasks.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding: 2rem;">No tasks yet. Click "+ New Task" to start.</div>`;
      return;
    }

    container.innerHTML = tasks.map(t => `
      <div class="task-item-admin ${t.completed ? 'completed' : ''}">
        <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} data-task-toggle="${t.id}" />
        <div class="task-body">
          <div class="task-title">${t.title}</div>
          ${t.description ? `<div class="task-desc">${t.description}</div>` : ''}
          ${t.due ? `<div class="task-desc">📅 Due: ${formatDate(t.due)}</div>` : ''}
        </div>
        <div class="task-meta">
          <span class="task-priority ${t.priority || 'medium'}">${t.priority || 'medium'}</span>
          <button data-task-delete="${t.id}" style="background:transparent; border:0; color:#f87171; cursor:pointer; font-size:1.1rem;">×</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-task-toggle]').forEach(cb => {
      cb.addEventListener('change', () => {
        const tasks = read(NEW_ADMIN_K.tasks, []);
        const idx = tasks.findIndex(t => t.id === cb.dataset.taskToggle);
        if (idx === -1) return;
        tasks[idx].completed = cb.checked;
        tasks[idx].completedAt = cb.checked ? Date.now() : null;
        write(NEW_ADMIN_K.tasks, tasks);
        addActivityLog(cb.checked ? 'Task completed' : 'Task reopened', tasks[idx].title, 'task');
        renderTasksAdmin();
        updateAdminKPIs();
      });
    });

    container.querySelectorAll('[data-task-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this task?')) return;
        const tasks = read(NEW_ADMIN_K.tasks, []);
        write(NEW_ADMIN_K.tasks, tasks.filter(t => t.id !== btn.dataset.taskDelete));
        renderTasksAdmin();
        updateAdminKPIs();
      });
    });
  }

  /* ---------- Calendar ---------- */
  function renderCalendarAdmin() {
    const container = document.getElementById('calendarList');
    if (!container) return;

    const events = read(NEW_ADMIN_K.events, [])
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (events.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding: 2rem;">No events yet. Click "+ Add Event" to start.</div>`;
      return;
    }

    container.innerHTML = events.map(e => {
      const d = new Date(e.date);
      const day = d.getDate();
      const month = d.toLocaleString('en', { month: 'short' });
      const isPast = d.getTime() < Date.now();

      return `
        <div class="deadline-item-admin" style="${isPast ? 'opacity:0.5;' : ''}">
          <div class="deadline-date-badge">
            <small>${month}</small>
            <strong>${day}</strong>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: var(--text); font-size: 0.9rem;">${e.title}</div>
            <div style="font-size: 0.78rem; color: var(--muted);">${e.type}</div>
          </div>
          <button data-event-delete="${e.id}" style="background:transparent; border:0; color:#f87171; cursor:pointer; font-size:1.1rem;">×</button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-event-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this event?')) return;
        const events = read(NEW_ADMIN_K.events, []);
        write(NEW_ADMIN_K.events, events.filter(e => e.id !== btn.dataset.eventDelete));
        renderCalendarAdmin();
        renderUpcomingDeadlines();
      });
    });
  }

  /* ---------- Activity Logs ---------- */
  function renderActivityLogsAdmin() {
    const container = document.getElementById('activityLogsList');
    if (!container) return;

    const logs = read(NEW_ADMIN_K.activityLogs, [])
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 100);

    if (logs.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding: 2rem;">No activity logs yet.</div>`;
      return;
    }

    container.innerHTML = logs.map(l => `
      <div class="activity-log-row">
        <div class="activity-log-icon">${l.icon || '📝'}</div>
        <div class="activity-log-body">
          <strong>${l.action}</strong>
          <small>${l.detail || ''} · ${formatDateTime(l.createdAt)}</small>
        </div>
      </div>
    `).join('');
  }

  function addActivityLog(action, detail, type) {
    const logs = read(NEW_ADMIN_K.activityLogs, []);
    const icons = {
      student: '👤', booking: '📋', document: '📄',
      application: '📋', notification: '🔔', consultant: '🧑‍💼',
      task: '✅', payment: '💰', event: '📅', service: '💼', default: '📝'
    };
    logs.push({
      id: genId('log'),
      action,
      detail,
      icon: icons[type] || icons.default,
      type,
      createdAt: Date.now()
    });
    if (logs.length > 500) logs.splice(0, logs.length - 500);
    write(NEW_ADMIN_K.activityLogs, logs);
    renderActivityLogsAdmin();
  }

  /* ---------- New Events Binding ---------- */
  function bindNewAdminEvents() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(handleGlobalSearch, 250));
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#globalSearch') && !e.target.closest('#globalSearchResults')) {
          const results = document.getElementById('globalSearchResults');
          if (results) results.style.display = 'none';
        }
      });
    }

    on('#exportStudentsBtn', 'click', exportStudentsCSV);
    on('#applicationSearch', 'input', debounce(renderApplicationsAdmin, 300));
    on('#applicationStatusFilter', 'change', renderApplicationsAdmin);
    on('#addServiceBtn', 'click', addNewService);
    on('#addConsultantBtn', 'click', () => openConsultantModal());

    const consultantForm = document.getElementById('consultantForm');
    if (consultantForm) {
      consultantForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const consultants = read(NEW_ADMIN_K.consultants, []);
        const id = document.getElementById('consultantId').value;
        const data = {
          id: id || genId('consultant'),
          name: document.getElementById('consultantName').value.trim(),
          email: document.getElementById('consultantEmail').value.trim(),
          phone: document.getElementById('consultantPhone').value.trim(),
          specialization: document.getElementById('consultantSpec').value.trim(),
          createdAt: Date.now()
        };

        if (id) {
          const idx = consultants.findIndex(c => c.id === id);
          if (idx >= 0) consultants[idx] = { ...consultants[idx], ...data };
        } else {
          consultants.push(data);
        }

        write(NEW_ADMIN_K.consultants, consultants);
        addActivityLog(id ? 'Consultant updated' : 'Consultant added', data.name, 'consultant');
        renderConsultantsAdmin();
        document.getElementById('consultantModal').classList.remove('show');
        document.body.style.overflow = '';
      });
    }

    on('#addTaskBtn', 'click', () => {
      document.getElementById('taskModal').classList.add('show');
      document.body.style.overflow = 'hidden';
    });

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const tasks = read(NEW_ADMIN_K.tasks, []);
        tasks.push({
          id: genId('task'),
          title: document.getElementById('taskTitle').value.trim(),
          description: document.getElementById('taskDesc').value.trim(),
          priority: document.getElementById('taskPriority').value,
          due: document.getElementById('taskDue').value,
          completed: false,
          createdAt: Date.now()
        });
        write(NEW_ADMIN_K.tasks, tasks);
        addActivityLog('Task created', document.getElementById('taskTitle').value, 'task');
        renderTasksAdmin();
        updateAdminKPIs();
        document.getElementById('taskModal').classList.remove('show');
        document.body.style.overflow = '';
        taskForm.reset();
      });
    }

    on('#addEventBtn', 'click', () => {
      document.getElementById('eventModal').classList.add('show');
      document.body.style.overflow = 'hidden';
    });

    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
      eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const events = read(NEW_ADMIN_K.events, []);
        events.push({
          id: genId('evt'),
          title: document.getElementById('eventTitle').value.trim(),
          date: document.getElementById('eventDate').value,
          type: document.getElementById('eventType').value,
          createdAt: Date.now()
        });
        write(NEW_ADMIN_K.events, events);
        addActivityLog('Event added', document.getElementById('eventTitle').value, 'event');
        renderCalendarAdmin();
        renderUpcomingDeadlines();
        document.getElementById('eventModal').classList.remove('show');
        document.body.style.overflow = '';
        eventForm.reset();
      });
    }

    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-close-consultant]')) {
        document.getElementById('consultantModal')?.classList.remove('show');
        document.body.style.overflow = '';
      }
      if (e.target.matches('[data-close-task]')) {
        document.getElementById('taskModal')?.classList.remove('show');
        document.body.style.overflow = '';
      }
      if (e.target.matches('[data-close-event]')) {
        document.getElementById('eventModal')?.classList.remove('show');
        document.body.style.overflow = '';
      }
    });

    const settingsForm = document.getElementById('adminSettingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('adminName').value.trim();
        localStorage.setItem('tgp_admin_name', name);
        addActivityLog('Admin settings updated', 'Profile name changed', 'default');
        alert('✅ Settings saved!');
      });
    }

    on('#clearLogsBtn', 'click', () => {
      if (!confirm('Clear all activity logs?')) return;
      write(NEW_ADMIN_K.activityLogs, []);
      renderActivityLogsAdmin();
    });

    document.querySelectorAll('[data-report]').forEach(card => {
      card.addEventListener('click', () => generateReport(card.dataset.report));
    });

    document.querySelectorAll('.kpi-card').forEach(card => {
      card.addEventListener('click', () => {
        const kpi = card.dataset.kpi;
        const targetSection = {
          students: 'studentsSection',
          active: 'bookingsSection',
          pending: 'bookingsSection',
          completed: 'bookingsSection',
          revenue: 'bookingsSection',
          docs: 'documentsAdminSection',
          messages: 'messagesSection',
          tasks: 'tasksSection'
        }[kpi];
        if (targetSection) {
          const el = document.getElementById(targetSection);
          if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
        }
      });
    });
  }

  /* ---------- Global Search ---------- */
  function handleGlobalSearch() {
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('globalSearchResults');
    if (!input || !results) return;

    const q = input.value.trim().toLowerCase();
    if (q.length < 2) {
      results.style.display = 'none';
      return;
    }

    const students = read(K.students, []);
    const apps = read(NEW_ADMIN_K.applications, []);
    const bookings = read(K.bookings, []);
    const matches = [];

    students.filter(s =>
      [s.name, s.email, s.phone, s.id].join(' ').toLowerCase().includes(q)
    ).slice(0, 5).forEach(s => {
      matches.push({ type: 'Student', icon: '👤', text: s.name, subtitle: s.email || '', action: () => openStudentProfileModal(s.id) });
    });

    apps.filter(a =>
      [a.scholarship, a.country].join(' ').toLowerCase().includes(q)
    ).slice(0, 3).forEach(a => {
      matches.push({ type: 'App', icon: '📋', text: a.scholarship, subtitle: a.country || '', action: () => document.getElementById('applicationsSection').scrollIntoView({ behavior: 'smooth' }) });
    });

    bookings.filter(b =>
      [b.bookingRef, b.service, b.name].join(' ').toLowerCase().includes(q)
    ).slice(0, 3).forEach(b => {
      matches.push({ type: 'Booking', icon: '📦', text: b.service, subtitle: b.bookingRef || '', action: () => document.getElementById('bookingsSection').scrollIntoView({ behavior: 'smooth' }) });
    });

    if (matches.length === 0) {
      results.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--muted); font-size: 0.85rem;">No results for "${q}"</div>`;
    } else {
      results.innerHTML = matches.map((m, i) => `
        <div class="global-search-result" data-result-index="${i}">
          <div class="result-icon">${m.icon}</div>
          <div class="result-text">
            <strong>${m.text}</strong>
            <small>${m.subtitle}</small>
          </div>
          <span class="result-type">${m.type}</span>
        </div>
      `).join('');

      results.querySelectorAll('[data-result-index]').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.resultIndex);
          if (matches[idx]) matches[idx].action();
          results.style.display = 'none';
          input.value = '';
        });
      });
    }

    results.style.display = 'block';
  }

  /* ---------- Export Students CSV ---------- */
  function exportStudentsCSV() {
    const students = read(K.students, []);
    if (students.length === 0) {
      alert('No students to export.');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Level', 'Country', 'Gender', 'Qualification', 'Joined'];
    const rows = students.map(s => [
      s.name || '', s.email || '', s.phone || '',
      LEVEL_LABELS[s.level] || s.level || '',
      s.country || '', s.gender || '', s.qualification || '',
      formatDate(s.createdAt)
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addActivityLog('Students exported', `${students.length} records to CSV`, 'student');
  }

  /* ---------- Add Service ---------- */
  function addNewService() {
    const name = prompt('Service name:');
    if (!name || !name.trim()) return;
    const price = prompt('Price (e.g. 5000 PKR):') || '—';

    const services = read(NEW_ADMIN_K.services, DEFAULT_SERVICES);
    services.push({
      id: String(services.length + 1).padStart(2, '0'),
      name: name.trim(),
      price: price.trim(),
      active: true
    });
    write(NEW_ADMIN_K.services, services);
    addActivityLog('Service added', name.trim(), 'service');
    renderServicesAdmin();
  }

  /* ---------- Generate Report ---------- */
  function generateReport(type) {
    const output = document.getElementById('reportOutput');
    if (!output) return;

    const students = read(K.students, []);
    const bookings = read(K.bookings, []);
    const docs = read(K.docs, []);
    const apps = read(NEW_ADMIN_K.applications, []);

    let html = '';

    if (type === 'students') {
      html = `
        <h4 class="chart-title">👥 Students Report — ${students.length} records</h4>
        <div class="metric-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
          <div class="metric-card"><span>Total</span><strong>${students.length}</strong></div>
          <div class="metric-card"><span>UG</span><strong>${students.filter(s => s.level === 'UG').length}</strong></div>
          <div class="metric-card"><span>Graduate</span><strong>${students.filter(s => s.level === 'Grad').length}</strong></div>
          <div class="metric-card"><span>PhD</span><strong>${students.filter(s => s.level === 'PhD').length}</strong></div>
        </div>
      `;
    } else if (type === 'bookings') {
      const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.amount || 0), 0);
      html = `
        <h4 class="chart-title">💼 Bookings Report</h4>
        <div class="metric-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
          <div class="metric-card"><span>Total</span><strong>${bookings.length}</strong></div>
          <div class="metric-card"><span>Completed</span><strong>${bookings.filter(b => b.status === 'completed').length}</strong></div>
          <div class="metric-card"><span>Revenue</span><strong>${revenue.toLocaleString()} PKR</strong></div>
        </div>
      `;
    } else if (type === 'documents') {
      html = `
        <h4 class="chart-title">📄 Documents Report</h4>
        <div class="metric-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
          <div class="metric-card"><span>Total Files</span><strong>${docs.length}</strong></div>
          <div class="metric-card"><span>Students</span><strong>${new Set(docs.map(d => d.userId)).size}</strong></div>
        </div>
      `;
    } else if (type === 'applications') {
      html = `
        <h4 class="chart-title">📋 Applications Report</h4>
        <div class="metric-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
          <div class="metric-card"><span>Total</span><strong>${apps.length}</strong></div>
          <div class="metric-card"><span>Approved</span><strong>${apps.filter(a => a.status === 'approved').length}</strong></div>
          <div class="metric-card"><span>Pending</span><strong>${apps.filter(a => !['approved', 'rejected'].includes(a.status)).length}</strong></div>
        </div>
      `;
    }

    output.innerHTML = html;
  }

  /* ==========================================================
     19-20. LOGIN / SIGNUP PAGES
     ========================================================== */
  if (getPageType() === 'login') initLoginPage();
  if (getPageType() === 'signup') initSignupPage();

  function initLoginPage() {
    if (getSessionStudent()) {
      window.location.replace('student.html');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') {
      showAuthMsg('✅ Account created! Please log in to continue.', false);
      const email = params.get('email');
      if (email) {
        const input = document.querySelector('#studentLoginForm input[name="email"]');
        if (input) input.value = email;
      }
      window.history.replaceState({}, '', 'login.html');
    }
    if (params.get('logout') === '1') {
      showAuthMsg('You have been logged out.', false);
      window.history.replaceState({}, '', 'login.html');
    }
    if (params.get('expired') === '1') {
      showAuthMsg('Your session expired. Please log in again.', true);
      window.history.replaceState({}, '', 'login.html');
    }

    const form = $('#studentLoginForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (form.email.value || '').trim().toLowerCase();
      const password = form.password.value;
      const btn = $('#loginSubmitBtn');

      if (!email || !password) return showAuthMsg('Please fill in both fields.', true);

      const students = read(K.students, []);
      const match = students.find(s => s.email === email && s.password === password);

      if (!match) return showAuthMsg('Invalid email or password.', true);

      if (btn) { btn.disabled = true; btn.textContent = 'Logging in…'; }
      localStorage.setItem(K.currentStudent, match.id);
      showAuthMsg('✅ Logged in. Redirecting…', false);

      setTimeout(() => window.location.replace('student.html'), 400);
    });
  }

  function initSignupPage() {
    if (getSessionStudent()) {
      window.location.replace('student.html');
      return;
    }

    const form = $('#studentRegisterForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (form.name.value || '').trim();
      const email = (form.email.value || '').trim().toLowerCase();
      const password = form.password.value;
      const phone = (form.phone.value || '').trim();
      const level = form.level.value;
      const btn = $('#signupSubmitBtn');

      if (name.length < 3) return showAuthMsg('Name too short (min 3 chars).', true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthMsg('Enter a valid email address.', true);
      if (password.length < 6) return showAuthMsg('Password must be at least 6 characters.', true);
      if (phone.length < 8) return showAuthMsg('Enter a valid WhatsApp number.', true);
      if (!level) return showAuthMsg('Please select your education level.', true);

      const students = read(K.students, []);
      if (students.some(s => s.email === email)) {
        return showAuthMsg('This email is already registered. Try logging in.', true);
      }

      students.push({
        id: genId('stu'),
        name, email, password, phone, level,
        dob: '', country: '', gender: '', qualification: '',
        createdAt: Date.now(), updatedAt: Date.now()
      });
      write(K.students, students);

      if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }
      showAuthMsg('✅ Account created! Redirecting to login…', false);

      setTimeout(() => {
        window.location.href = `login.html?registered=1&email=${encodeURIComponent(email)}`;
      }, 700);
    });
  }

  /* ==========================================================
     21. STUDENT PAGE
     ========================================================== */
  if (getPageType() === 'student') initStudentPage();

  function initStudentPage() {
    const authSection = $('#studentAuth');
    const dashboard = $('#studentDashboard');
    const loading = $('#studentLoading');

    if (!dashboard) {
      console.error('No #studentDashboard found on student page');
      return;
    }

    if (!authSection) {
      const student = getSessionStudent();

      if (!student) {
        window.location.replace('login.html');
        return;
      }

      if (loading) loading.style.display = 'none';
      dashboard.classList.remove('hidden');

      on('#logoutBtn', 'click', () => {
        clearSession();
        window.location.replace('login.html?logout=1');
      });

      initDashboardLogic(student);

      window.addEventListener('storage', (e) => {
        if ([K.bookings, K.docs, K.notifs, K.students].includes(e.key)) {
          const fresh = getSessionStudent();
          if (fresh) {
            renderDashboard(fresh);
          } else {
            window.location.replace('login.html?expired=1');
          }
        }
      });

      return;
    }

    initStudentPageWithAuth(authSection, dashboard);
  }

  function initStudentPageWithAuth(authSection, dashboard) {
    let currentStudentId = null;

    $$('.auth-tab').forEach(tab => tab.addEventListener('click', () => {
      const id = tab.dataset.authTarget;
      if (!id) return;
      $$('.auth-tab').forEach(t => t.classList.remove('active'));
      $$('.auth-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(id);
      if (panel) panel.classList.add('active');
      showAuthMsg('');
    }));

    function switchTab(id) {
      const tab = document.querySelector(`[data-auth-target="${id}"]`);
      if (tab) tab.click();
    }

    const signupForm = $('#studentRegisterForm');
    if (signupForm) signupForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (signupForm.name.value || '').trim();
      const email = (signupForm.email.value || '').trim().toLowerCase();
      const password = signupForm.password.value;
      const phone = (signupForm.phone.value || '').trim();
      const level = signupForm.level.value;

      if (name.length < 3) return showAuthMsg('Name too short', true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthMsg('Enter a valid email.', true);
      if (password.length < 6) return showAuthMsg('Password must be 6+ chars.', true);
      if (phone.length < 8) return showAuthMsg('Enter a valid phone.', true);
      if (!level) return showAuthMsg('Please select your level.', true);

      const students = read(K.students, []);
      if (students.some(s => s.email === email)) {
        return showAuthMsg('This email is already registered. Please log in.', true);
      }

      students.push({
        id: genId('stu'), name, email, password, phone, level,
        dob: '', country: '', gender: '', qualification: '',
        createdAt: Date.now(), updatedAt: Date.now()
      });
      write(K.students, students);

      showAuthMsg('✅ Account created! Please log in.', false);
      signupForm.reset();
      switchTab('studentLoginPanel');
      setTimeout(() => {
        const loginEmail = document.querySelector('#studentLoginForm input[name="email"]');
        const loginPwd = document.querySelector('#studentLoginForm input[name="password"]');
        if (loginEmail) loginEmail.value = email;
        if (loginPwd) loginPwd.focus();
      }, 400);
    });

    const loginForm = $('#studentLoginForm');
    if (loginForm) loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (loginForm.email.value || '').trim().toLowerCase();
      const password = loginForm.password.value;
      const match = read(K.students, []).find(s => s.email === email && s.password === password);
      if (!match) return showAuthMsg('Invalid email or password.', true);
      localStorage.setItem(K.currentStudent, match.id);
      loginForm.reset();
      loadDashboard(match);
    });

    on('#logoutBtn', 'click', () => {
      clearSession();
      currentStudentId = null;
      authSection.classList.remove('hidden');
      dashboard.classList.add('hidden');
      showAuthMsg('Logged out.', false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const student = getSessionStudent();
    if (student) loadDashboard(student);

    initDashboardLogic(null, loadDashboard);

    window.addEventListener('storage', (e) => {
      if ([K.bookings, K.docs, K.notifs, K.students].includes(e.key)) {
        const fresh = getSessionStudent();
        if (fresh) {
          renderDashboard(fresh);
        } else {
          window.location.replace('login.html?expired=1');
        }
      }
    });

    function loadDashboard(student) {
      if (!student) return;
      currentStudentId = student.id;
      authSection.classList.add('hidden');
      dashboard.classList.remove('hidden');
      renderDashboard(student);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ==========================================================
     22. SHARED DASHBOARD LOGIC (student)
     ========================================================== */
  function initDashboardLogic(initialStudent, reloadFn) {
    const reload = reloadFn || function (s) {
      const student = s || getSessionStudent();
      if (student) renderDashboard(student);
    };

    (function initSidebarToggle() {
      const sidebar = document.getElementById('portalSidebar');
      const overlay = document.getElementById('sidebarOverlay');
      const openBtn = document.getElementById('sidebarOpenBtn');
      const closeBtn = document.getElementById('sidebarCloseBtn');

      if (!sidebar || !overlay) return;

      function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
        document.body.classList.add('sidebar-open');
      }

      function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        document.body.classList.remove('sidebar-open');
      }

      if (openBtn) openBtn.addEventListener('click', openSidebar);
      if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
      overlay.addEventListener('click', closeSidebar);

      sidebar.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 820) setTimeout(closeSidebar, 250);
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 820 && sidebar.classList.contains('open')) closeSidebar();
      });
    })();

    on('#editProfileBtn', 'click', () => {
      $('#studentProfileView')?.classList.add('hidden');
      $('#studentProfileEditForm')?.classList.remove('hidden');
    });

    on('#cancelEditProfileBtn', 'click', () => {
      $('#studentProfileView')?.classList.remove('hidden');
      $('#studentProfileEditForm')?.classList.add('hidden');
    });

    const editForm = $('#studentProfileEditForm');
    if (editForm) editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const student = getSessionStudent();
      if (!student) return;

      const students = read(K.students, []);
      const idx = students.findIndex(s => s.id === student.id);
      if (idx === -1) return;

      students[idx] = {
        ...students[idx],
        name: (editForm.name.value || '').trim(),
        phone: (editForm.phone.value || '').trim(),
        dob: editForm.dob.value,
        country: (editForm.country.value || '').trim(),
        level: editForm.level.value,
        gender: editForm.gender.value,
        qualification: (editForm.qualification.value || '').trim(),
        updatedAt: Date.now()
      };
      write(K.students, students);

      const fresh = read(K.students, []).find(s => s.id === student.id);
      reload(fresh);

      $('#studentProfileView')?.classList.remove('hidden');
      editForm.classList.add('hidden');
    });

    const docForm = $('#documentUploadForm');
    if (docForm) docForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const student = getSessionStudent();
      if (!student) return;

      const docName = (docForm.docName.value || '').trim();
      const file = docForm.docFile.files[0];
      if (!docName || !file) return alert('Name and file required.');
      if (file.size > 5 * 1024 * 1024) return alert('Max 5MB.');

      const reader = new FileReader();
      reader.onload = (evt) => {
        const docs = read(K.docs, []);
        docs.push({
          id: genId('doc'), userId: student.id, docName,
          fileName: file.name, fileSize: file.size,
          fileDataURL: evt.target.result, createdAt: Date.now()
        });
        write(K.docs, docs);
        docForm.reset();

        const fresh = getSessionStudent();
        reload(fresh);
        alert('✅ Document uploaded!');
      };
      reader.readAsDataURL(file);
    });

    $$('.sidebar-link').forEach(link => link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.scroll);
      if (target) {
        const headerH = 76 + 20;
        window.scrollTo({ top: target.offsetTop - headerH, behavior: 'smooth' });
      }
      $$('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }));

    if (initialStudent) renderDashboard(initialStudent);
  }

  /* ==========================================================
     23. RENDER DASHBOARD (student)
     ========================================================== */
  function renderDashboard(student) {
    if (!student) return;

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('dashboardStudentName', student.name || 'Student');
    setText('sidebarName', student.name || 'Student');
    setText('sidebarLevel', LEVEL_LABELS[student.level] || 'Student');
    setText('sidebarAvatar', (student.name || 'S').charAt(0).toUpperCase());

    renderProfile(student);
    renderServices(student.id);
    renderDocs(student.id);
    renderNotifs(student.id);
  }

  function renderProfile(s) {
    if (!s) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
    set('profileName', s.name);
    set('profileEmail', s.email);
    set('profilePhone', s.phone);
    set('profileDOB', s.dob ? formatDate(s.dob) : '—');
    set('profileCountry', s.country);
    set('profileLevel', LEVEL_LABELS[s.level] || s.level);
    set('profileGender', s.gender);
    set('profileQualification', s.qualification);

    const f = $('#studentProfileEditForm');
    if (f) {
      f.name.value = s.name || '';
      f.phone.value = s.phone || '';
      f.dob.value = s.dob || '';
      f.country.value = s.country || '';
      f.level.value = s.level || 'UG';
      f.gender.value = s.gender || '';
      f.qualification.value = s.qualification || '';
    }
  }

  function ensureSteps(b) {
    if (Array.isArray(b.steps) && b.steps.length === 5) return b.steps;
    const pct = b.progress || 0;
    return DEFAULT_STEPS.map((label, i) => ({
      label,
      done: pct >= ((i + 1) / 5) * 100,
      completedAt: null
    }));
  }

  function calcProgress(steps) {
    const done = steps.filter(s => s.done).length;
    return Math.round((done / steps.length) * 100);
  }

  function renderServices(studentId) {
    const list = read(K.bookings, [])
      .filter(b => b.userId === studentId)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const active = list.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
    const badge = $('#servicesCountBadge');
    if (badge) badge.textContent = `${active.length} active`;

    const container = $('#myServicesList');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p style="margin-bottom:1rem;">You haven't booked any service yet.</p>
          <a href="book-service.html" class="btn btn-primary">Book Your First Service →</a>
        </div>`;
      return;
    }

    container.innerHTML = list.map(renderServiceCard).join('');
  }

  function renderServiceCard(b) {
    const steps = ensureSteps(b);
    const progress = calcProgress(steps);
    const color = STATUS_COLORS[b.status] || '#94a3b8';
    const statusLabel = STATUS_LABELS[b.status] || b.status;
    const currentStepIdx = steps.findIndex(s => !s.done);

    const stepsHTML = steps.map((st, i) => {
      const isDone = st.done;
      const isActive = !isDone && i === currentStepIdx;
      return `
        <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0; opacity: ${isDone || isActive ? '1' : '0.55'};">
          <span style="display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; font-size: 0.68rem; font-weight: 800; flex-shrink: 0;
            ${isDone
          ? 'background: linear-gradient(135deg, #34d399, #6ee7b7); color: #0a0f1e;'
          : isActive
            ? 'background: linear-gradient(135deg, var(--gold-500), var(--gold-400)); color: #0a0f1e; box-shadow: 0 0 0 3px rgba(212,162,76,0.18);'
            : 'background: rgba(255,255,255,0.08); color: var(--muted); border: 1px solid var(--border);'}">
            ${isDone ? '✓' : i + 1}
          </span>
          <span style="font-size: 0.82rem; font-weight: ${isActive ? '700' : '500'}; color: ${isDone ? '#34d399' : isActive ? 'var(--gold-400)' : 'var(--muted)'};">
            ${st.label}
            ${st.completedAt ? `<span style="font-size: 0.68rem; color: var(--muted); font-weight: 400;"> · ${formatDate(st.completedAt)}</span>` : ''}
          </span>
        </div>
      `;
    }).join('');

    const methodIcon = { jazzcash: '📱', easypaisa: '📱', bank: '🏦', whatsapp: '💬' }[b.paymentMethod] || '💰';
    const methodLabel = { jazzcash: 'JazzCash', easypaisa: 'EasyPaisa', bank: 'Bank', whatsapp: 'Contact' }[b.paymentMethod] || b.paymentMethod || '—';

    return `
      <article style="background: rgba(212,162,76,0.04); border: 1px solid var(--border); border-radius: 14px; padding: 1rem 1.1rem; margin-bottom: 0.85rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.85rem;">
          <div style="min-width: 0;">
            <h3 style="margin: 0; font-size: 1rem; color: var(--text);">${b.service || 'Service'}</h3>
            <p style="font-size: 0.75rem; color: var(--muted); margin: 0.3rem 0 0;">
              Ref: <strong style="color: var(--gold-400); font-family: monospace;">${b.bookingRef || b.id.substring(0, 8)}</strong>
            </p>
          </div>
          <span style="font-size: 0.7rem; font-weight: 700; color: ${color}; padding: 4px 10px; background: ${color}18; border: 1px solid ${color}40; border-radius: 999px; white-space: nowrap;">
            ${statusLabel}
          </span>
        </div>

        <div style="margin-bottom: 0.9rem;">
          <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
            <div style="width: ${Math.max(progress, 3)}%; height: 100%; background: linear-gradient(90deg, var(--gold-500), var(--gold-400)); border-radius: 999px; transition: width 0.4s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); margin-top: 0.4rem;">
            <span style="color: var(--gold-400); font-weight: 700;">${progress}% complete</span>
            <span>${formatDate(b.createdAt)}</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.15rem; margin-bottom: 0.9rem;">
          ${stepsHTML}
        </div>

        <div style="border-top: 1px dashed rgba(148,160,187,0.2); padding-top: 0.7rem; font-size: 0.8rem; color: var(--muted); display: flex; justify-content: space-between; gap: 0.5rem;">
          <span>💰 ${b.amount ? b.amount.toLocaleString() + ' PKR' : '—'}</span>
          <span>${methodIcon} ${methodLabel}</span>
        </div>
      </article>
    `;
  }

  /* ==========================================================
     24. STUDENT — DOCUMENTS
     ========================================================== */
  function renderDocs(studentId) {
    const docs = read(K.docs, [])
      .filter(d => d.userId === studentId)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const container = $('#documentsList') || document.getElementById('documentsList');
    if (!container) return;

    if (docs.length === 0) {
      container.innerHTML = `<div class="empty-state">No documents uploaded yet. Use the form above to add your first document.</div>`;
      return;
    }

    container.innerHTML = docs.map(d => {
      const sizeKB = d.fileSize ? Math.round(d.fileSize / 1024) : 0;
      const sizeStr = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';
      return `
        <div class="notif-row" style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
          <div style="min-width: 0; flex: 1;">
            <strong style="color: var(--text); font-size: 0.88rem;">📎 ${d.docName || 'Document'}</strong>
            <small style="display: block; color: var(--muted); font-size: 0.72rem; margin-top: 0.2rem;">
              ${d.fileName || ''} · ${sizeStr} · ${formatDate(d.createdAt)}
            </small>
          </div>
          ${d.fileDataURL
          ? `<a href="${d.fileDataURL}" download="${d.fileName || 'document'}" class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.75rem; white-space: nowrap;">⬇ Download</a>`
          : `<span style="font-size: 0.75rem; color: var(--muted);">—</span>`}
        </div>
      `;
    }).join('');
  }

  /* ==========================================================
     25. STUDENT — NOTIFICATIONS
     ========================================================== */
  function renderNotifs(studentId) {
    const notifs = read(K.notifs, [])
      .filter(n => n.userId === studentId)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const unread = notifs.filter(n => !n.read).length;

    // Update badge (try common IDs)
    ['notifsCount', 'notificationsBadge', 'studentNotifsBadge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = unread;
        el.hidden = unread === 0;
      }
    });

    const container = $('#notificationsList') || document.getElementById('notificationsList');
    if (!container) return;

    if (notifs.length === 0) {
      container.innerHTML = `<div class="empty-state">You have no notifications yet. Updates about your bookings will appear here.</div>`;
      return;
    }

    container.innerHTML = notifs.slice(0, 25).map(n => {
      const priorityColor = n.priority === 'urgent' ? '#f87171'
        : n.priority === 'high' ? '#fbbf24'
          : n.priority === 'low' ? '#60a5fa'
            : '#94a3b8';

      return `
        <div class="notif-row ${n.read ? '' : 'unread'}" data-notif-id="${n.id}" style="cursor: pointer;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.3rem;">
            <strong style="color: var(--text); font-size: 0.9rem;">${n.title || 'Notification'}</strong>
            ${n.priority && n.priority !== 'normal'
          ? `<span style="font-size: 0.65rem; font-weight: 700; color: ${priorityColor}; padding: 2px 7px; background: ${priorityColor}18; border: 1px solid ${priorityColor}40; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em;">${n.priority}</span>`
          : ''}
          </div>
          <p style="font-size: 0.82rem; color: var(--muted); margin: 0 0 0.4rem;">${n.message || ''}</p>
          <small style="font-size: 0.72rem; color: var(--muted);">
            ${formatDateTime(n.createdAt)}
            ${!n.read ? ' · <strong style="color: var(--gold-400);">New</strong>' : ''}
          </small>
        </div>
      `;
    }).join('');

    // Mark-as-read on click
    container.querySelectorAll('[data-notif-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.notifId;
        const all = read(K.notifs, []);
        const idx = all.findIndex(x => x.id === id);
        if (idx === -1 || all[idx].read) return;
        all[idx].read = true;
        all[idx].readAt = Date.now();
        write(K.notifs, all);

        const fresh = getSessionStudent();
        if (fresh) renderNotifs(fresh.id);
      });
    });
  }

  /* ==========================================================
     END OF FILE
     ========================================================== */
})();