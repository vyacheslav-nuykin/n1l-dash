const GITHUB_API = "https://api.github.com/users/vyacheslav-nuykin";
const ECOSYSTEM_API = "https://api.n1l.ru/v1";

async function loadDashboard() {
  const dashboard = document.getElementById("dashboard");

  try {
    const [userRes, reposRes, eventsRes, statusRes] = await Promise.all([
      fetch(GITHUB_API),
      fetch(`${GITHUB_API}/repos?per_page=100`),
      fetch(`${GITHUB_API}/events?per_page=100`),
      fetch(`${ECOSYSTEM_API}/status.json`),
    ]);

    const user = await userRes.json();
    const repos = await reposRes.json();
    const events = await eventsRes.json();
    const status = await statusRes.json();

    const ecosystemRepos = repos.filter(
      (repo) => repo.name.startsWith("n1l-") || repo.name.startsWith("1lz-")
    );

    // Расчет коммитов
    const commitsByDay = {};
    const today = new Date();
    events.forEach((event) => {
      if (event.type === "PushEvent") {
        const date = new Date(event.created_at).toISOString().split("T")[0];
        commitsByDay[date] =
          (commitsByDay[date] || 0) + (event.payload.size || 1);
      }
    });

    const sortedDays = Object.keys(commitsByDay).sort().slice(-14); // Берем последние 14 дней для чистоты Google Style
    const maxCommits = Math.max(...Object.values(commitsByDay), 1);

    dashboard.innerHTML = `
            <div class="card" style="grid-column: span 12;">
                <div class="card-content profile-hero">
                    <div class="avatar-circle">
                        <img src="${user.avatar_url}" alt="AV">
                    </div>
                    <div>
                        <h2 style="font-size: 1.5rem; color: #fff;">${
                          user.login
                        }</h2>
                        <p style="color: var(--text-dim);">${
                          user.bio || "Backend Engineer"
                        }</p>
                        <div style="margin-top: 10px; display: flex; gap: 15px; font-size: 0.8rem;">
                            <span><strong>${
                              user.public_repos
                            }</strong> Repos</span>
                            <span><strong>${
                              user.followers
                            }</strong> Followers</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="grid-column: span 8;">
                <div class="card-header"><span class="card-title">Cloud Activity (14d)</span></div>
                <div class="card-content">
                    <div class="chart-wrapper">
                        ${sortedDays
                          .map(
                            (day) => `
                            <div class="bar-group">
                                <div class="bar" style="height: ${
                                  (commitsByDay[day] / maxCommits) * 100
                                }%;"></div>
                                <span class="bar-label">${
                                  day.split("-")[2]
                                }</span>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><span class="card-title">System Status</span></div>
                <div class="card-content">
                    ${Object.entries(status.services)
                      .map(
                        ([name, s]) => `
                        <div class="data-row">
                            <span style="font-size: 0.8rem;">${name}</span>
                            <span class="status-chip status-${s.status}">${s.status}</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>

            <div class="card" style="grid-column: span 6;">
                <div class="card-header"><span class="card-title">Ecosystem Projects</span></div>
                <div class="card-content">
                    ${ecosystemRepos
                      .slice(0, 5)
                      .map(
                        (repo) => `
                        <div class="data-row">
                            <a href="${repo.html_url}" style="color: var(--primary-color); text-decoration: none; font-size: 0.85rem;">${repo.name}</a>
                            <span style="font-size: 0.7rem; color: var(--text-dim);">⭐ ${repo.stargazers_count}</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>

            <div class="card" style="grid-column: span 6;">
                <div class="card-header"><span class="card-title">Recent Logs</span></div>
                <div class="card-content">
                    ${events
                      .slice(0, 5)
                      .map(
                        (e) => `
                        <div class="data-row" style="font-size: 0.75rem;">
                            <span>${e.type.replace(
                              "Event",
                              ""
                            )} <strong style="color: #fff;">${
                          e.repo.name.split("/")[1]
                        }</strong></span>
                            <span style="color: var(--text-dim);">${new Date(
                              e.created_at
                            ).toLocaleTimeString()}</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;

    document.getElementById("timestamp").textContent =
      new Date().toLocaleTimeString();
  } catch (error) {
    dashboard.innerHTML = `<div style="grid-column: span 12; color: #ea4335;">Failed to load resources from Google Cloud API.</div>`;
  }
}

loadDashboard();
