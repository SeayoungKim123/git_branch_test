// 할 일 데이터는 브라우저 localStorage에 저장한다.
const STORAGE_KEY = "todos";

const form = document.getElementById("add-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const summary = document.getElementById("summary");
const empty = document.getElementById("empty");
const clearDoneButton = document.getElementById("clear-done");
const filterButtons = document.querySelectorAll(".filter");

let todos = loadTodos();
let currentFilter = "all";

// 캘린더 뷰 상태
let currentView = "list";
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDateKey = null; // "YYYY-MM-DD", 아래 toDateKey 정의 후 오늘로 초기화한다.

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function addTodo(text) {
  const now = Date.now();
  let createdAt = now;

  // 캘린더 뷰에서는 선택한 날짜에 추가한다(시각은 현재 시각 유지).
  if (currentView === "calendar") {
    const [yyyy, mm, dd] = selectedDateKey.split("-").map(Number);
    const time = new Date(now);
    createdAt = new Date(yyyy, mm - 1, dd, time.getHours(), time.getMinutes()).getTime();
  }

  todos.push({ id: now, text, done: false, createdAt });
  saveTodos();
  render();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, done: !todo.done } : todo
  );
  saveTodos();
  render();
}

// value는 <input type="date">의 "YYYY-MM-DD" 값이다.
function updateTodoDate(id, value) {
  if (!value) return;
  const [yyyy, mm, dd] = value.split("-").map(Number);
  const createdAt = new Date(yyyy, mm - 1, dd).getTime();
  todos = todos.map((todo) => (todo.id === id ? { ...todo, createdAt } : todo));
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

function clearDone() {
  todos = todos.filter((todo) => !todo.done);
  saveTodos();
  render();
}

// 순서 변경. 화면에 보이는 항목들의 새 순서(orderedIds)를 전체 배열에 반영한다.
// 필터·날짜 때문에 보이지 않는 항목은 제자리를 지키고, 보이는 항목끼리만 자리를 바꾼다.
function reorderVisible(orderedIds) {
  const idSet = new Set(orderedIds);
  const byId = new Map(todos.map((todo) => [todo.id, todo]));
  let index = 0;
  todos = todos.map((todo) => (idSet.has(todo.id) ? byId.get(orderedIds[index++]) : todo));
  saveTodos();
  render();
}

function getListIds(listEl) {
  return [...listEl.children].map((item) => Number(item.dataset.id));
}

// ↑(step = -1) / ↓(step = 1) 버튼으로 한 칸 이동한다.
function moveByStep(li, step) {
  const listEl = li.parentElement;
  const ids = getListIds(listEl);
  const id = Number(li.dataset.id);
  const from = ids.indexOf(id);
  const to = from + step;
  if (to < 0 || to >= ids.length) return;

  [ids[from], ids[to]] = [ids[to], ids[from]];
  reorderVisible(ids);

  // 다시 그린 뒤에도 포커스를 유지해 키보드로 연속 이동할 수 있게 한다.
  const moved = listEl.querySelector(`[data-id="${id}"]`);
  const sameButton = moved.querySelector(step < 0 ? ".move-up" : ".move-down");
  const otherButton = moved.querySelector(step < 0 ? ".move-down" : ".move-up");
  (sameButton.disabled ? otherButton : sameButton).focus();
}

// 핸들을 잡고 끄는 동안 DOM 위치만 바꾸고, 손을 떼면 순서를 저장한다.
// Pointer Events를 써서 마우스와 터치를 함께 지원한다.
function startDrag(event, li) {
  if (event.button !== 0) return;
  const listEl = li.parentElement;
  if (listEl.children.length < 2) return;
  event.preventDefault();

  const before = getListIds(listEl).join();
  li.classList.add("is-dragging");
  document.body.classList.add("is-reordering");

  const onMove = (moveEvent) => {
    const target = [...listEl.children].find((item) => {
      if (item === li) return false;
      const rect = item.getBoundingClientRect();
      return moveEvent.clientY < rect.top + rect.height / 2;
    });
    if (target) listEl.insertBefore(li, target);
    else listEl.appendChild(li);
  };

  const onEnd = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onEnd);
    window.removeEventListener("pointercancel", onEnd);
    li.classList.remove("is-dragging");
    document.body.classList.remove("is-reordering");

    const ids = getListIds(listEl);
    if (ids.join() !== before) reorderVisible(ids);
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onEnd);
  window.addEventListener("pointercancel", onEnd);
}

