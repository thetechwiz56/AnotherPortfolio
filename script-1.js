const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const TOTAL = 5;
let score = 0, coins = 0, sound = false, ctx;

// ---- helpers: 8-bit beeps (generated in code, off by default) ----
function beep(freq, dur = 0.08, type = "square") {
    if (!sound) return;
    try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = freq; g.gain.value = 0.05;
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) {}
}
function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toast.id);
    toast.id = setTimeout(() => t.classList.remove("show"), 2800);
}
function addScore(n) {
    score += n;
    $("#score").textContent = String(score).padStart(6, "0");
}

// ---- boot screen ----
const boot = $("#boot"), start = $("#start");
setTimeout(() => start.focus({ preventScroll: true }), 1800);
start.addEventListener("click", () => {
    boot.classList.add("off");
    beep(660);
    setTimeout(() => beep(880), 90);
});

// ---- sound + palette ----
$("#snd").addEventListener("click", (e) => {
    sound = !sound;
    e.target.textContent = sound ? "SND ON" : "SND OFF";
    beep(520);
});
const themes = ["gb", "neon", "amber"];
function nextTheme() {
    const t = themes[(themes.indexOf(root.dataset.theme) + 1) % themes.length];
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
}
try {
    const saved = localStorage.getItem("theme");
    if (themes.includes(saved)) root.dataset.theme = saved;
} catch (e) {}
$("#pal").addEventListener("click", () => { nextTheme(); beep(440); });

// ---- pixel avatar (drawn from a text map, no image files) ----
const sprite = ["..HHHH..", ".HHHHHH.", ".HSSSSH.", ".SESSES.", ".SSSSSS.", "..SMMS..", ".BBBBBB.", "BBBBBBBB", ".LL..LL.", ".LL..LL."];
const colors = { H: "var(--mid)", S: "var(--fg)", E: "var(--bg)", M: "var(--acc)", B: "var(--acc)", L: "var(--mid)" };
const hero = $("#hero");
hero.innerHTML = sprite.map((row, y) =>
    [...row].map((c, x) => colors[c] ? `<rect x="${x}" y="${y}" width="1" height="1" style="fill:${colors[c]}"/>` : "").join("")
).join("");

// ---- cheat code: Konami on keyboard, or tap the avatar 7 times ----
function cheat() {
    nextTheme();
    addScore(1000);
    toast("CHEAT ACTIVATED! +1000");
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.1), i * 90));
}
let taps = 0;
hero.addEventListener("click", () => {
    hero.classList.remove("jump");
    void hero.offsetWidth;
    hero.classList.add("jump");
    beep(500, 0.12);
    addScore(10);
    if (++taps === 7) cheat();
});
const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let pos = 0;
addEventListener("keydown", (e) => {
    pos = e.key === code[pos] ? pos + 1 : (e.key === code[0] ? 1 : 0);
    if (pos === code.length) { pos = 0; cheat(); }
});

// ---- skills as XP bars (edit levels here, 1 to 10) ----
const skills = [["HTML/CSS", 6], ["JAVASCRIPT", 5], ["C#", 5], ["ASP.NET MVC", 4], ["MONGODB", 4], ["GIT/GITHUB", 4]];
$("#skill-list").innerHTML = skills.map(([name, lv]) =>
    `<li><span class="lbl">${name}</span><span class="bar">${
        Array.from({ length: 10 }, (_, i) => i < lv ? `<i class="on" style="--n:${i}"></i>` : "<i></i>").join("")
    }</span><span class="lv">LV${lv}</span></li>`
).join("");

// ---- reveal sections on scroll ----
const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target);
            const h = en.target.querySelector("h2");
            if (h) {addScore(50); toast("LEVEL UP!" + h.textContent); beep(784, 0.1);}
         }
    });
}, { threshold: 0.15 });
document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

