function registerAcc() {
    let body = {
        username: btoa(document.getElementById("inp_username").value),
        password: btoa(document.getElementById("inp_password").value),
        level: (document.getElementById("inp_level").value),
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/registerAcc", false);
    xhr.setRequestHeader("Content-Type", "Application/json");
    xhr.send(JSON.stringify(body));

    showStatusModal(xhr.responseText)
}

function showObjPopupAcc(el, raw_json, passShow) {
    let raw_json_h = JSON.parse(JSON.stringify(raw_json));
    if (!passShow) {
        raw_json_h[el].password = "[HIDDEN]"
    }
    showObjPopup(el, raw_json_h[el], [
        {
            name: "Delete", onclick: function () {
                if (messageBoxYN(`Do you want to remove account "${el}"`)) {
                    removeAccount(el);
                    getAccounts();
                }
            }
        },
        {
            name: `Switch to ${raw_json[el].admin ? "USER" : "ADMIN"}`, onclick: function () {
                if (messageBoxYN(`Do you want to make account "${el}" ${raw_json[el].admin ? "USER" : "ADMIN"}`)) {
                    changeAccount(el, undefined, !raw_json[el].admin);
                    getAccounts();
                }
            }
        },
        {
            name: `Change username`, onclick: function () {
                let inp = messageBoxInput("New Username")
                if (inp) {
                    changeAccount(el, undefined, undefined, inp);
                    getAccounts();
                }

            }
        }, {
            name: `Change password`, onclick: function () {
                let inp = messageBoxInput("New Password")
                if (inp) {
                    changeAccount(el, inp, undefined, undefined);
                    getAccounts();
                }

            }
        }, {
            name: `${passShow ? "Hide" : "Show"} pass`, onclick: function () {
                showObjPopupAcc(el, raw_json, !passShow)

            }
        }, {
            name: `Change permissions`, onclick: function () {
                /*
                showHTMLPopup("<textarea style='width: 100%;height: 100%;resize: none' id='permissions''></textarea>",[{
                    name: `SAVE`, onclick: function () {
                        changeAccountPerms(el,document.querySelector('#permissions').value);
                        getAccounts();
                    }
                }])
                document.querySelector('#permissions').value =raw_json[el].permissions?raw_json[el].permissions:"user.*";
                */
                showIFramePopup(`/permsGUI?user=${btoa(el)}`,undefined,_=>{showObjPopupAcc(el, raw_json, passShow)})
            }
        }, {
            name: `Change customProps`, onclick: function () {
                showIFramePopup(`/customPropsGUI?user=${btoa(el)}`,undefined,_=>{showObjPopupAcc(el, raw_json, passShow)})
            }
        }

    ])
}


function getAccounts() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `/accountsRaw${createURLWithHash()}`, false)
    xhr.send(null)
    raw_json = JSON.parse(xhr.responseText)
    showObjPopup();
    createListEntry(Object.keys(raw_json), "accounts", document.querySelector("#accounts-user"), function (el, i) {
        showObjPopupAcc(el, raw_json, false)
    })
}

