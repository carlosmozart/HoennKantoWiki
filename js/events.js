class LiveEvents {
    constructor() {
        this.init();
    }

    init() {
        this.renderWidget();
        this.updateEvents();
        // Atualiza a cada 1 minuto
        setInterval(() => this.updateEvents(), 60000);
    }

    renderWidget() {
        const dashboard = document.querySelector('#view-dashboard .section-panel');
        if (!dashboard) return;

        const widgetHtml = `
            <div id="live-events-widget" style="background:var(--glass-bg); border:1px solid var(--glass-border); padding:15px; border-radius:12px; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:15px; align-items:center; justify-content:space-between;">
                <div style="flex:1; min-width:200px;">
                    <h3 style="color:var(--primary-color); margin:0 0 5px 0; font-size:1.1rem; display:flex; align-items:center; gap:5px;">
                        🕒 Eventos de Hoenn (Tempo Real)
                    </h3>
                    <p id="event-clock" style="font-size:0.85rem; color:var(--text-muted); margin:0;">Calculando hora local...</p>
                </div>
                
                <div style="flex:1; min-width:200px; display:flex; gap:15px;">
                    <div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;">
                        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Shoal Cave</div>
                        <strong id="event-shoal" style="color:var(--type-water); font-size:1rem;">--</strong>
                    </div>
                    <div style="flex:1; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:center;">
                        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Lilycove Dept.</div>
                        <strong id="event-dept" style="color:var(--type-electric); font-size:1rem;">--</strong>
                    </div>
                </div>
            </div>
        `;
        
        // Insere o widget logo após o <h2>
        const h2 = dashboard.querySelector('h2');
        if (h2) {
            h2.insertAdjacentHTML('afterend', widgetHtml);
        }
    }

    updateEvents() {
        const now = new Date();
        const hours = now.getHours();
        const day = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
        
        const clockEl = document.getElementById('event-clock');
        const shoalEl = document.getElementById('event-shoal');
        const deptEl = document.getElementById('event-dept');
        
        if (!clockEl || !shoalEl || !deptEl) return;
        
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        clockEl.textContent = `Hora Local: ${timeStr}`;

        // Lógica da Shoal Cave
        // Maré Alta: 09:00 as 15:00 e 21:00 as 03:00
        // Maré Baixa: 03:00 as 09:00 e 15:00 as 21:00
        let isHighTide = false;
        if ((hours >= 9 && hours < 15) || (hours >= 21 || hours < 3)) {
            isHighTide = true;
        }

        if (isHighTide) {
            shoalEl.textContent = "Maré Alta 🌊";
            shoalEl.style.color = "var(--type-water)";
            shoalEl.title = "Explore os andares superiores em busca de Shoal Shells.";
        } else {
            shoalEl.textContent = "Maré Baixa 🧊";
            shoalEl.style.color = "var(--type-ice)";
            shoalEl.title = "Acesse a Caverna de Gelo (Icefall Cave) em busca de Snorunt e Shoal Salts.";
        }

        // Lógica do Lilycove Dept. Store (Liquidação)
        // Como o original era ativado via TV e misturava recordes com outros jogadores, vamos fixar no Sábado (Dia 6)
        if (day === 6) {
            deptEl.textContent = "LIQUIDAÇÃO! 💰";
            deptEl.style.color = "var(--type-electric)";
            deptEl.title = "A liquidação no terraço está acontecendo hoje! Compre decorações exclusivas para sua Base Secreta.";
        } else {
            deptEl.textContent = "Normal";
            deptEl.style.color = "var(--text-color)";
            deptEl.title = "Liquidações ocorrem aos Sábados.";
        }
    }
}

// Inicializa os eventos
document.addEventListener('DOMContentLoaded', () => {
    window.LiveEventsManager = new LiveEvents();
});