// ---- hidden coins ----
const spots = [["#player", "8%", "84%"], ["#skills", "6%", "88%"], ["#quests", "60%", "3%"], ["#contact", "5%", "78%"], ["footer", "25%", "12%"]];
spots.forEach(([sel, top, left]) => {
    const b = document.createElement("button");
    b.className = "coin";
    b.setAttribute("aria-label", "Coin");
    b.style.top = top;
    b.style.left = left;
    $(sel).append(b);
    b.addEventListener("click", () => {
        b.classList.add("got");
        coins++;
        addScore(100);
        $("#coins").textContent = coins + "/" + TOTAL;
        beep(988, 0.07);
        setTimeout(() => beep(1319, 0.15), 70);
        if (coins === TOTAL) {
            $("#lives").textContent += "♥";
            toast("ALL COINS! 1UP! SECRET: LET'S WORK TOGETHER");
        }
    });
});

// ---- contact form (no server yet, so it only confirms on screen) ----
const form = $("#form"), fmsg = $("#fmsg");
form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll("input, textarea").forEach((f) => {
        const valid = f.value.trim() !== "" && f.checkValidity();
        f.classList.toggle("bad", !valid);
        if (!valid) ok = false;
    });
    fmsg.textContent = ok ? "PLAYER 2 JOINED! (demo only)" : "FILL ALL FIELDS";
    if (ok) { form.reset(); addScore(500); beep(880); } else { beep(150, 0.15, "sawtooth"); }
});

$("#yr").textContent = new Date().getFullYear();

const runner = document.createElement("div");
runner.id = "runner";
runner.innerHTML = '<svg viewBox="0 0 8 10" shape-rendering="crispEdges">${hero.innerHMTL}</svg>'; 
document.body.append(runner);
const bar = document.createElement("div");
bar.id = "lvlbar";
document.body.append(bar);
addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight || 1;
    const p = Math.min(scrollY / max, 1);
    runner.style.left = 'calc(${p * 100}% - ${p * 40}px)';
    bar.style.width = p * 100 + "%";
});
dispatchEvent(new Event("scroll"));

addEventListener("click", (e) => {
    const s = document.createElement("span");
    s.className = "fx";
    s.textContent = "+";
    s.style.left = e.clientX + "px";
    s.style.top = e.clientY + "px";
    document.body.append(s);
    setTimeout(() => s.remove(), 600);

});

const dlines = [
    "Welcome, traveler! I'm Ahumuza Tony Bills.",
    "I build web and .NET apps.",
    "Still levelling up. New skills every week!",
    "Scroll down to see my quests."

];
const dtext = $("#dtext"), dbox = $("#dialog");
let di = 0, dc = 0, dtimer = null, dwait = null, dstarted = false;

function finishLine() {
    clearInterval(dtimer);
    clearTimeout(dwait);
    dc = dlines[di].length;
    dtext.textContent = dlines[di];
    dbox.classList.add("done");
    dwait = setTimeout(nextLine, 2500);
}
function typeLine() {
    clearInterval(dtimer);
    clearTimeout(dwait);
    dc = 0;
    dtext.textContent = "";
    dbox.classList.remove("done");
    dtimer = setInterval(function () {
        dc++;
        dtext.textContent = dlines[di].slice(0, dc);
        if (dc % 2 === 0) beep(420, 0.03);
        if (dc >= dlines[di].length) finishLine();
    }, 45);
}
function nextLine() {
    di = (di + 1) % dlines.length;
    typeLine();

}
dbox.addEventListener("click", function () {
    if (dc < dlines[di].length) finishLine();
    else { clearTimeout(dwait); nextLine(); }
});
new IntersectionObserver(function (entries, obs) {
    if (entries[0].isIntersecting && !dstarted) {
        dstarted = true;
        typeLine();
        obs.disconnect();
    }
}, { threshold: 0.5 }).observe(dbox);

