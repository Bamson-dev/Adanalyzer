const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const statsGrid = document.getElementById("statsGrid");
const logoutBtn = document.getElementById("logoutBtn");

const TOKEN_KEY = "adanalyzer_admin_token";

function metric(label, value) {
  return `<article class="stat"><div class="name">${label}</div><div class="value">${value}</div></article>`;
}

async function loadStats() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  const res = await fetch("/api/admin-stats", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch admin stats.");
  const s = await res.json();

  statsGrid.innerHTML = [
    metric("Total Visitors", s.totalVisitors),
    metric("Today Visitors", s.todayVisitors),
    metric("Total Analyses", s.totalAnalyses),
    metric("Today Analyses", s.todayAnalyses),
    metric("7-Day Analyses", s.last7DaysAnalyses),
    metric("Conversion Rate", `${s.conversionRate}%`),
    metric("Share Rate", `${s.shareRate}%`),
    metric("Error Rate", `${s.errorRate}%`),
    metric("Success Rate", `${s.successRate}%`),
    metric("Avg Analysis Time", `${s.avgAnalysisTime}s`),
  ].join("");
}

function showDashboard() {
  loginCard.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error || "Login failed");

    localStorage.setItem(TOKEN_KEY, data.token);
    showDashboard();
    await loadStats();
  } catch (error) {
    loginError.textContent = String(error.message || error);
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  location.reload();
});

(async function init() {
  if (localStorage.getItem(TOKEN_KEY)) {
    showDashboard();
    try {
      await loadStats();
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      location.reload();
    }
  }
})();
