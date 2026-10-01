"use strict";

// Keep app data in one place so each screen section uses the same calculations.
const STORAGE_KEY = "pocketSmartAIData";
const CATEGORIES = ["Food", "Travel", "Education", "Shopping", "Bills", "Other"];
const CATEGORY_COLORS = {
  Food: "#e98170",
  Travel: "#dfac4d",
  Education: "#738fc1",
  Shopping: "#9b79b9",
  Bills: "#54a28a",
  Other: "#a6a0ad"
};
const CATEGORY_ICONS = {
  Food: "◉",
  Travel: "➜",
  Education: "▤",
  Shopping: "◇",
  Bills: "▣",
  Other: "•••"
};
const MAX_AMOUNT = 100000000;
const today = new Date();
let state = loadData();
let toastTimer;

const elements = {
  budgetForm: document.querySelector("#budget-form"),
  budgetInput: document.querySelector("#budget-input"),
  budgetError: document.querySelector("#budget-error"),
  expenseForm: document.querySelector("#expense-form"),
  expenseName: document.querySelector("#expense-name"),
  expenseAmount: document.querySelector("#expense-amount"),
  expenseDate: document.querySelector("#expense-date"),
  expenseCategory: document.querySelector("#expense-category"),
  expenseError: document.querySelector("#expense-error"),
  totalSpent: document.querySelector("#total-spent"),
  remainingBalance: document.querySelector("#remaining-balance"),
  expenseCount: document.querySelector("#expense-count"),
  budgetPercent: document.querySelector("#budget-percent"),
  budgetStatus: document.querySelector("#budget-status"),
  progressTrack: document.querySelector("#progress-track"),
  progressFill: document.querySelector("#progress-fill"),
  budgetNotice: document.querySelector("#budget-notice"),
  transactionList: document.querySelector("#transaction-list"),
  historyCount: document.querySelector("#history-count"),
  chart: document.querySelector("#category-chart"),
  chartLayout: document.querySelector("#chart-layout"),
  chartEmpty: document.querySelector("#chart-empty"),
  chartLegend: document.querySelector("#chart-legend"),
  chartTotal: document.querySelector("#chart-total"),
  recommendation: document.querySelector("#recommendation-body"),
  toast: document.querySelector("#toast")
};

// Load saved data safely; a broken or older saved value starts with a clean budget.
function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isFinite(saved.budget) && Array.isArray(saved.expenses)) {
      return {
        budget: Math.max(0, saved.budget),
        expenses: saved.expenses.filter(isValidExpense)
      };
    }
  } catch (error) {
    console.warn("Saved budget data could not be read.", error);
  }
  return { budget: 0, expenses: [] };
}

function isValidExpense(expense) {
  return expense && typeof expense.id === "string" &&
    typeof expense.name === "string" && expense.name.trim().length > 0 &&
    Number.isFinite(expense.amount) && expense.amount > 0 &&
    CATEGORIES.includes(expense.category) && isValidDate(expense.date);
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Write changes once, then repaint every view from the same state.
function saveAndRender(message) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast("Could not save data in this browser. Check available storage.");
    console.error("Budget data could not be saved.", error);
    return;
  }
  renderDashboard();
  if (message) showToast(message);
}

function getThisMonthExpenses() {
  const month = toLocalDateString(today).slice(0, 7);
  return state.expenses.filter((expense) => expense.date.slice(0, 7) === month);
}

function formatRupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T00:00:00`));
}

function renderDashboard() {
  const monthExpenses = getThisMonthExpenses();
  const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = state.budget - total;
  const used = state.budget > 0 ? (total / state.budget) * 100 : 0;
  const safePercent = Math.max(0, Math.min(100, used));

  elements.budgetInput.value = state.budget || "";
  elements.totalSpent.textContent = formatRupees(total);
  elements.remainingBalance.textContent = formatRupees(Math.max(0, remaining));
  elements.expenseCount.textContent = `${monthExpenses.length} ${monthExpenses.length === 1 ? "expense" : "expenses"} this month`;
  elements.budgetPercent.textContent = `${Math.round(used)}%`;
  elements.progressFill.style.width = `${safePercent}%`;
  elements.progressFill.className = `progress-fill${used >= 100 ? " danger" : used >= 80 ? " warning" : ""}`;
  elements.progressTrack.setAttribute("aria-valuenow", String(Math.round(safePercent)));
  elements.budgetStatus.textContent = state.budget > 0
    ? (remaining < 0 ? `${formatRupees(Math.abs(remaining))} over your limit` : `${formatRupees(remaining)} left to spend`)
    : "Set a budget to track your progress";

  elements.budgetNotice.hidden = !(state.budget > 0 && used >= 80);
  elements.budgetNotice.classList.toggle("over-budget", used >= 100);
  if (used >= 100) {
    elements.budgetNotice.textContent = `You are ${formatRupees(total - state.budget)} over budget this month. Pause and review upcoming expenses.`;
  } else if (used >= 80) {
    elements.budgetNotice.textContent = `You have used ${Math.round(used)}% of your budget. ${formatRupees(remaining)} remains for the month.`;
  }

  renderTransactions();
  renderChart(monthExpenses, total);
  renderRecommendation(monthExpenses, total, used, remaining);
}

function renderTransactions() {
  const sortedExpenses = [...state.expenses].sort((first, second) =>
    second.date.localeCompare(first.date) || second.id.localeCompare(first.id));
  elements.historyCount.textContent = `${sortedExpenses.length} ${sortedExpenses.length === 1 ? "entry" : "entries"}`;

  if (sortedExpenses.length === 0) {
    elements.transactionList.innerHTML = '<div class="empty-state"><span aria-hidden="true">＋</span><strong>No expenses yet</strong><br>Add your first expense to start tracking.</div>';
    return;
  }

  elements.transactionList.innerHTML = sortedExpenses.slice(0, 8).map((expense) => `
    <article class="transaction-item">
      <span class="category-icon" aria-hidden="true">${CATEGORY_ICONS[expense.category]}</span>
      <div><div class="transaction-name">${escapeHTML(expense.name)}</div><div class="transaction-meta">${expense.category} · ${formatDate(expense.date)}</div></div>
      <strong class="transaction-amount">${formatRupees(expense.amount)}</strong>
      <button class="delete-button" type="button" data-delete-id="${escapeHTML(expense.id)}" aria-label="Delete ${escapeHTML(expense.name)}" title="Delete expense">×</button>
    </article>`).join("");
}

function renderChart(expenses, total) {
  elements.chartTotal.textContent = formatRupees(total);
  elements.chartLayout.hidden = expenses.length === 0;
  elements.chartEmpty.hidden = expenses.length > 0;
  elements.chartLegend.replaceChildren();

  const totals = CATEGORIES.map((category) => ({
    category,
    amount: expenses.filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0)
  })).filter((entry) => entry.amount > 0);

  totals.forEach(({ category, amount }) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-dot" style="background:${CATEGORY_COLORS[category]}"></span><span>${category}</span><strong>${formatRupees(amount)}</strong>`;
    elements.chartLegend.append(item);
  });
  drawDoughnutChart(totals, total);
}

// Draw a small canvas chart so the dashboard works without an external chart service.
function drawDoughnutChart(totals, total) {
  const canvas = elements.chart;
  const context = canvas.getContext("2d");
  if (!context) return;
  const size = Math.max(120, Math.round(canvas.clientWidth || 170));
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = size * pixelRatio;
  canvas.height = size * pixelRatio;
  context.scale(pixelRatio, pixelRatio);

  const center = size / 2;
  const radius = size * .39;
  const lineWidth = size * .13;
  context.clearRect(0, 0, size, size);
  context.lineWidth = lineWidth;
  context.lineCap = "butt";
  context.strokeStyle = "#f0edf3";
  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.stroke();

  if (total <= 0) return;
  let angle = -Math.PI / 2;
  totals.forEach(({ category, amount }) => {
    const nextAngle = angle + (amount / total) * Math.PI * 2;
    context.beginPath();
    context.strokeStyle = CATEGORY_COLORS[category];
    context.arc(center, center, radius, angle, nextAngle);
    context.stroke();
    angle = nextAngle;
  });
}