// 맨 위 항목의 ↑, 맨 아래 항목의 ↓는 비활성화한다.
function updateMoveButtons(listEl) {
  const items = [...listEl.children];
  items.forEach((item, index) => {
    item.querySelector(".move-up").disabled = index === 0;
    item.querySelector(".move-down").disabled = index === items.length - 1;
  });
}

function getVisibleTodos() {
  if (currentFilter === "active") return todos.filter((todo) => !todo.done);
  if (currentFilter === "done") return todos.filter((todo) => todo.done);
  return todos;
}

// 타임스탬프를 "2026.11.13" 형식으로 변환한다.
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

// 타임스탬프를 "2026-11-13" 형식(<input type="date"> 값, 날짜 키)으로 변환한다.
function toDateKey(timestamp) {
  return formatDate(timestamp).replaceAll(".", "-");
}

function getTodoTime(todo) {
  // createdAt이 없는 기존 데이터는 생성 시각이 담긴 id로 대체한다.
  return todo.createdAt ?? todo.id;
}

function createTodoItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item" + (todo.done ? " is-done" : "");
  li.dataset.id = todo.id;

  const handle = document.createElement("span");
  handle.className = "drag-handle";
  handle.textContent = "⠿";
  handle.title = "끌어서 순서 변경";
  handle.setAttribute("aria-hidden", "true"); // 키보드·스크린리더는 ↑↓ 버튼을 사용한다.
  handle.addEventListener("pointerdown", (event) => startDrag(event, li));

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.setAttribute("aria-label", "완료 표시");
  checkbox.addEventListener("change", () => toggleTodo(todo.id));

  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.text;

  // 날짜 텍스트를 누르면 숨겨진 date input의 달력을 연다.
  const dateWrap = document.createElement("span");
  dateWrap.className = "todo-date-wrap";

  const dateButton = document.createElement("button");
  dateButton.type = "button";
  dateButton.className = "todo-date";
  dateButton.textContent = `${formatDate(getTodoTime(todo))} 등록`;
  dateButton.title = "날짜 변경";
  dateButton.setAttribute("aria-label", `날짜 변경, 현재 ${formatDate(getTodoTime(todo))}`);

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "todo-date-input";
  dateInput.value = toDateKey(getTodoTime(todo));
  dateInput.tabIndex = -1;
  dateInput.setAttribute("aria-hidden", "true");
  dateInput.addEventListener("change", () => updateTodoDate(todo.id, dateInput.value));

  dateButton.addEventListener("click", () => {
    try {
      dateInput.showPicker();
    } catch {
      dateInput.focus();
      dateInput.click();
    }
  });

  dateWrap.append(dateButton, dateInput);

  const body = document.createElement("div");
  body.className = "todo-body";
  body.append(text, dateWrap);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "×";
  deleteButton.setAttribute("aria-label", "삭제");
  deleteButton.addEventListener("click", () => deleteTodo(todo.id));

  const moveButtons = document.createElement("div");
  moveButtons.className = "move-buttons";
  [
    { className: "move-up", label: "위로 이동", icon: "▲", step: -1 },
    { className: "move-down", label: "아래로 이동", icon: "▼", step: 1 },
  ].forEach(({ className, label, icon, step }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `move-button ${className}`;
    button.textContent = icon;
    button.setAttribute("aria-label", `${todo.text} ${label}`);
    button.addEventListener("click", () => moveByStep(li, step));
    moveButtons.append(button);
  });

  li.append(handle, checkbox, body, moveButtons, deleteButton);
  return li;
}

