let data = {
    submissions: [],
    players: {}
};

let constants = {
    months: {
        "ja": "01",
        "f": "02",
        "mar": "03",
        "ap": "04",
        "may": "05",
        "jun": "06",
        "jul": "07",
        "au": "08",
        "s": "09",
        "o": "10",
        "n": "11",
        "d": "12",
    },

    tracks: {
        "l": 0,
        "mm": 1,
        "mg": 2,
        "t": 3,
        "mc": 4,
        "cm": 5,
        "dk": 6,
        "w": 7,
        "dc": 8,
        "k": 9,
        "mt": 10,
        "g": 11,
        "dd": 12,
        "mh": 13,
        "b": 14,
        "rr": 15,
        "rpb": 16,
        "ry": 17,
        "rg": 18,
        "rmr": 19,
        "rsl": 20,
        "rsg": 21,
        "rds": 22,
        "rw": 23,
        "rdh": 24,
        "rbc3": 25,
        "rdkj": 26,
        "rmc3": 28,
        "rmc": 27,
        "rpg": 29,
        "rdkm": 30,
        "rbc": 31,
    },

    track_category: {
        0: true,
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: true,
        7: false,
        8: true,
        9: false,
        10: false,
        11: false,
        12: true,
        13: true,
        14: false,
        15: false,
        16: false,
        17: true,
        18: false,
        19: true,
        20: false,
        21: false,
        22: true,
        23: false,
        24: false,
        25: false,
        26: false,
        27: false,
        28: true,
        29: false,
        30: false,
        31: false,
    },

    track_names: [
        "Luigi Circuit",
        "Moo Moo Meadows",
        "Mushroom Gorge",
        "Toad's Factory",
        "Mario Circuit",
        "Coconut Mall",
        "DK's Snowboard Cross",
        "Wario's Gold Mine",
        "Daisy Circuit",
        "Koopa Cape",
        "Maple Treeway",
        "Grumble Volcano",
        "Dry Dry Ruins",
        "Moonview Highway",
        "Bowser's Castle",
        "Rainbow Road",
        "GCN Peach Beach",
        "DS Yoshi Falls",
        "SNES Ghost Valley 2",
        "N64 Mario Raceway",
        "N64 Sherbet Land",
        "GBA Shy Guy Beach",
        "DS Delfino Square",
        "GCN Waluigi Stadium",
        "DS Desert Hills",
        "GBA Bowser Castle 3",
        "N64 DK's Jungle Parkway",
        "GCN Mario Circuit",
        "SNES Mario Circuit 3",
        "DS Peach Gardens",
        "GCN DK Mountain",
        "N64 Bowser's Castle",
    ]
}

async function loadStuff() {
    await fetch("https://corsproxy.io/?https://www.mariokart64.com/mkw/profile.php").then(r=>r.text()).then(r=>{
        let profileDocument = new DOMParser().parseFromString(r, "text/html");
        let playerList = profileDocument.getElementsByClassName("playerslist")[0].children[0];
        for (let row of playerList.children) {
            console.log(row);
            let starterData = row.children[0].children[0];
            if (row.children[0].innerHTML === "Name") continue;
            data.players[starterData.innerHTML.toLowerCase()] = starterData.innerHTML;
        }
        document.getElementById("readInput").disabled = "";
    });
}
loadStuff();

function writeToOutput(d) {
    if (d == null) return;
    let out = document.createElement("p");
    out.innerHTML = d;
    document.getElementById("output").append(out);
}

function resetOutput() {
    document.getElementById("output").innerHTML = "";
}