(function () {
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

    var sky = document.createElement("div");
    sky.id = "sky";

    // pixel clouds that drift across

    var cloudMap = ["....XXXX......", "..XXXXXXXX.XX.", ".XXXXXXXXXXXXX", "XXXXXXXXXXXXXX", ".XXXXXXXXXXXX."];
    var rects = "";
    cloudMap.forEach(function (row, y) {
        for (var x = 0; x < row.length; x++) {
            if (row[x] === "X") rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
        }
    });
    var clouds = document.createElement("div");
    clouds.id = "clouds";
    clouds.className = "layer";
    for (var i = 0; i < 5; i++) {
        var c = document.createElement("div");
        c.className = "cloud";
        c.innerHTML = '<svg viewBox="0 0 14 5" shape-rendering="crispEdges">' + rects + "</svg>";
        c.style.top = (8 + i * 14) + "%";
        c.style.width = (60 + rnd() * 70) + "px";
        c.style.animationDuration = (50 + i * 15) + "s";
        c.style.animationDelay = "-" + (i * 11) + "s";
        clouds.append(c);
    }

    // pixel skyline, built from rectangles
    function skyline(maxH, minW, maxW, windows) {
        var x = 0, body = "";
        while (x < 320) {

            var w = Math.floor(minW + rnd() * (maxW - minW));
            var h = Math.floor(maxH * 0.35 + rnd() * maxH * 0.65);
            body += '<rect x="' + x + '" y="' + (40 - h) + '" width="' + w + '" height="' + h + '"/>';
            if (windows) {
                for (var wy = 40 - h + 2; wy < 38; wy += 3) {
                    for (var wx = x + 1; wx < x + w - 1; wx += 2) {
                        if (rnd() > 0.65) {
                            body += '<rect class="win" x="' + wx + '" y="' + wy + '" width="1" height="1" style="animation-delay:-' + (rnd() * 3).toFixed(1) + 's"/>';
                        }
                    }
                }
            }
            x += w;
        }
        return '<svg viewBox="0 0 320 40" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">' + body + "</svg>";
    }
    var far = document.createElement("div");
    far.className = "layer sk far";
    far.innerHTML = skyline(24, 4, 8, false);
    var near = document.createElement("div");
    near.className = "layer sk near";
    near.innerHTML = skyline(32, 5, 10, true);

    sky.append(clouds, far, near);
    document.body.prepend(sky);

    var waiting = false;
    function update(){
        var y = window.scrollY;
        clouds.style.transform = "translateY(" + (-y * 0.08) + "px)";
         far.style.transform = "translateY(" + (y * 0.15) + "px)";
          near.style.transform = "translateY(" + (y * 0.3) + "px)";
          waiting = false;

    }
    addEventListener("scroll", function (){
        if (!waiting){waiting = true; requestAnimationFrame(update); }
    });
    update();
})();

(function () {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var STEP = 15;

    function wipeTo(action) {
        if (reduce || busy) { action(); return; }
        busy = true;
        var size = Math.max(48, Math.ceil(innerWidth / 24));
        var cols = Math.ceil(innerWidth / size);
        var rows = Math.ceil(innerHeight / size);

        var wipe = document.createElement("div");
        wipe.id = "wipe";
        wipe.style.gridTemplateColumns = "repeat(" + cols + ", " + size + "px)";
        wipe.style.gridTemplateRows = "repeat(" + rows + ", " + size + "px)";
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var cell = document.createElement("i");
                cell.style.transitionDelay = (c + r) * STEP + "ms";
                wipe.append(cell);
            }
        }
        document.body.append(wipe);
        var total = (cols + rows) * STEP + 250;
        void wipe.offsetWidth;
        wipe.classList.add("on");
        beep(300, 0.08);
        setTimeout(function () {
            action();
            wipe.classList.remove("on");
            beep(600, 0.08);
            setTimeout(function () { wipe.remove(); busy = false; }, total);
        }, total);
    }

    document.addEventListener("click", function (e) {
        var a = e.target.closest ? 

e.target.closest('a[href^="#"]') : null;
        if (!a) return;
        var id = a.getAttribute("href");
        var target = id.length > 1 ? document.querySelector(id) : null;
        if (!target) return;
        e.preventDefault();
        wipeTo(function () {
            target.scrollIntoView({ behavior: "instant", block: "start" });
            try { history.pushState(null, "", id); } catch (err) {}
        });
    });
})();

