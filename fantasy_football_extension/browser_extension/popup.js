document.getElementById("load-rankings").addEventListener("click", () => {
    const message = {
        type: "SHOW_RANKINGS",
        filters: {
            num_teams: parseInt(document.getElementById("num_teams").value),
            ppr_type: document.getElementById("ppr_type").value,
            position: document.getElementById("position").value,
            sort_by: document.getElementById("sort_by").value
        }
    };

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
});