document.getElementById("readInput").addEventListener("click", async function() {
    console.log("Started");
    data.submissions = [];
    let parserData = document.getElementById("inputTextArea").value.split("\n").filter(r=>r !== "");
    let currentSubmission = {skip:true};
    let skipToNextSubmission = false;
    console.log(parserData);
    for (let line of parserData) {
        let lowercaseLine = line.toLowerCase();
        console.log(lowercaseLine);
        if (lowercaseLine.startsWith("date")) {
            skipToNextSubmission = false
            data.submissions.push(currentSubmission);
            let year;
            let month;
            let date;
            let keywords = lowercaseLine.split(" ").filter(r=>r !== " ");
            if (keywords.length > 4) {
                skipToNextSubmission = true;
                currentSubmission.err = true;
                currentSubmission.errString = "Cannot parse date";
            };
            for (let keyword of keywords.slice(1, keywords.length)) {
                let kw = keyword.replace(/,/g, "").replace(/th/g, "").replace(/rd/g, "").replace(/nd/g, "").replace(/st/g, "");
                if (kw.length === 4) {
                    year = kw;
                    continue;
                }
                let _break = false;
                for (let abbr of Object.keys(constants.months)) if (kw.startsWith(abbr)) {
                    month = constants.months[abbr];
                    _break = true;
                    break;
                }
                if (_break) continue;
                date = kw.padStart(2,"0");
            };
            currentSubmission = {
                name: "",
                date: `${year}-${month}-${date}`,
                flapCatch: false,
                times: [],
            };
            continue;
        }
        if (lowercaseLine.startsWith("name")) {
            let keywords = lowercaseLine.split(" ").filter(r=>r !== " ");
            currentSubmission.name = keywords.slice(1,keywords.length).join(" ");
            if (data.players[currentSubmission.name] != null || data.players[currentSubmission.name] != undefined) continue;
            currentSubmission.err = true;
            currentSubmission.errString = `Skipped line "${line}", could not identify the player.`;
        }
        if (skipToNextSubmission) continue;

        if (lowercaseLine.split(" ").filter(r=>r !== "").length === 1 && (lowercaseLine.startsWith("f") || lowercaseLine.startsWith("l"))) {
            currentSubmission.flapCatch = true
            continue;
        };

        let track = -1;
        let trackData = lowercaseLine.split(" ").filter(r=>r!=="");

        for (let abbr of Object.keys(constants.tracks)) if (trackData[0].startsWith(abbr)) {
            track = constants.tracks[abbr];
            break;
        }
        trackData.slice(1,trackData.length);

        if (track === -1) {
            currentSubmission.err = true;
            currentSubmission.errString = `Skipped line "${line}" for player ${data.players[currentSubmission.name]}, could not detect track.`;
            continue
        }

        let nosc = false;
        let flap = currentSubmission.flapCatch;

        let i = 0;
        let remove = [];
        for (let token of trackData) {
            if (token.startsWith("n")) {
                nosc = true;
                remove.push(i);
            }
            if (token.startsWith("f") || token.startsWith("l")) {
                flap = true;
                remove.push(i);
            }
            i++;
        }
        for (let x of remove) trackData[x] = "";
        trackData = trackData.filter(r=>r!=="");

        if (lowercaseLine.includes("/") || lowercaseLine.includes("\\")) {
            let trackData1 = [];
            let trackData2 = [];
            let x = false;
            for (let token of trackData) {
                if (token === "/" || token === "\\") {
                    x = true;
                    continue;
                }
                if (x) {
                    trackData2.push(token);
                } else {
                    trackData1.push(token);
                }
            }
            if (trackData1.length !== 0) currentSubmission.times.push(handleTime(trackData1,track,nosc,false));
            if (trackData2.length !== 0) currentSubmission.times.push(handleTime(trackData2,track,nosc,true));
            continue;
        }

        currentSubmission.times.push(handleTime(trackData,track,nosc,flap));
    }
    data.submissions.push(currentSubmission);
    console.log("Finished");
    resetOutput();
    data.submissions.sort((a,b)=>a.date - b.date).sort((a,b)=>a.name - b.name);

    let megamerge = {};
    for (let submission of data.submissions) {
        if (submission.err || submission.skip) continue;
        if (megamerge[submission.name] == undefined || megamerge[submission.name] == null) megamerge[submission.name] = [];
        for (let time of submission.times) megamerge[submission.name].push(time);
    }

    for (let player of Object.keys(megamerge)) {
        let removal = new Set();
        let removedTimes = [];
        megamerge[player].sort((a,b)=>a.nosc - b.nosc).sort((a,b)=>(a.track*2 + a.flap)-(b.track*2 + b.flap))
        for (let i in megamerge[player]) for (let j in megamerge[player]) {
            if (i == j) continue;
            let time = megamerge[player][i];
            let cmpTime = megamerge[player][j];
            if (time.track != cmpTime.track || time.flap != cmpTime.flap) continue;
            if (time.time == cmpTime.time && !removal.has(i) && !removedTimes.includes(time)) {
                removal.add(i);
                removedTimes.push(time);
                writeToOutput(`Removed ${writeTimeOutput(time)}, it has been submitted twice.`);
            } else if (time.time < cmpTime.time) {

            }
        }
        for (let i of removal) {
            let time = megamerge[player][i];
            for (let submission of data.submissions) {
                let remove = [];
                if (submission.err || submission.skip) continue;
                if (submission.name === player) for (let j in submission.times) if (JSON.stringify(submission.times[j]) === JSON.stringify(time)) remove.push(parseInt(j) - remove.length);
                for (let x in remove) submission.times.splice(x,1);
            }
        }
    }

    let out = [];
    for (let submission of data.submissions) {
        if (submission.err || submission.skip) {
            if (submission.err) writeToOutput("Error with submission: " + submission.errString);
            continue;
        }
        if (submission.times.length == 0) continue;
        writeToOutput("Name: "+submission.name);
        writeToOutput("Date: "+submission.date);
        submission.times.sort((a,b)=>(a.track*2 + a.flap)-(b.track*2 + b.flap))
        writeToOutput("Times submitted: "+submission.times.length);
        for (let time of submission.times) {
            writeToOutput(`>> ${writeTimeOutput(time)}`);
            let catString = "Combined";
            if (time.nosc && !constants.track_category[time.track]) catString = "NonSC";
            if (time.track === 29 && !time.flap) catString = "NonSC";
            out.push(`(${data.players[submission.name]},${catString},${time.track*2 + time.flap},${time.time / 1000},${submission.date},${time.comment === "" ? "N/A" : time.comment})`);
        }
    }
    for (let i of out) writeToOutput(i);
});

