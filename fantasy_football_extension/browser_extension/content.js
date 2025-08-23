let undoStack = [];
let allPlayers = [];
let draftedPlayers = new Set();

const baseUrl = "https://fantasyfootballextension.onrender.com";

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log('request.type: ', request.type);
    if (request.type === "SHOW_RANKINGS") {
        const {num_teams, ppr_type, position, sort_by, token} = request.filters;

        const existing = document.getElementById("fantasy-rankings-extension");
        if (existing) existing.remove();

        localStorage.removeItem("draftedPlayers");
        draftedPlayers = new Set();

        try {
            const response = await fetch(`${baseUrl}/api/player_rankings/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify({num_teams, ppr_type, position, sort_by})
            });

            if (!response.ok) throw new Error("Unauthorized");

            const players = await response.json();
            allPlayers = players;
            renderPanel(players, "", sort_by);
        } catch (err) {
            console.error("Failed to load rankings:", err);
            alert("Failed to load fantasy rankings. You must be logged in.");
        }
    }
});

function renderPanel(players, selectedPosition = "", selectedSort = "vorp") {
    createFloatingPanel(players, selectedPosition, selectedSort);
}

function updateDraftFromPage() {
    document.querySelectorAll(".drafted .player-name").forEach(el => {
        const shortName = el.textContent.trim();
        const position = el.closest(".drafted").querySelector(".position")?.textContent?.split(" - ")[0]?.trim();
        const matched = matchFullName(shortName, position);
        if (matched && !draftedPlayers.has(matched.name)) {
            markPlayerAsDrafted(matched.name);
        }
    });
}

function matchFullName(shortName, position) {
    const [initial, ...rest] = shortName.split(" ");
    const shortLastName = rest.join(" ").toLowerCase();

    return allPlayers.find(p => {
        const [first, ...lastParts] = p.name.split(" ");
        const suffixes = ["jr", "sr", "ii", "iii", "iv", "v"];
        const lastNameWords = lastParts.filter(part => !suffixes.includes(part.toLowerCase()));
        const fullLastName = lastNameWords.join(" ").toLowerCase();

        return (
            p.position === position &&
            fullLastName === shortLastName &&
            first.charAt(0).toUpperCase() === initial.charAt(0).toUpperCase()
        );
    });
}

function markPlayerAsDrafted(name) {
    draftedPlayers.add(name);
    const row = [...document.querySelectorAll("#fantasy-rankings-extension tr")].find(tr =>
        tr.querySelector("td:nth-child(2)")?.textContent.trim().toLowerCase() === name.toLowerCase()
    );
    const checkbox = document.querySelector(`input[data-player-name="${name}"]`);
    if (row && checkbox && !checkbox.checked) {
        row.classList.add("disappeared");
        checkbox.checked = true;
        undoStack.push({row, checkbox});
        updateLocalStorage();
    }
}

function createFloatingPanel(players, selectedPosition = "", selectedSort = "vorp") {
    const existing = document.getElementById("fantasy-rankings-extension");
    if (existing) existing.remove();

    undoStack = [];
    draftedPlayers = new Set(JSON.parse(localStorage.getItem("draftedPlayers") || "[]"));

    const panel = document.createElement("div");
    panel.id = "fantasy-rankings-extension";
    Object.assign(panel.style, {
        position: "fixed", top: "80px", right: "20px", width: "430px", height: "500px",
        backgroundColor: "#1e1e1e", color: "#f0f0f0", border: "2px solid #555",
        overflowY: "scroll", zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        padding: "10px", fontSize: "12px", fontFamily: "Arial, sans-serif", borderRadius: "8px"
    });

    panel.innerHTML = `
        <div id="fantasy-rankings-header" style="display:flex;justify-content:space-between;align-items:center;font-weight:bold;margin-bottom:5px;">
            <span>VORP Vision</span>
            <div>
                <button id="update-draft">Update Draft Board</button>
                <button id="toggle-drafted">Show Drafted</button>
                <button id="undo-button">Undo</button>
                <button id="close-button">✖</button>
            </div>
        </div>
        <div style="display: flex; gap: 10px; margin: 6px 0; font-size: 11px;">
            <label>Position:
                <select id="position-filter">
                    <option value="" ${selectedPosition === "" ? "selected" : ""}>All</option>
                    <option value="QB" ${selectedPosition === "QB" ? "selected" : ""}>QB</option>
                    <option value="RB" ${selectedPosition === "RB" ? "selected" : ""}>RB</option>
                    <option value="WR" ${selectedPosition === "WR" ? "selected" : ""}>WR</option>
                    <option value="TE" ${selectedPosition === "TE" ? "selected" : ""}>TE</option>
                    <option value="DEF" ${selectedPosition === "DEF" ? "selected" : ""}>DEF</option>
                    <option value="K" ${selectedPosition === "K" ? "selected" : ""}>K</option>
                </select>
            </label>
            <label>Sort:
                <select id="sort-filter">
                    <option value="vorp" ${selectedSort === "vorp" ? "selected" : ""}>VORP</option>
                    <option value="voas" ${selectedSort === "voas" ? "selected" : ""}>VOAS</option>
                </select>
            </label>
        </div>
        <table>
            <thead><tr><th></th><th>Player</th><th>Pos</th><th>VORP</th><th>VOAS</th><th>Avg</th></tr></thead>
            <tbody>
                ${players.map((p, i) => {
        const isHidden = draftedPlayers.has(p.name);
        return `
                        <tr id="rank-row-${i}" class="${getTierClass(p.vorp)} ${isHidden ? 'disappeared' : ''}">
                            <td><input type="checkbox" class="drafted-checkbox" data-row-id="rank-row-${i}" data-player-name="${p.name}" ${isHidden ? "checked" : ""}></td>
                            <td>${p.name}</td>
                            <td>${p.position}</td>
                            <td>${p.vorp.toFixed(1)}</td>
                            <td>${p.voas.toFixed(1)}</td>
                            <td>${p.avg_proj.toFixed(1)}</td>
                        </tr>`;
    }).join("")}
            </tbody>
        </table>
    `;
    document.body.appendChild(panel);
    observeDraftBoard();
    makeDraggable(panel, panel.querySelector("#fantasy-rankings-header"));

    panel.querySelectorAll(".drafted-checkbox").forEach(cb => {
        cb.addEventListener("change", () => {
            const row = document.getElementById(cb.dataset.rowId);
            const name = cb.dataset.playerName;

            if (cb.checked) {
                draftedPlayers.add(name);
                undoStack.push({row, checkbox: cb, drafted: true});
            } else {
                draftedPlayers.delete(name);
                undoStack.push({row, checkbox: cb, drafted: false});
            }

            updateLocalStorage();
            applyDraftToggleView();
        });
    });

    panel.querySelector("#toggle-drafted").addEventListener("click", (e) => {
        const showingDrafted = e.target.textContent === "Show Drafted";
        e.target.textContent = showingDrafted ? "Show Undrafted" : "Show Drafted";
        applyDraftToggleView();
    });

    panel.querySelector("#undo-button").addEventListener("click", () => {
        const last = undoStack.pop();
        if (!last) return;

        const name = last.checkbox.dataset.playerName;
        if (last.drafted) {
            draftedPlayers.delete(name);
            last.checkbox.checked = false;
        } else {
            draftedPlayers.add(name);
            last.checkbox.checked = true;
        }

        updateLocalStorage();
        applyDraftToggleView();
    });

    panel.querySelector("#update-draft").addEventListener("click", updateDraftFromPage);
    panel.querySelector("#close-button").addEventListener("click", () => panel.remove());

    panel.querySelector("#position-filter").addEventListener("change", () => {
        const pos = panel.querySelector("#position-filter").value;
        const sortBy = panel.querySelector("#sort-filter").value;
        const filtered = pos ? allPlayers.filter(p => p.position === pos) : allPlayers;
        const sorted = [...filtered].sort((a, b) => b[sortBy] - a[sortBy]);
        renderPanel(sorted, pos, sortBy);
    });

    panel.querySelector("#sort-filter").addEventListener("change", () => {
        const pos = panel.querySelector("#position-filter").value;
        const sortBy = panel.querySelector("#sort-filter").value;
        const filtered = pos ? allPlayers.filter(p => p.position === pos) : allPlayers;
        const sorted = [...filtered].sort((a, b) => b[sortBy] - a[sortBy]);
        renderPanel(sorted, pos, sortBy);
    });
}

function updateLocalStorage() {
    localStorage.setItem("draftedPlayers", JSON.stringify([...draftedPlayers]));
}

function applyDraftToggleView() {
    const isShowingDrafted = document.querySelector("#toggle-drafted").textContent === "Show Undrafted";

    document.querySelectorAll("tbody tr").forEach(row => {
        const cb = row.querySelector(".drafted-checkbox");
        const isDrafted = cb.checked;
        row.classList.remove("disappeared");
        row.style.display = (isShowingDrafted && isDrafted) || (!isShowingDrafted && !isDrafted) ? "" : "none";
    });
}

function getTierClass(vorp) {
    if (vorp >= 90) return "tier-1";
    if (vorp >= 60) return "tier-2";
    if (vorp >= 25) return "tier-3";
    if (vorp >= 0) return "tier-4";
    return "tier-5";
}

function makeDraggable(panel, header) {
    let offsetX = 0, offsetY = 0, isDragging = false;
    header.addEventListener("mousedown", e => {
        isDragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        document.body.style.userSelect = "none";
    });
    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "";
    });
    document.addEventListener("mousemove", e => {
        if (isDragging) {
            panel.style.top = `${e.clientY - offsetY}px`;
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.right = "auto";
        }
    });
}

function observeDraftBoard() {
    const observer = new MutationObserver(updateDraftFromPage);
    observer.observe(document.body, {childList: true, subtree: true});
}
