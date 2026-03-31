const API_BASE = 'https://api.n1l.ru/v1';

async function loadDashboard() {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = '<div class="loading">загрузка данных...</div>';
    
    try {
        const statusRes = await fetch(`${API_BASE}/status.json`);
        const statusData = await statusRes.json();

        const githubRes = await fetch('https://api.github.com/users/vyacheslav-nuykin/events');
        const githubData = await githubRes.json();

        const commitsByDay = {};
        const today = new Date();
        
        githubData.forEach(event => {
            if (event.type === 'PushEvent') {
                const date = new Date(event.created_at).toISOString().split('T')[0];
                const daysDiff = (today - new Date(date)) / (1000 * 60 * 60 * 24);
                if (daysDiff <= 30) {
                    commitsByDay[date] = (commitsByDay[date] || 0) + event.payload.size;
                }
            }
        });

        const sortedDays = Object.keys(commitsByDay).sort();
        const maxCommits = Math.max(...Object.values(commitsByDay), 1);

        dashboard.innerHTML = `
            <div class="card">
                <h2>📈 GitHub активность (последние 30 дней)</h2>
                <div class="commit-chart">
                    ${sortedDays.map(day => `
                        <div style="flex:1; text-align:center;">
                            <div class="commit-bar" style="height: ${(commitsByDay[day] / maxCommits) * 120}px;"></div>
                            <div style="font-size:0.6rem; margin-top:0.3rem;">${day.slice(5)}</div>
                            <div style="font-size:0.7rem;">${commitsByDay[day]}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="card">
                <h2>🟢 статус сервисов</h2>
                ${Object.entries(statusData.services).map(([name, service]) => `
                    <div style="margin: 0.5rem 0; display: flex; justify-content: space-between;">
                        <span>${name}</span>
                        <span class="status-badge status-${service.status}">${service.status}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="card">
                <h2>📦 экосистема n1l</h2>
                <div style="margin: 0.5rem 0;">
                    <div>✅ n1l.ru — лендинг</div>
                    <div>✅ go.n1l.ru — шортлинкер</div>
                    <div>✅ api.n1l.ru — API</div>
                    <div>✅ wiki.n1l.ru — база знаний</div>
                    <div>🚧 dash.n1l.ru — ты здесь</div>
                    <div>📝 cdn.n1l.ru — скоро</div>
                </div>
            </div>
        `;
        
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
    } catch (error) {
        dashboard.innerHTML = '<div class="loading">ошибка загрузки данных :(</div>';
        console.error(error);
    }
}

loadDashboard();
