const GITHUB_API = 'https://api.github.com/users/vyacheslav-nuykin';
const ECOSYSTEM_API = 'https://api.n1l.ru/v1';

async function loadDashboard() {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = '<div class="loading">загрузка данных...</div>';
    
    try {
        // Параллельно загружаем все данные
        const [userRes, reposRes, eventsRes, statusRes] = await Promise.all([
            fetch(GITHUB_API),
            fetch(`${GITHUB_API}/repos?per_page=100`),
            fetch(`${GITHUB_API}/events?per_page=100`),
            fetch(`${ECOSYSTEM_API}/status.json`)
        ]);
        
        const user = await userRes.json();
        let repos = await reposRes.json();
        const events = await eventsRes.json();
        const status = await statusRes.json();
        
        // Фильтруем репозитории экосистемы
        const ecosystemRepos = repos.filter(repo => 
            repo.name.startsWith('n1l-') || repo.name.startsWith('1lz-')
        );
        
        // Считаем коммиты правильно
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
        
        // Собираем последние 5 событий
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
                date: new Date(event.created_at).toLocaleString()
            };
        });
        
        // Строим HTML
        dashboard.innerHTML = `
            <!-- Виджет 1: Профиль -->
            <div class="card">
                <h2>👤 GitHub профиль</h2>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${user.avatar_url}&s=80" style="border-radius: 50%; width: 60px;">
                    <div>
                        <div style="font-size: 1.2rem; font-weight: 800;">${user.login}</div>
                        <div style="font-size: 0.8rem; color: #4682dc;">${user.bio || 'разработчик'}</div>
                        <div style="font-size: 0.7rem; margin-top: 0.3rem;">
                            📦 ${user.public_repos} репозиториев • 👥 ${user.followers} подписчиков
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Виджет 2: График коммитов -->
            <div class="card">
                <h2>📈 активность (последние 30 дней)</h2>
                <div class="commit-chart">
                    ${sortedDays.map(day => `
                        <div style="flex:1; text-align:center;">
                            <div class="commit-bar" style="height: ${(commitsByDay[day] / maxCommits) * 120}px;"></div>
                            <div style="font-size:0.6rem; margin-top:0.3rem;">${day.slice(5)}</div>
                            <div style="font-size:0.7rem;">${commitsByDay[day]}</div>
                        </div>
                    `).join('')}
                </div>
                ${sortedDays.length === 0 ? '<div style="text-align:center;">нет данных за последние 30 дней</div>' : ''}
            </div>
            
            <!-- Виджет 3: Статус экосистемы -->
            <div class="card">
                <h2>🟢 статус сервисов</h2>
                ${Object.entries(status.services).map(([name, service]) => `
                    <div style="margin: 0.5rem 0; display: flex; justify-content: space-between;">
                        <span>${name}</span>
                        <span class="status-badge status-${service.status}">${service.status}</span>
                    </div>
                `).join('')}
            </div>
            
            <!-- Виджет 4: Репозитории экосистемы -->
            <div class="card">
                <h2>📦 экосистема n1l</h2>
                ${ecosystemRepos.map(repo => `
                    <div style="margin: 0.5rem 0; display: flex; justify-content: space-between;">
                        <span><a href="${repo.html_url}" style="color:#b8c7ff;">${repo.name}</a></span>
                        <span style="font-size:0.7rem;">
                            ⭐ ${repo.stargazers_count} • 🍴 ${repo.forks_count}
                        </span>
                    </div>
                `).join('')}
                ${ecosystemRepos.length === 0 ? '<div>нет репозиториев</div>' : ''}
            </div>
            
            <!-- Виджет 5: Последние события -->
            <div class="card">
                <h2>🔄 последние события</h2>
                ${recentEvents.map(event => `
                    <div style="margin: 0.5rem 0; font-size:0.8rem;">
                        ${event.type} <strong>${event.repo}</strong>
                        <div style="font-size:0.6rem; color:#4682dc;">${event.date}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
    } catch (error) {
        dashboard.innerHTML = '<div class="loading">ошибка загрузки данных :(</div>';
        console.error(error);
    }
}

loadDashboard();