function renderRecommendation(expenses, total, used, remaining) {
  let message = "Add your monthly budget and a few expenses to get a useful spending check-in.";
  if (state.budget > 0 && used >= 100) {
    message = `Your spending is ${formatRupees(total - state.budget)} above your monthly plan. Review recent purchases and consider pausing non-essential spending.`;
  } else if (state.budget > 0 && used >= 80) {
    message = `You have ${formatRupees(remaining)} left. Keep essentials first and check your Shopping and Other spending before your next purchase.`;
  } else if (state.budget > 0 && expenses.length > 0) {
    const categoryTotals = CATEGORIES.map((category) => ({
      category,
      amount: expenses.filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0)
    })).filter((item) => item.amount > 0).sort((first, second) => second.amount - first.amount);
    const highest = categoryTotals[0];
    message = highest
      ? `${highest.category} is your biggest category at ${formatRupees(highest.amount)}. You have used ${Math.round(used)}% of your budget, so keep tracking and check in again later this month.`
      : "Your budget is looking steady. Keep adding expenses to spot patterns as they emerge.";
  } else if (state.budget > 0) {
    message = "Your budget is ready. Add expenses as they happen to see where your money goes.";
  }
  elements.recommendation.innerHTML = `<span class="recommendation-bullet" aria-hidden="true">✦</span><p>${escapeHTML(message)}</p>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2600);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadDemoData() {
  const dateFor = (daysAgo) => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return toLocalDateString(date);
  };
  state = {
    budget: 18000,
    expenses: [
      { id: createId(), name: "Weekly groceries", amount: 1850, category: "Food", date: dateFor(0) },
      { id: createId(), name: "Metro card top-up", amount: 600, category: "Travel", date: dateFor(1) },
      { id: createId(), name: "Course workbook", amount: 1250, category: "Education", date: dateFor(2) },
      { id: createId(), name: "Mobile bill", amount: 499, category: "Bills", date: dateFor(4) },
      { id: createId(), name: "Cafe lunch", amount: 320, category: "Food", date: dateFor(5) }
    ]
  };
  saveAndRender("Demo budget and expenses loaded.");
}

elements.budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(elements.budgetInput.value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    elements.budgetError.textContent = "Enter a budget above ₹0 and no more than ₹10 crore.";
    return;
  }
  elements.budgetError.textContent = "";
  state.budget = amount;
  saveAndRender("Monthly budget updated.");
});

elements.expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.expenseName.value.trim();
  const amount = Number(elements.expenseAmount.value);
  const date = elements.expenseDate.value;
  const category = elements.expenseCategory.value;
  if (!name || name.length > 60) {
    elements.expenseError.textContent = "Enter a name up to 60 characters long.";
    elements.expenseName.focus();
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    elements.expenseError.textContent = "Enter an amount above ₹0 and no more than ₹10 crore.";
    elements.expenseAmount.focus();
    return;
  }
  if (!isValidDate(date) || date > toLocalDateString(today)) {
    elements.expenseError.textContent = "Choose a valid date that is not in the future.";
    elements.expenseDate.focus();
    return;
  }
  if (!CATEGORIES.includes(category)) {
    elements.expenseError.textContent = "Choose one of the listed categories.";
    return;
  }

  state.expenses.push({ id: createId(), name, amount, category, date });
  elements.expenseError.textContent = "";
  elements.expenseForm.reset();
  elements.expenseDate.value = toLocalDateString(today);
  saveAndRender("Expense added.");
});

elements.transactionList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;
  state.expenses = state.expenses.filter((expense) => expense.id !== button.dataset.deleteId);
  saveAndRender("Expense deleted.");
});

document.querySelector("#demo-button").addEventListener("click", () => {
  if (window.confirm("Replace your saved budget and expenses with the sample demo data?")) loadDemoData();
});

window.addEventListener("resize", () => {
  if (elements.chartLayout && !elements.chartLayout.hidden) {
    const monthExpenses = getThisMonthExpenses();
    const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totals = CATEGORIES.map((category) => ({
      category,
      amount: monthExpenses.filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0)
    })).filter((entry) => entry.amount > 0);
    drawDoughnutChart(totals, total);
  }
});

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric"
}).format(today);
document.querySelector("#current-month-label").textContent = new Intl.DateTimeFormat("en-IN", {
  month: "long", year: "numeric"
}).format(today).toUpperCase();
elements.expenseDate.value = toLocalDateString(today);
renderDashboard();