$("#exit").addEventListener("click", function(){
    boot.classList.remove("off");
    window.scrollTo(0,0);
    beep(300, 0.15);
    setTimeout(function () {start.focus({preventScroll: true});}, 1800);
});

(function () {
    var colors = { X: "var(--fg)", A: "var(--acc)", M: "var(--mid)" };
    function icon(map) {
        var r = "";
        map.forEach(function (row, y) {
            for (var x = 0; x < row.length; x++) {
                if (colors[row[x]]) r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" style="fill:' + colors[row[x]] + '"/>';
            }
        });
        return '<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">' + r + "</svg>";
    }

    var items = [
        { n: "VS CODE", d: "My main editor. Every quest starts here.",
          m: ["........", "........", "..X..X..", ".X....X.", "X..AA..X", ".X....X.", "..X..X..", "........"] },
        { n: "GIT/GITHUB", d: "Saves my code and puts my sites online.",
          m: [".AA.....", ".AA..XX.", ".X...XX.", ".X.XX...", ".XXX....", ".X......", ".AA.....", ".AA....."] },
        { n: "MONGODB", d: "NoSQL database. Fresh loot from this semester.",
          m: ["...XX...", "..XXXX..", ".XXXXXX.", ".XXXXXX.", ".XXXXXX.", "..XXXX..", "...AA...", "...AA..."] },

        { n: ".NET SDK", d: "Builds my C# and ASP.NET apps.",
          m: [".XXXXXX.", "X......X", "X.AAAA.X", "X.A..A.X", "X.AAAA.X", "X......X", ".XXXXXX.", "........"] },
        { n: "DEVTOOLS", d: "Hunts bugs. Console errors are my boss fights.",
          m: [".XXXX...", "X....X..", "X....X..", "X....X..", ".XXXX...", "....AA..", ".....AA.", "......AA"] },
        { n: "LIVE SERVER", d: "Instant refresh while I code.",
          m: ["....AA..", "...AA...", "..AA....", ".AAAAAA.", "...AA...", "..AA....", ".AA.....", "A......."] }
    ];

    var inv = document.getElementById("inv");
    var tip = document.getElementById("invtip");
    var got = {}, count = 0;

    function say(item) {
        tip.textContent = item ? item.n + ": " + item.d : "LOCKED: a tool I haven't found yet.";
    }

    items.forEach(function (item) {
        var b = document.createElement("button");
        b.className = "slot";
        b.type = "button";
        b.setAttribute("aria-label", item.n);
        b.innerHTML = icon(item.m);
        b.addEventListener("mouseenter", function () { 

say(item); });
        b.addEventListener("focus", function () { say(item); });
        b.addEventListener("click", function () {
            say(item);
            beep(700, 0.06);
            if (!got[item.n]) {
                got[item.n] = true;
                count++;
                b.classList.add("eq");
                addScore(20);
                setTimeout(function () { beep(1000, 0.1); }, 70);
                if (count === items.length) {
                    addScore(200);
                    toast("FULL LOADOUT! +200");
                }
            }
        });
        inv.append(b);
    });

    for (var i = 0; i < 2; i++) {
        var l = document.createElement("button");
        l.className = "slot lock";
        l.type = "button";
        l.setAttribute("aria-label", "Locked slot");
        l.innerHTML = "<span>?</span>";
        l.addEventListener("mouseenter", function () { say(null); });

        l.addEventListener("click", function () { say(null); beep(150, 0.12, "sawtooth"); });
        inv.append(l);
    }
})();