function writeTimeOutput(time) {
    return `${constants.track_names[time.track]}:${time.flap ? " flap" : ""}${time.nosc ? " nosc" : ""} ${formatMsToTime(time.time)}${time.comment !== "" ? " " + time.comment : ""}`
}

function formatMsToTime(i32) {
    let mins = Math.trunc(i32 / 60000);
    i32 %= 60000;
    let sec = Math.trunc(i32 / 1000);
    i32 %= 1000;
    let ret = `${mins.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${Math.trunc(i32).toString().padStart(3, "0")}`;
    return ret;
}

function handleTime(data, track, nosc, flap) {
    let time = 0;
    let comment = "";
    for (let token of data) {
        if (token.includes("youtu") || token.includes("twitch")) comment = token;
        let total = 0;
        if ((token.includes(":")) || (token.includes(".")) || (token.includes("\"")) || (token.includes("'"))) {
            if (token.includes(":")) {
                total += parseInt(token.split(":")[0]) * 60000;
                token = token.split(":")[1];
            } else if (token.includes("\"")) {
                total += parseInt(token.split("\"")[0]) * 60000;
                token = token.split("\"")[1];
            }
            if (token.includes(".")) {
                total += parseInt(token.split(".")[0]) * 1000;
                total += parseInt(token.split(".")[1]);
            } else if (token.includes("'")) {
                total += parseInt(token.split("'")[0]) * 1000;
                total += parseInt(token.split("'")[1]);
            }
        } else {
            time = parseInt(token)
        }
        time = total;
    }
    return {
        track: track,
        flap: flap,
        time: time,
        comment: comment,
        nosc: nosc
    }
}

/* example data
Date: April 10, 2024
Name: ChromaQ

rSGB nosc: 1:27.593
DKS: 1:58.875
LC flap: 23.035
MMM flap: 25.464
MG flap: 16.692
TF nosc flap: 37.231
MC flap: 12.179
CM flap: 11.130
DKS flap: 39.208
WGM flap: 15.958
DC flap: 30.843
KC flap: 47.642
MT flap: 33.636
GV flap: 6.167
BC flap: 47.880
RSL flap: 22.502
RBC3 flap: 42.815

Date: April 11th 2024
Name: Sergio
MH: 1:46.423/34.866

Date: April 11, 2024
Name: ARK..

MG no-sc 1:53.782
MC no-sc 1:26.557
MH 1:55.099
*/