async function getLocalForage() {
    return new Promise(async (resolve, reject) => {
        if (!document.querySelector(".forageScript")) {
            let script = document.createElement("script");
            script.className = "forageScript"
            script.src = "/forage.js";
            document.head.appendChild(script);
        }

        while (true) {
            await delay(200);
            if (await checkForForage()) {
                break;
            }
        }

        async function checkForForage() {
            try {
                if (localforage) {
                    await localforage.setDriver([
                        localforage.INDEXEDDB,
                        localforage.WEBSQL,
                        localforage.LOCALSTORAGE
                    ])
                    if (localforage) resolve(localforage);
                    return (localforage);
                }
            } catch {

            }
            return undefined;
        }
    });
}

async function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    })
}

async function setForageItem(key, data) {
    await getLocalForage();
    await localforage.setItem(key, data);
}

async function getForageItem(key) {
    await getLocalForage();
    return await localforage.getItem(key);
}

function checkAdminPerms() {
    if (!loginStatus) checkLogin();
    return loginStatus.admin;
}

let loginStatus;

function checkLogin() {
    let req = new XMLHttpRequest()
    req.open("GET", `/checkLogin${createURLWithHash()}`, false)
    req.send(null);
    loginStatus = JSON.parse(req.responseText);
    return loginStatus;
}

function isLoggedIn() {
    if (!loginStatus) checkLogin();
    return loginStatus.login;
}

function getCurrentUserPermissions() {
    if (!loginStatus) checkLogin();
    return loginStatus.permissions;
}

function getCurrentUserName() {
    if (!loginStatus) checkLogin();
    return loginStatus.username;
}


