let currentLang = "en";

function reloadLangs() {
    fetch("./i18n.json")
        .then((r) => r.json())
        .then((r) => {
            for (let key in r)
                document.getElementById(key).innerHTML =
                    r[key][currentLang];
        });
}

reloadLangs();