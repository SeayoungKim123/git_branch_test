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
  todos.push({ id: Date.now(), text, done: false });
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

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "×";
  deleteButton.setAttribute("aria-label", "삭제");
  deleteButton.addEventListener("click", () => deleteTodo(todo.id));

  li.append(checkbox, text, deleteButton);
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