function GetParams() {
    let url = location.href
    let params = {};

    let regex = /\?[a-z0-9]*=[^?]*/gm;
    let m;
    while ((m = regex.exec(url)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        m.forEach((match, groupIndex) => {
            match = match.replace('?', '')
            let matcharr = match.split('=')
            matcharr.shift()
            params[match.split('=')[0]] = matcharr.join('=')
        });
    }

    return params
}

function createURLWithHash() {
    if (!GetParams().username || GetParams().username === "undefined") return "";
    if (!GetParams().hash || GetParams().hash === "undefined") return "";
    return `?hash=${GetParams().hash}?username=${GetParams().username}`;
}

window.addEventListener('load', bodyOnLoad, false);
let hideLogoutBtn = false;
let allowThemes = true;
let theme = "white";
let themeWhite = true;

function disableLogoutBtn() {
    hideLogoutBtn = true;
}

function disableThemes() {
    allowThemes = false;
}


async function bodyOnLoad() {
    createLogoutButton();
    await renderTheme();
}

async function renderTheme() {
    document.querySelectorAll(".theme-css").forEach(el=>el.outerHTML="");
    if(!allowThemes)return;
    let themeStyle = document.createElement("style");
    themeStyle.className = "theme-css"
    document.head.appendChild(themeStyle);
    if (allowThemes) {
        theme = await getForageItem("theme");
    } else {
        theme = "white";
    }
    let themeVars = {
        primaryBg: "",
        secondaryBg: "",
        embedBg: "",
        primaryFg: "",
        secondaryFg: "",
    }
    if (!theme) {
        await changeTheme("white");
        return await renderTheme();
    }

    if (theme === "dark") {

        themeVars.primaryBg = "#242424";
        themeVars.secondaryBg = "#161616";
        themeVars.embedBg = "#161616";
        themeVars.primaryFg = "#d5d5d5";
        themeWhite = false;
    }
    if (theme === "white") {
        themeStyle.innerHTML = "";
        themeVars.primaryBg = "#ffffff";
        themeVars.embedBg = "#ffffff";
        themeVars.secondaryBg = "#aeaeae";
        themeVars.primaryFg = "#000000";
        themeWhite = true;
    }

    let compiledVars = "";
    Object.keys(themeVars).forEach(key=>{
        let el = themeVars[key];
        compiledVars += `--${key}: ${el};\n`;
    })

    themeStyle.innerHTML = `
        body{
            background-color:var(--primaryBg);
            color:var(--primaryFg);
        }
        
        select, input{
            background-color:var(--embedBg);
            color:var(--primaryFg);
        }
        
        body{
            ${compiledVars};
        `
}

async function changeTheme(theme) {
    await setForageItem("theme", theme);
    await renderTheme();
}


function createLogoutButton() {
    if (!isLoggedIn() || hideLogoutBtn) {
        return;
    }
    let imgsrc = " data:image/png;base64,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"
    let btn = document.createElement('div')
    btn.innerHTML = "Account";
    document.body.appendChild(btn)
    //btn.style.backgroundImage = `url('${imgsrc}')`
    btn.style.width = '80px'
    btn.style.height = '25px'
    btn.style['background-repeat'] = 'round'
    btn.style.position = 'absolute'
    btn.style.top = '5px'
    btn.style.right = '5px'
    btn.style.cursor = 'pointer'
    btn.style['background-color'] = 'var(--secondaryBg)'
    btn.style['text-align'] = 'center';
    btn.className = "acc-btn";
    btn.onclick = () => {
        showAccountBar()
    }
}

function showAccountBar() {
    if (document.querySelectorAll(".acc-bar").length > 0) {
        document.querySelectorAll(".acc-bar").forEach(el => {
            el.outerHTML = ""
        })
        document.querySelector(".acc-btn").style.width = "80px"
        return;
    }


    let bar = document.createElement('div');
    document.body.appendChild(bar)
    bar.style.width = '160px'
    bar.style.height = '125px'
    bar.style.position = 'absolute'
    bar.style.top = '35px'
    bar.style.right = '5px'
    bar.style['background-color'] = 'var(--secondaryBg)'
    bar.className = "acc-bar"
    document.querySelector(".acc-btn").style.width = "160px"

    let txt_accname = document.createElement('div');
    let username = getCurrentUserName();
    txt_accname.innerHTML = username;
    txt_accname.style["text-align"] = 'center';
    txt_accname.style.backgroundColor = "#404040";
    txt_accname.style.height = "25px";
    txt_accname.style.margin = "5px";
    bar.appendChild(txt_accname)

    let btn_manage = document.createElement('div');
    btn_manage.innerHTML = "Manage";
    btn_manage.style["text-align"] = 'center';
    btn_manage.style.backgroundColor = "#002cff";
    btn_manage.style.height = "25px";
    btn_manage.style.cursor = 'pointer'
    btn_manage.style.margin = "5px";
    btn_manage.onmouseover = function () {
        btn_manage.style.backgroundColor = "#0021b5";
    }
    btn_manage.onmouseleave = function () {
        btn_manage.style.backgroundColor = "#002cff";
    }
    bar.appendChild(btn_manage)

    let btn_theme = document.createElement('div');
    btn_theme.innerHTML = "Theme: "+theme;
    btn_theme.style["text-align"] = 'center';
    btn_theme.style.backgroundColor = "#404040";
    btn_theme.style.height = "25px";
    btn_theme.style.cursor = 'pointer'
    btn_theme.style.margin = "5px";
    btn_theme.onmouseover = function () {
        btn_theme.style.backgroundColor = "#343434";
    }
    btn_theme.onmouseleave = function () {
        btn_theme.style.backgroundColor = "#404040";
    }
    btn_theme.onclick= async function () {
        await changeTheme(theme==="white"?"dark":"white");
        btn_theme.innerHTML = "Theme: "+theme;
    }
    bar.appendChild(btn_theme)

    let btn_logout = document.createElement('div');
    btn_logout.innerHTML = "Logout";
    btn_logout.style["text-align"] = 'center';
    btn_logout.style.backgroundColor = "#f60000";
    btn_logout.style.height = "25px";
    btn_logout.style.cursor = 'pointer'
    btn_logout.style.margin = "5px";
    btn_logout.onclick = function () {
        logout();
    }
    btn_logout.onmouseover = function () {
        btn_logout.style.backgroundColor = "#ab0000";
    }
    btn_logout.onmouseleave = function () {
        btn_logout.style.backgroundColor = "#f60000";
    }
    bar.appendChild(btn_logout)
}

function showModal(text) {
    showModalRaw(text, false)
}

function showErrModal(text) {
    showModalRaw(text, true)
}

function showModalRaw(text, error) {
    document.querySelectorAll('.modalBox').forEach(el => {
        el.outerHTML = "";
    })

    let modal = document.createElement('div');
    modal.className = "modalBox";
    let content = document.createElement('div');
    let closeBtn = document.createElement('span')
    let modalTxt = document.createElement('p')

    modalTxt.innerHTML = text;
    closeBtn.innerHTML = decodeURI('%C3%97');
    content.appendChild(closeBtn)
    content.appendChild(modalTxt)
    modal.appendChild(content)
    document.body.appendChild(modal);

    modal.style = "font-family: sans-serif;position: fixed;z-index: 1;padding-top: 100px;left: 0;top: 0;width: 100%;height: 100%;overflow: auto;background-color: rgb(0, 0, 0);background-color: rgba(0, 0, 0, 0.4)";
    content.style = `margin: auto;padding: 20px;border: 1px solid ${error ? "red" : "lime"};width: 40%`;
    closeBtn.style = "color: #aaaaaa;float: right;font-size: 28px;font-weight: bold;";

    content.style.color = "var(--primaryFg)";
    content.style["background-color"] = "var(--secondaryBg)";

    closeBtn.onclick = function () {
        document.body.removeChild(modal);
    }
    closeBtn.onmouseover = function () {
        closeBtn.style = "color: #000 !important;text-decoration: none;cursor: pointer;" + "color: #aaaaaa;float: right;font-size: 28px;font-weight: bold;";
    }
    closeBtn.onmouseleave = function () {
        closeBtn.style = "color: #aaaaaa;float: right;font-size: 28px;font-weight: bold;";
    }

    window.onclick = function (event) {
        if (event.target === modal) {
            document.querySelectorAll('.modalBox').forEach(el => {
                el.outerHTML = "";
            })
        }
    }
}

function logout() {
    XHRGet("/logout");
    location.reload();
}

function showStatusModal(text) {
    try {
        let json = JSON.parse(text);
        if (json.error) {
            showErrModal("ERROR: " + json.text);
        } else {
            showModal(json.text);
        }
    } catch {
        showErrModal("ERROR: Cannot parse JSON")
    }
}

function createListEntry(array, name, renderDiv, objCallback) {
    if (document.querySelector(`.cat_${name}`)) {
        document.querySelector(`.cat_${name}`).outerHTML = "";
    }

    let results = document.createElement('div');
    let clickable = document.createElement('div');
    results.append(clickable)
    clickable.className = "clickable"
    let div = document.createElement('div');
    div.className = `cat cat_${name}`
    let txt = document.createElement('div')
    txt.className = "cat_name"
    txt.innerHTML = name
    div.append(txt)
    let objs = document.createElement('div')
    objs.className = `cat_objs`
    div.append(objs)

    clickable.style = "height: 32px;position: absolute;width: 95%;cursor: pointer;";
    txt.style = "margin: 4px;border-bottom-style: solid;";
    div.style = "background-color: rgb(137, 105, 106);border-style: dotted;margin: 5px;";

    clickable.onclick = () => {
        document.querySelectorAll('.cat_objs').forEach(el => {
            el.outerHTML = ""
        })
        let cat = document.querySelector(`.cat_${name}`)
        let objs = document.createElement('div')
        cat.appendChild(objs);
        objs.className = "cat_objs"
        array.forEach((el, i) => {
            let obj = document.createElement('div')
            obj.innerHTML = `[${i}] : ${JSON.stringify(el)}`
            obj.className = "cat_obj"
            obj.onclick = function () {
                objCallback(el, i)
            }
            objs.append(obj)
            obj.style = "background-color: rgba(0, 0, 0, 0.15);margin: 6px;padding: 6px;cursor: pointer;";
        })
    }

    results.append(div)
    renderDiv.append(results);

    document.querySelectorAll('.cat').forEach(el => {
        let r = Math.round(Math.random() * (155+(themeWhite ? -100 : +100))) + (themeWhite ? 100 : -100)
        let g = Math.round(Math.random() * (155+(themeWhite ? -100 : +100))) + (themeWhite ? 100 : -100)
        let b = Math.round(Math.random() * (155+(themeWhite ? -100 : +100))) + (themeWhite ? 100 : -100)
        el.style['background-color'] = `rgb(${r},${g},${b})`
    })
    return results;
}

function showObjPopup(name, props, buttons, closecb) {
    if (document.querySelector(".objPopup0_0"))
        document.querySelector(".objPopup0_0").outerHTML = "";
    document.body.style.overflowY = '';
    if (!name) return;
    document.body.style.overflowY = 'hidden';
    if (!buttons) buttons = [];
    let wholePopup = document.createElement('div');
    let bg = document.createElement('div');
    let popup = document.createElement('div');
    let nameArea = document.createElement('div');
    let propsArea = document.createElement('div');
    let btnArea = document.createElement('div');
    let closeBtn = document.createElement('div');

    bg.style = 'width: 100%; height: 100%;  top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.5);position: fixed;';
    popup.style = 'width: 50%;height: 50%;position: fixed;top: 25%;left: 25%;';

    popup.style.backgroundColor = "var(--primaryBg)";
    popup.style["border-color"] = "var(--primaryFg)";
    popup.style["border-style"] = "groove";
    popup.style["border-width"] = "2px";

    wholePopup.appendChild(bg);
    wholePopup.appendChild(popup);

    popup.appendChild(nameArea);
    popup.appendChild(propsArea);
    popup.appendChild(btnArea);
    popup.appendChild(closeBtn);

    closeBtn.innerHTML = "x";
    closeBtn.style = "position: relative;right: 0px;width: 20px;left: calc(100% - 20px);background-color: red;height: 20px;text-align: center;cursor: pointer;";
    closeBtn.onclick = function () {
        if (closecb) return closecb();
        if (document.querySelector(".objPopup0_0"))
            document.querySelector(".objPopup0_0").outerHTML = "";
        document.body.style.overflowY = '';
    }

    let nameArea_header = document.createElement('div');
    let nameArea_name = document.createElement('div');

    nameArea.appendChild(nameArea_header);
    nameArea.appendChild(nameArea_name);

    nameArea.style = 'border: medium none black; height: 40px; left: 3%; position: absolute; width: 93%; top: 10px;';
    propsArea.style = 'border: medium none black; height: 90%; left: 3%; position: absolute; width: 93%; top: 60px;';

    nameArea_header.innerHTML = "Name";
    nameArea_name.innerHTML = name;

    nameArea_name.style = 'border-color: black; border-style: dotted; width: 100%;color: gold;';

    let propArea_header = document.createElement('div');
    let propArea_props = document.createElement('div');

    propArea_props.style = 'border-color: black; border-style: dotted; width: 100%;overflow-y: auto;height: 45%;position: relative;';

    propsArea.appendChild(propArea_header);
    propsArea.appendChild(propArea_props);

    propArea_header.innerHTML = "Props";

    Object.keys(props).forEach(key => {
        let prop = document.createElement('div');
        let name = document.createElement('div');
        let value = document.createElement('div');

        prop.appendChild(name);
        prop.appendChild(value);

        name.innerHTML = key;
        value.innerHTML = props[key];
        value.style = "display: inline;";
        if (!isNaN(parseFloat(props[key]))) {
            value.style.color = "#54acc3"
        } else if (props[key] === true || props[key] === false) {
            value.style.color = "#bb5a31"
        } else {
            value.style.color = "#499b54"
        }

        name.style = "width: 25%;display: inline-block;color:gold;";


        propArea_props.appendChild(prop);
    })

    btnArea.style = 'position: absolute;left: 20px;top: 80%;';

    buttons.forEach(el => {
        let prop = document.createElement('button');

        prop.innerHTML = el.name;
        prop.onclick = el.onclick;

        btnArea.appendChild(prop);
    })

    wholePopup.className = "objPopup0_0";
    if (document.querySelector(".objPopup0_0"))
        document.querySelector(".objPopup0_0").outerHTML = "";
    document.body.appendChild(wholePopup);
}

function showIFramePopup(src, buttons, closecb) {
    document.body.style.overflowY = 'hidden';
    if (document.querySelector(".objPopup0_0"))
        document.querySelector(".objPopup0_0").outerHTML = "";
    if (!buttons) buttons = [];
    let wholePopup = document.createElement('div');
    let bg = document.createElement('div');
    let popup = document.createElement('div');
    let closeBtn = document.createElement('div');
    let btnArea = document.createElement('div');
    let frame = document.createElement('iframe');
    popup.appendChild(frame);
    if (src) {
        frame.src = src;
    }

    bg.style = 'width: 100%; height: 100%;  top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.5);position: fixed;';
    popup.style = 'width: 50%;height: 50%;position: fixed;top: 25%;left: 25%;';

    popup.style.backgroundColor = "var(--primaryBg)";
    popup.style["border-color"] = "var(--primaryFg)";
    popup.style["border-style"] = "groove";
    popup.style["border-width"] = "2px";

    wholePopup.appendChild(bg);
    wholePopup.appendChild(popup);
    popup.appendChild(btnArea);

    popup.appendChild(closeBtn);

    closeBtn.innerHTML = "x";
    closeBtn.style = "position: relative;right: 0px;width: 20px;left: calc(100% - 20px);background-color: red;height: 20px;text-align: center;cursor: pointer;";
    closeBtn.onclick = function () {
        if (closecb) return closecb();
        if (document.querySelector(".objPopup0_0"))
            document.querySelector(".objPopup0_0").outerHTML = "";
        document.body.style.overflowY = ''
    }

    wholePopup.className = "objPopup0_0";
    if (document.querySelector(".objPopup0_0"))
        document.querySelector(".objPopup0_0").outerHTML = "";
    document.body.appendChild(wholePopup);

    btnArea.style = 'position: absolute;left: 20px;top: 80%;';

    buttons.forEach(el => {
        let prop = document.createElement('button');

        prop.innerHTML = el.name;
        prop.onclick = el.onclick;

        btnArea.appendChild(prop);
    })

    frame.style = "position:absolute;width:100%;height:100%;"

    return frame;
}

function showHTMLPopup(html, buttons, closecb) {
    document.body.style.overflowY = 'hidden';
    if (document.querySelector(".objPopup0_0"))
        document.querySelector(".objPopup0_0").outerHTML = "";
    if (!buttons) buttons = [];
    let wholePopup = document.createElement('div');
    let bg = document.createElement('div');
    let popup = document.createElement('div');
    let closeBtn = document.createElement('div');
    let btnArea = document.createElement('div');
    let frame = document.createElement('div');
    popup.appendChild(frame);
    if (html) {
        frame.innerHTML = html;
    }

    bg.style = 'width: 100%; height: 100%;  top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.5);position: fixed;';
    popup.style = 'width: 50%;height: 50%;position: fixed;top: 25%;left: 25%;';

    popup.style.backgroundColor = "var(--primaryBg)";
    popup.style["border-color"] = "var(--primaryFg)";
    popup.style["border-style"] = "groove";
    popup.style["border-width"] = "2px";

    wholePopup.appendChild(bg);
    wholePopup.appendChild(popup);
    popup.appendChild(btnArea);

    popup.appendChild(closeBtn);

    closeBtn.innerHTML = "x";
    closeBtn.style = "position: relative;right: 0px;width: 20px;left: calc(100% - 20px);background-color: red;height: 20px;text-align: center;cursor: pointer;";
    closeBtn.onclick = function () {
        if (closecb) return closecb();
        if (document.querySelector(".objPopup0_0"))
            document.querySelector(".objPopup0_0").outerHTML = "";
        document.body.style.overflowY = ''
    }

    wholePopup.className = "objPopup0_0";
    if (document.querySelector(".objPopup0_0"))
        document.querySelector(".objPopup0_0").outerHTML = "";
    document.body.appendChild(wholePopup);

    btnArea.style = 'position: absolute;left: 20px;top: 80%;';

    buttons.forEach(el => {
        let prop = document.createElement('button');

        prop.innerHTML = el.name;
        prop.onclick = el.onclick;

        btnArea.appendChild(prop);
    })

    frame.style = "position:absolute;width:100%;height:100%;"

    return frame;
}

function messageBoxYN(txt) {
    return confirm(txt);
}

function messageBoxInput(txt) {
    return prompt(txt);
}

function XHRGet(url) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${url}${createURLWithHash()}`, false)
    xhr.send(null)
    return (xhr.responseText);
}

function XHRPost(url, body) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${url}${createURLWithHash()}`, false)
    xhr.setRequestHeader("Content-Type", "Application/json");
    xhr.send(JSON.stringify(body));
    return (xhr.responseText);
}

