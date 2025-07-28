let undoStack = [];

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === "SHOW_RANKINGS") {
        const {num_teams, ppr_type, position, sort_by} = request.filters;

        // Remove existing panel if already present
        const existing = document.getElementById("fantasy-rankings-extension");
        if (existing) existing.remove();

        try {
            const response = await fetch("http://127.0.0.1:8000/api/player_rankings/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    num_teams,
                    ppr_type,
                    position,
                    sort_by
                })
            });

            const players = await response.json();
            createFloatingPanel(players);
        } catch (err) {
            console.error("Failed to load rankings:", err);
            alert("Failed to load fantasy rankings. Check your API or CORS settings.");
        }
    }
});

function createFloatingPanel(players) {
    undoStack = [];
    const hiddenPlayers = new Set(JSON.parse(localStorage.getItem("draftedPlayers") || "[]"));

    const panel = document.createElement("div");
    panel.id = "fantasy-rankings-extension";
    panel.style.position = "fixed";
    panel.style.top = "80px";
    panel.style.right = "20px";
    panel.style.width = "430px";
    panel.style.height = "500px";
    panel.style.backgroundColor = "white";
    panel.style.border = "2px solid #222";
    panel.style.overflowY = "scroll";
    panel.style.zIndex = 9999;
    panel.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
    panel.style.padding = "10px";
    panel.style.fontSize = "12px";
    panel.style.fontFamily = "Arial, sans-serif";

    const style = `
        <style>
            #fantasy-rankings-extension table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            #fantasy-rankings-extension th, #fantasy-rankings-extension td {
                padding: 4px;
                text-align: left;
            }
            #fantasy-rankings-extension th {
                background-color: #f0f0f0;
                position: sticky;
                top: 0;
                z-index: 1;
            }
            .tier-1 { background-color: #e0f7fa; }
            .tier-2 { background-color: #f1f8e9; }
            .tier-3 { background-color: #fffde7; }
            .tier-4 { background-color: #ffecb3; }
            .tier-5 { background-color: #ffcdd2; }
            .disappeared { display: none !important; }
            #fantasy-rankings-extension button#undo-button {
                background-color: #eee;
                border: 1px solid #aaa;
                font-size: 11px;
                padding: 2px 6px;
                cursor: pointer;
                border-radius: 4px;
            }
        </style>
    `;

    let html = `
        ${style}
        <strong>Fantasy Rankings</strong>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px;">
            <span>Click players as drafted</span>
            <button id="undo-button">Undo Last</button>
        </div>
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>VORP</th>
                    <th>VOAS</th>
                    <th>Avg</th>
                </tr>
            </thead>
            <tbody>
    `;

    players.slice(0, 300).forEach((p, i) => {
        const rowId = `rank-row-${i}`;
        const isHidden = hiddenPlayers.has(p.name);
        const tierClass = getTierClass(p.vorp);
        html += `
            <tr id="${rowId}" class="${tierClass} ${isHidden ? 'disappeared' : ''}">
                <td><input type="checkbox" class="drafted-checkbox" data-row-id="${rowId}" data-player-name="${p.name}" ${isHidden ? "checked" : ""}></td>
                <td>${p.name}</td>
                <td>${p.position}</td>
                <td>${Number(p.vorp).toFixed(1)}</td>
                <td>${Number(p.voas).toFixed(1)}</td>
                <td>${Number(p.avg_proj).toFixed(1)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    const updateLocalStorage = () => {
        const current = Array.from(panel.querySelectorAll(".drafted-checkbox"))
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.playerName);
        localStorage.setItem("draftedPlayers", JSON.stringify(current));
    };

    // Checkbox logic
    panel.querySelectorAll(".drafted-checkbox").forEach(cb => {
        cb.addEventListener("change", () => {
            const row = panel.querySelector(`#${cb.dataset.rowId}`);
            if (!row) return;

            if (cb.checked) {
                row.classList.add("disappeared");
                undoStack.push({row, checkbox: cb});
            } else {
                row.classList.remove("disappeared");
                undoStack = undoStack.filter(r => r.row !== row);
            }

            updateLocalStorage();
        });
    });

    // Undo button logic
    const undoButton = panel.querySelector("#undo-button");
    if (undoButton) {
        undoButton.addEventListener("click", () => {
            const last = undoStack.pop();
            if (last) {
                last.row.classList.remove("disappeared");
                last.checkbox.checked = false;
                updateLocalStorage();
            }
        });
    }
}

function getTierClass(vorp) {
    if (vorp >= 90) return "tier-1";
    if (vorp >= 60) return "tier-2";
    if (vorp >= 25) return "tier-3";
    if (vorp >= 0) return "tier-4";
    return "tier-5";
}
