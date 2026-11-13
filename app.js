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
  todos.push({ id: now, text, done: false, createdAt: now });
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

  li.append(checkbox, body, deleteButton);
  return li;
}

function render() {
  const visibleTodos = getVisibleTodos();

  list.innerHTML = "";
  visibleTodos.forEach((todo) => list.appendChild(createTodoItem(todo)));

  const remaining = todos.filter((todo) => !todo.done).length;
  summary.textContent = `남은 할 일 ${remaining}개 / 전체 ${todos.length}개`;
  empty.hidden = visibleTodos.length > 0;
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