async function XHRGetAsync(url, progressCB) {
    return new Promise((r, j) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', `${url}${createURLWithHash()}`, true)
        xhr.send(null)

        xhr.onprogress = function (evt) {
            if (progressCB) {
                if (evt.lengthComputable) {
                    progressCB(evt.loaded, evt.total)
                }
            }
        };

        xhr.onreadystatechange = function (aEvt) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200)
                    r(xhr.responseText);
                else
                    j();
            }
        };
    })
}

async function XHRGetAsyncHead(url) {
    return new Promise((r, j) => {
        let xhr = new XMLHttpRequest();
        xhr.open('HEAD', `${url}${createURLWithHash()}`, true)
        xhr.send(null)

        xhr.onreadystatechange = function (aEvt) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    let headers = {};
                    xhr.getAllResponseHeaders().split('\r\n').forEach(el => {
                        if (el)
                            headers[el.split(':')[0]] = (el.split(':')[1]).trim()
                    })
                    r(headers);
                } else
                    j();
            }
        };
    })
}

let requestCached = false;

async function XHRGetCachedAsync(url, progressCB, storeKey) {
    progressCB(0, 1);
    requestCached = false;
    let total = 0;
    let headers = await XHRGetAsyncHead(url);
    if (headers['content-checksum']) {
        let sha = headers['content-checksum'];
        if (headers['content-length']) {
            total = headers['content-length'];
        }
        try {
            let cache = JSON.parse(await getForageItem(storeKey));

            if (cache.sha === sha) {
                downloading = false;
                progressCB(total, total)
                requestCached = true;
                return cache.data;
            }
        } catch {

        }
    }
    let data = (await XHRGetAsync(url, progressCB))
    try {
        let json = {};
        json["sha"] = await sha256(data);
        json["data"] = (data);
        await setForageItem(storeKey, JSON.stringify(json));
    } catch {
    }
    progressCB(total, total);
    return (data);
}

function checkPermission(perms, perm) {
    perms = perms.replaceAll("\n", ";")
    perms = perms.replaceAll(" ", "")
    perms = perms.replaceAll("\r", "")
    perms = perms.replaceAll("\t", "")
    let canAccess = false;
    perms.split(';').forEach(el => {
        if (checkPerm(el, perm)) canAccess = true;
    })
    return canAccess;
}

function checkPerm(uperm, perm) {
    let perma = perm.split('.')
    let uperma = uperm.split('.')
    let boolperms = true;
    let forceperms = false;

    if (perma[0] == "default") return true;

    perma.forEach((el, i) => {
        if (boolperms && uperma[i] == "*") {
            boolperms = true;
            forceperms = true;
        }
        if (el != uperma[i]) {
            boolperms = false;
        }

    })
    return (boolperms || forceperms)
}

async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
}