function removeAccount(name) {
    let body = {
        username: name
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/deleteAcc", false);
    xhr.setRequestHeader("Content-Type", "Application/json");
    xhr.send(JSON.stringify(body));

    showStatusModal(xhr.responseText)
}

function changeAccount(name, pass, isAdmin, newName, custom) {
    let body = {
        username: name,
        password: pass,
        admin: isAdmin,
        newUsername: newName,
        custom: custom,
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/changeAcc", false);
    xhr.setRequestHeader("Content-Type", "Application/json");
    xhr.send(JSON.stringify(body));

    showStatusModal(xhr.responseText)
}

function changeAccountPerms(name, perms) {
    perms = perms.replaceAll("\n", ";")
    perms = perms.replaceAll(" ", "")
    perms = perms.replaceAll("\r", "")
    perms = perms.replaceAll("\t", "")
    let body = {
        username: name,
        permissions: perms
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/changePerms", false);
    xhr.setRequestHeader("Content-Type", "Application/json");
    xhr.send(JSON.stringify(body));

    showStatusModal(xhr.responseText)
}

let perms = ""

function renderPermsCheckbox() {
    document.querySelector('.curr_acc').innerHTML = user;
    let json = XHRGet("/permsRaw")
    let accounts = XHRGet('/accountsRaw');
    perms = accounts[user].permissions;
    document.querySelector('#perms_area').value = perms;
    let placeholder = document.getElementById('perms');
    placeholder.innerHTML = "";
    document.querySelector('#perms_area').onchange = function () {
        perms = document.querySelector('#perms_area').value;
        let boxes = document.querySelectorAll('input');
        boxes.forEach(el => {
            el.checked = checkPermission(perms, el.value)
        })
    }

    renderPermsBoxes(0, {"": json}, placeholder, "");


}

function savePerms() {
    changeAccountPerms(user, perms);
}

function refreshBoxes(input) {
    let boxes = document.querySelectorAll('input');
    boxes.forEach(el2 => {
        if (el2.value.startsWith(input.value)) {
            if (el2.checked !== input.checked) {
                el2.checked = input.checked;
                refreshBoxes(input)
            }
        }
    })
    perms = "";
    boxes.forEach(el2 => {
        if (input.value.startsWith(el2.value)) {
            let atLeast1True = false;
            let atLeast1False = false;
            boxes.forEach(el3 => {
                if (el3.value.startsWith(el2.value)) {
                    if (el3.checked) {
                        if (el3.value !== el2.value)
                            atLeast1True = true;
                    } else {
                        if (el3.value !== el2.value)
                            atLeast1False = true;
                    }
                }
            })
            if (atLeast1True && atLeast1False) {
                el2.indeterminate = true;
                el2.checked = false;
            }
            if (!atLeast1True && atLeast1False) {
                el2.indeterminate = false;
                el2.checked = false;
            }
            if (atLeast1True && !atLeast1False) {
                el2.indeterminate = false;
                el2.checked = true;
            }
        }
        let fullPerms = false;
        boxes.forEach(el => {
            if (el.checked) {
                let perm = el.value + ".*;\n";
                if (!checkPermission(perms, perm))
                    perms += perm;
                if (el.value === "") {
                    fullPerms = true;
                }
            }
        })
        if (fullPerms) {
            perms = "*.*"
        }
    })
    document.querySelector('#perms_area').value = perms;
}

function renderPermsBoxes(level, json, placeholder, orgperm) {
    Object.keys(json).forEach(key => {
        let orgperm2 = ((orgperm !== "" ? (orgperm + ".") : "") + key)
        let permObj = document.createElement('div');
        let name = document.createElement('div');
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.value = orgperm2;
        if (checkPermission(perms, key)) {
            input.checked = true;
        }
        input.onclick = function () {
            for (let i = 0; i < level + 1; i++) {
                refreshBoxes(input);
            }

        }
        name.innerHTML = key;
        if (level === 0) {
            name.innerHTML = "root";
        }

        for (let i = 0; i < level; i++) {
            name.innerHTML = "- " + name.innerHTML;
        }
        name.style = 'display: inline-block;width: 35%;position: relative;' + ``;
        permObj.appendChild(name)
        permObj.appendChild(input)
        placeholder.appendChild(permObj);

        if (Object.keys(json[key]).length > 0) {
            renderPermsBoxes(level + 1, json[key], placeholder, orgperm2)
        }
    })
}

function renderCustomValuesFields() {
    document.querySelector('.curr_acc').innerHTML = user;
    let accounts = XHRGet('/accountsRaw');
    perms = accounts[user].customProps;
    let placeholder = document.querySelector('#custom_area');
    placeholder.innerHTML = "";

    Object.keys(accounts[user].customProps).forEach(key => {
        let el = accounts[user].customProps[key];
        let name = document.createElement('div');
        let delBtn = document.createElement('button');
        name.innerHTML = key+"&nbsp;&nbsp;";
        name.style = "display:inline;";
        let box;
        if (typeof el === typeof "") {
            box = document.createElement('input');
            box.type = "text";
            box.value = el;
        }
        if (typeof el === typeof 1) {
            box = document.createElement('input');
            box.type = "number";
            box.value = el;
        }
        if (typeof el === typeof true) {
            box = document.createElement('input');
            box.type = "checkbox";
            box.checked = el;
        }

        box.setAttribute("customProp", key);
        box.setAttribute("cType", typeof el);
        box.className = "customPropEditBox";

        let ph2 = document.createElement('div');
        document.querySelector("#custom_area").appendChild(ph2);
        ph2.appendChild(name);
        ph2.appendChild(box);
        ph2.appendChild(delBtn);

        delBtn.onclick=function (){
            ph2.outerHTML = "";
        }
        delBtn.innerHTML = "Delete";
    })
}

function saveCustom(){
    changeAccount(user, undefined, undefined,undefined,getCustomFromHTML());

    function getCustomFromHTML(){
        let custom = {};
        document.querySelectorAll(".customPropEditBox").forEach(el=>{
            let value = el.value;
            if(el.getAttribute("cType")=== typeof true){
                value = el.checked;
            }
            custom[el.getAttribute("customProp")] = value;
        })
        return custom;
    }
}
