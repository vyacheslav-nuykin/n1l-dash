const GITHUB_API = 'https://api.github.com/users/vyacheslav-nuykin';
const ECOSYSTEM_API = 'https://api.n1l.ru/v1';

async function loadDashboard() {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = '<div class="loading">📡 загрузка данных...</div>';
    
    try {
        const [userRes, reposRes, eventsRes, statusRes] = await Promise.all([
            fetch(GITHUB_API),
            fetch(`${GITHUB_API}/repos?per_page=100`),
            fetch(`${GITHUB_API}/events?per_page=100`),
            fetch(`${ECOSYSTEM_API}/status.json`)
        ]);
        
        const user = await userRes.json();
        const repos = await reposRes.json();
        const events = await eventsRes.json();
        const status = await statusRes.json();
        
        const ecosystemRepos = repos.filter(repo => 
            repo.name.startsWith('n1l-') || repo.name.startsWith('1lz-')
        );
        
        const commitsByDay = {};
        const today = new Date();
        
        events.forEach(event => {
            if (event.type === 'PushEvent') {
                const date = new Date(event.created_at).toISOString().split('T')[0];
                const daysDiff = (today - new Date(date)) / (1000 * 60 * 60 * 24);
                if (daysDiff <= 30) {
                    const commitsCount = event.payload.size || event.payload.distinct_size || 1;
                    commitsByDay[date] = (commitsByDay[date] || 0) + commitsCount;
                }
            }
        });
        
        const sortedDays = Object.keys(commitsByDay).sort();
        const maxCommits = Math.max(...Object.values(commitsByDay), 1);
        
        const recentEvents = events.slice(0, 5).map(event => {
            const typeMap = {
                'PushEvent': '📤 push',
                'CreateEvent': '✨ создал',
                'DeleteEvent': '🗑️ удалил',
                'ForkEvent': '🍴 форкнул',
                'WatchEvent': '⭐ зазвездил'
            };
            return {
                type: typeMap[event.type] || event.type,
                repo: event.repo.name.split('/')[1],
                date: new Date(event.created_at).toLocaleString('ru-RU')
            };
        });
        
        dashboard.innerHTML = `
            <div class="card">
                <h2>👤 ПРОФИЛЬ</h2>
                <div class="profile">
                    <img class="avatar" src="${user.avatar_url}&s=100" alt="avatar">
                    <div class="profile-info">
                        <div class="profile-name">${user.login}</div>
                        <div class="profile-bio">${user.bio || 'backend developer'}</div>
                        <div class="profile-stats">
                            <span>📦 ${user.public_repos}</span>
                            <span>👥 ${user.followers}</span>
                            <span>🎯 ${user.following}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2>📈 АКТИВНОСТЬ (30 ДНЕЙ)</h2>
                <div class="chart-container">
                    <div class="commit-chart">
                        ${sortedDays.map(day => `
                            <div class="chart-bar-wrapper">
                                <div class="commit-bar" style="height: ${(commitsByDay[day] / maxCommits) * 130}px;"></div>
                                <div class="chart-label">${day.slice(5)}</div>
                                <div class="chart-value">${commitsByDay[day]}</div>
                            </div>
                        `).join('')}
                    </div>
                    ${sortedDays.length === 0 ? '<div style="text-align:center;">нет данных</div>' : ''}
                </div>
            </div>
            
            <div class="card">
                <h2>🟢 СТАТУС СЕРВИСОВ</h2>
                ${Object.entries(status.services).map(([name, service]) => `
                    <div class="service-item">
                        <span class="service-name">${name}</span>
                        <span class="status-badge status-${service.status}">${service.status}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="card">
                <h2>📦 ЭКОСИСТЕМА</h2>
                ${ecosystemRepos.map(repo => `
                    <div class="repo-item">
                        <div class="repo-name">
                            <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                        </div>
                        <div class="repo-meta">
                            <span>⭐ ${repo.stargazers_count}</span>
                            <span>🍴 ${repo.forks_count}</span>
                        </div>
                    </div>
                `).join('')}
                ${ecosystemRepos.length === 0 ? '<div>нет репозиториев</div>' : ''}
            </div>
            
            <div class="card">
                <h2>🔄 ПОСЛЕДНИЕ СОБЫТИЯ</h2>
                ${recentEvents.map(event => `
                    <div class="event-item">
                        <div class="event-type">
                            ${event.type} <span class="event-repo">${event.repo}</span>
                        </div>
                        <div class="event-date">${event.date}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('timestamp').textContent = new Date().toLocaleString('ru-RU');
        
    } catch (error) {
        dashboard.innerHTML = '<div class="loading">⚠️ ошибка загрузки данных</div>';
        console.error(error);
    }
}

loadDashboard();
