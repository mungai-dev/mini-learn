// --- Demo data (can be swapped for a JSON fetch later) ---
const courses = [
    {
      id: "html-basics",
      title: "HTML Basics",
      description: "Learn the structure of the web with tags, elements, and semantic HTML.",
      lessons: [
        { id: "h1", title: "Intro to HTML" },
        { id: "h2", title: "Common Tags" },
        { id: "h3", title: "Semantic Elements" },
        { id: "h4", title: "Forms & Inputs" }
      ]
    },
    {
      id: "css-fundamentals",
      title: "CSS Fundamentals",
      description: "Style pages using selectors, box model, layout, and modern techniques.",
      lessons: [
        { id: "c1", title: "Selectors & Specificity" },
        { id: "c2", title: "Box Model" },
        { id: "c3", title: "Flexbox & Grid" },
        { id: "c4", title: "Responsive Design" }
      ]
    },
    {
      id: "js-essentials",
      title: "JavaScript Essentials",
      description: "Add interactivity with variables, functions, DOM, and events.",
      lessons: [
        { id: "j1", title: "Variables & Types" },
        { id: "j2", title: "Functions & Scope" },
        { id: "j3", title: "DOM Manipulation" },
        { id: "j4", title: "Events & Listeners" }
      ]
    }
  ];
  
  // --- Auth (prototype) ---
  const USER_KEY = "elearn_user_v1";
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; }
    catch { return null; }
  }
  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  function logoutUser() {
    localStorage.removeItem(USER_KEY);
  }
  function currentUserId() {
    const u = getUser();
    return u && u.id ? u.id : "guest";
  }
  function currentUserName() {
    const u = getUser();
    return u && u.name ? u.name : "Guest";
  }
  function initials(name) {
    return (name || "")
      .split(/\s+/).filter(Boolean).slice(0,2)
      .map(s => s[0]?.toUpperCase()).join("") || "G";
  }
  
  // --- Simple persistence with localStorage (per user) ---
  const STORAGE_KEY_PREFIX = "elearn_progress_v1";
  function storageKey() {
    return `${STORAGE_KEY_PREFIX}:${currentUserId()}`;
  }
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(storageKey())) || {}; }
    catch { return {}; }
  }
  function saveProgress(state) {
    localStorage.setItem(storageKey(), JSON.stringify(state));
  }
  function getCourseState(courseId) {
    const state = loadProgress();
    return state[courseId] || { completedLessons: {}, completed: false };
  }
  function setCourseState(courseId, next) {
    const state = loadProgress();
    state[courseId] = next;
    saveProgress(state);
  }
  
  // --- Helpers ---
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function percent(done, total) { return total === 0 ? 0 : Math.round((done / total) * 100); }
  
  function courseById(id) { return courses.find(c => c.id === id); }
  
  function computeProgress(courseId) {
    const course = courseById(courseId);
    const state = getCourseState(courseId);
    const total = course.lessons.length;
    const done = Object.values(state.completedLessons).filter(Boolean).length;
    const pct = percent(done, total);
    return { done, total, pct, completed: state.completed };
  }
  
  // --- Rendering: Auth UI ---
  function renderAuth() {
    const mount = qs("#auth-area");
    if (!mount) return;
    mount.innerHTML = "";
  
    const user = getUser();
    if (!user) {
      const btn = document.createElement("button");
      btn.className = "btn auth-btn";
      btn.textContent = "Sign in";
      btn.addEventListener("click", openAuthModal);
      mount.appendChild(btn);
      const hint = document.createElement("div");
      hint.className = "meta";
      hint.textContent = "Guest mode";
      mount.appendChild(hint);
    } else {
      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = initials(user.name);
      avatar.title = user.name;
      mount.appendChild(avatar);
  
      const nameEl = document.createElement("div");
      nameEl.className = "meta";
      nameEl.textContent = user.name;
      mount.appendChild(nameEl);
  
      const out = document.createElement("button");
      out.className = "btn";
      out.textContent = "Log out";
      out.addEventListener("click", () => {
        logoutUser();
        renderAuth();
        render(); // re-render to switch progress to guest
      });
      mount.appendChild(out);
    }
  }
  
  function openAuthModal() {
    const modal = qs("#auth-modal");
    modal.classList.remove("hidden");
    const nameInput = qs("#auth-name", modal);
    if (nameInput) {
      nameInput.value = "";
      nameInput.focus();
    }
  }
  function closeAuthModal() {
    const modal = qs("#auth-modal");
    modal.classList.add("hidden");
  }
  function setupAuthModal() {
    const modal = qs("#auth-modal");
    const form = qs("#auth-form", modal);
    const closeBtn = qs("#auth-close", modal);
    const cancelBtn = qs("#auth-cancel", modal);
  
    closeBtn.addEventListener("click", closeAuthModal);
    cancelBtn.addEventListener("click", closeAuthModal);
  
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeAuthModal();
    });
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = qs("#auth-name", form).value.trim();
      const email = qs("#auth-email", form).value.trim();
      if (!name) return;
  
      // Simple user model
      const id = name.toLowerCase().replace(/\s+/g, "-").slice(0, 40) || "user";
      setUser({ id, name, email });
      closeAuthModal();
      renderAuth();
      render(); // re-render to reflect user-scoped progress
    });
  }
  
  // --- Rendering: Home list ---
  function renderHome() {
    const app = qs("#app");
    app.innerHTML = "";
  
    const heading = document.createElement("div");
    heading.className = "row";
    heading.innerHTML = `
      <div>
        <h2 style="margin:0 0 6px 0;">Courses</h2>
        <div class="meta">Welcome, ${currentUserName()}. Browse the catalog and track your progress.</div>
      </div>
    `;
    app.appendChild(heading);
  
    const grid = document.createElement("div");
    grid.className = "grid";
  
    courses.forEach(course => {
      const { pct, completed } = computeProgress(course.id);
  
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${course.title}</h3>
        <p>${course.description}</p>
  
        <div class="progress" style="margin:10px 0 8px;">
          <span style="width:${pct}%;"></span>
        </div>
        <div class="row" style="justify-content:space-between;">
          <div class="meta">${pct}% complete</div>
          ${completed ? `<span class="badge">Completed</span>` : ""}
        </div>
  
        <div class="row" style="margin-top:12px; justify-content:space-between;">
          <a class="btn primary" href="#/course/${course.id}">View Course</a>
          <button class="btn" data-complete="${course.id}">${completed ? "Mark Incomplete" : "Mark Completed"}</button>
        </div>
      `;
      grid.appendChild(card);
    });
  
    app.appendChild(grid);
  
    // Inline "Mark Completed" on home cards
    app.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-complete]");
      if (!btn) return;
      const id = btn.getAttribute("data-complete");
      const next = getCourseState(id);
      next.completed = !next.completed;
      // when marking complete, mark all lessons
      if (next.completed) {
        const course = courseById(id);
        course.lessons.forEach(l => { next.completedLessons[l.id] = true; });
      }
      saveProgress({ ...loadProgress(), [id]: next });
      renderHome();
    }, { once: true });
  }
  
  // --- Rendering: Course detail ---
  function renderCourse(courseId) {
    const course = courseById(courseId);
    const app = qs("#app");
    app.innerHTML = "";
  
    if (!course) {
      app.innerHTML = `
        <a class="back-link" href="#/">&larr; Back</a>
        <div class="card"><p>Course not found.</p></div>
      `;
      return;
    }
  
    const state = getCourseState(courseId);
    const { pct, done, total } = computeProgress(courseId);
  
    const back = document.createElement("a");
    back.className = "back-link";
    back.href = "#/";
    back.innerHTML = "&larr; Back to courses";
    app.appendChild(back);
  
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h2 style="margin:0 0 6px 0;">${course.title}</h2>
      <p>${course.description}</p>
  
      <div class="progress" style="margin:12px 0 6px;">
        <span style="width:${pct}%;"></span>
      </div>
      <div class="row" style="justify-content:space-between; margin-bottom:8px;">
        <div class="meta">${done}/${total} lessons completed (${pct}%)</div>
        ${state.completed ? `<span class="badge">Completed</span>` : ""}
      </div>
  
      <div class="lesson-list" id="lesson-list"></div>
  
      <div class="row" style="margin-top:12px; justify-content:space-between;">
        <button class="btn" id="reset-progress">Reset Progress</button>
        <div class="row">
          <button class="btn" id="mark-all">Mark All Lessons</button>
          <button class="btn primary" id="mark-completed">${state.completed ? "Mark as Incomplete" : "Mark Course as Completed"}</button>
        </div>
      </div>
    `;
    app.appendChild(card);
  
    // Render lessons with checkboxes
    const list = qs("#lesson-list", card);
    list.innerHTML = "";
    course.lessons.forEach(lesson => {
      const checked = !!state.completedLessons[lesson.id];
      const item = document.createElement("label");
      item.className = "lesson-item";
      item.innerHTML = `
        <input type="checkbox" ${checked ? "checked" : ""} data-lesson="${lesson.id}" />
        <div>${lesson.title}</div>
      `;
      list.appendChild(item);
    });
  
    // Handlers
    list.addEventListener("change", (e) => {
      const input = e.target;
      if (input && input.matches('input[type="checkbox"]')) {
        const lid = input.getAttribute("data-lesson");
        const next = getCourseState(courseId);
        next.completedLessons[lid] = input.checked;
        next.completed = Object.values(next.completedLessons).length === course.lessons.length &&
                         Object.values(next.completedLessons).every(Boolean);
        setCourseState(courseId, next);
        renderCourse(courseId); // re-render to update progress bar/badge/button
      }
    });
  
    qs("#mark-all", card).addEventListener("click", () => {
      const next = getCourseState(courseId);
      course.lessons.forEach(l => { next.completedLessons[l.id] = true; });
      next.completed = true;
      setCourseState(courseId, next);
      renderCourse(courseId);
    });
  
    qs("#mark-completed", card).addEventListener("click", () => {
      const next = getCourseState(courseId);
      const target = !next.completed;
      course.lessons.forEach(l => { next.completedLessons[l.id] = target ? true : !!next.completedLessons[l.id]; });
      next.completed = target;
      // if toggling to incomplete, do not forcibly uncheck lessons—user can manage per-lesson
      setCourseState(courseId, next);
      renderCourse(courseId);
    });
  
    qs("#reset-progress", card).addEventListener("click", () => {
      setCourseState(courseId, { completedLessons: {}, completed: false });
      renderCourse(courseId);
    });
  }
  
  // --- Tiny router (#/ and #/course/:id) ---
  function parseRoute() {
    const hash = location.hash || "#/";
    const parts = hash.replace(/^#\//, "").split("/");
    if (!parts[0]) return { name: "home" };
    if (parts[0] === "course" && parts[1]) return { name: "course", id: parts[1] };
    return { name: "home" };
  }
  
  function render() {
    const route = parseRoute();
    if (route.name === "course") {
      renderCourse(route.id);
    } else {
      renderHome();
    }
  }
  
  // Init
  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", () => {
    setupAuthModal();
    renderAuth();
    render();
  });