function render() {
  const visibleTodos = getVisibleTodos();

  list.innerHTML = "";
  visibleTodos.forEach((todo) => list.appendChild(createTodoItem(todo)));
  updateMoveButtons(list);

  const remaining = todos.filter((todo) => !todo.done).length;
  summary.textContent = `남은 할 일 ${remaining}개 / 전체 ${todos.length}개`;
  empty.hidden = visibleTodos.length > 0;

  renderCalendar();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle("is-active", b === button));
    render();
  });
});

clearDoneButton.addEventListener("click", clearDone);

// 캘린더 뷰. 날짜 기준은 항목의 날짜(createdAt)이다.
const viewTabs = document.querySelectorAll(".view-tab");
const listView = document.getElementById("list-view");
const calendarView = document.getElementById("calendar-view");
const calendarTitle = document.getElementById("calendar-title");
const calendarGrid = document.getElementById("calendar-grid");
const dayTitle = document.getElementById("day-title");
const dayList = document.getElementById("day-list");
const dayEmpty = document.getElementById("day-empty");

selectedDateKey = toDateKey(Date.now());

function groupTodosByDate() {
  const groups = {};
  todos.forEach((todo) => {
    const key = toDateKey(getTodoTime(todo));
    (groups[key] ||= []).push(todo);
  });
  return groups;
}

function createCalendarDay(year, month, day, dayTodos, todayKey) {
  const key = toDateKey(new Date(year, month, day).getTime());
  const isSelected = key === selectedDateKey;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "calendar-day";
  button.classList.toggle("is-today", key === todayKey);
  button.classList.toggle("is-selected", isSelected);
  button.setAttribute("aria-pressed", String(isSelected));
  button.setAttribute("aria-label", `${month + 1}월 ${day}일, 할 일 ${dayTodos.length}개`);

  const number = document.createElement("span");
  number.className = "day-number";
  number.textContent = day;
  button.append(number);

  if (dayTodos.length > 0) {
    const count = document.createElement("span");
    count.className = "day-count";
    count.textContent = `•${dayTodos.length}`;
    count.classList.toggle("is-all-done", dayTodos.every((todo) => todo.done));
    button.append(count);
  }

  button.addEventListener("click", () => {
    selectedDateKey = key;
    render();
  });
  return button;
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const groups = groupTodosByDate();
  const todayKey = toDateKey(Date.now());

  calendarTitle.textContent = `${year}년 ${month + 1}월`;
  calendarGrid.innerHTML = "";

  // 1일 앞의 빈 칸
  const firstWeekday = new Date(year, month, 1).getDay();
  for (let i = 0; i < firstWeekday; i++) {
    calendarGrid.appendChild(document.createElement("span"));
  }

  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= lastDate; day++) {
    const key = toDateKey(new Date(year, month, day).getTime());
    calendarGrid.appendChild(createCalendarDay(year, month, day, groups[key] || [], todayKey));
  }

  // 선택한 날짜의 할 일
  const [, mm, dd] = selectedDateKey.split("-").map(Number);
  const selectedTodos = groups[selectedDateKey] || [];
  dayTitle.textContent = `${mm}월 ${dd}일 할 일`;
  dayList.innerHTML = "";
  selectedTodos.forEach((todo) => dayList.appendChild(createTodoItem(todo)));
  updateMoveButtons(dayList);
  dayEmpty.hidden = selectedTodos.length > 0;
}

function setView(view) {
  currentView = view;
  viewTabs.forEach((tab) => {
    const isActive = tab.dataset.view === view;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  listView.hidden = view !== "list";
  calendarView.hidden = view !== "calendar";
}

function moveMonth(offset) {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
  renderCalendar();
}

viewTabs.forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
document.getElementById("prev-month").addEventListener("click", () => moveMonth(-1));
document.getElementById("next-month").addEventListener("click", () => moveMonth(1));

// 다크/라이트 모드. 초기 테마는 index.html <head>에서 먼저 적용된다.
const THEME_KEY = "theme";
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
}

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

applyTheme(document.documentElement.dataset.theme || "light");

render();



getUser();