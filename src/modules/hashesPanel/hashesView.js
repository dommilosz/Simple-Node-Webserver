shown = ""

function getData() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `/hashes?hash=${GetParams().hash}?username=${GetParams().username}`, false)
    xhr.send(null)
    raw_json = JSON.parse(xhr.responseText)

    xhr.open('GET', `/one_times?hash=${GetParams().hash}?username=${GetParams().username}`, false)
    xhr.send(null)
    one_times_json = JSON.parse(xhr.responseText)

    json = {admin: {}, user: {}, expired: {}}
    json2 = {one_times_admin: {}, one_times_user: {}, one_times_expired: {}, one_times_used: {}}
    Object.keys(raw_json).forEach(key => {
        ts = +new Date()
        if (raw_json[key].expired) {
            json.expired[key] = raw_json[key]
        } else {
            if (raw_json[key].isAdmin) {
                json.admin[key] = raw_json[key]
            } else {
                json.user[key] = raw_json[key]
            }
        }
    })

    Object.keys(one_times_json).forEach(key => {
        if (one_times_json[key].expired) {
            json2.one_times_expired[key] = one_times_json[key]
        } else if (one_times_json[key].used) {
            json2.one_times_used[key] = one_times_json[key]
        } else {
            if (one_times_json[key].isAdmin) {
                json2.one_times_admin[key] = one_times_json[key]
            } else {
                json2.one_times_user[key] = one_times_json[key]
            }
        }

    })

    let results = $('#results')
    document.getElementById('results').innerHTML = ""
    Object.keys(json).forEach(key => {
        let div = document.createElement('div');
        let clickable = document.createElement('div');
        div.append(clickable)
        clickable.className = "clickable"
        div.className = `cat cat_${key}`
        let txt = document.createElement('div')
        txt.className = "cat_name"
        txt.innerHTML = key
        div.append(txt)
        let objs = document.createElement('div')
        objs.className = `cat_objs cat_objs_${key}`
        div.append(objs)

        clickable.onclick = function () {
            showObjects(key)
        }
        results.append(div)
    })

    results = $('#results2')
    document.getElementById('results2').innerHTML = ""
    Object.keys(json2).forEach(key => {
        let div = document.createElement('div');
        let clickable = document.createElement('div');
        div.append(clickable)
        clickable.className = "clickable"
        clickable.id = `clickable_${key}`
        div.className = `cat cat_${key}`
        let txt = document.createElement('div')
        txt.className = "cat_name"
        txt.id = `cat_name_${key}`
        txt.innerHTML = key
        div.append(txt)
        let objs = document.createElement('div')
        objs.className = `cat_objs cat_objs_${key}`
        div.append(objs)

        clickable.onclick = function () {
            showObjects(key)
        }
        results.append(div)
    })
    let btn = document.createElement('button')
    document.getElementById('clickable_one_times_admin').append(btn)
    let btn2 = document.createElement('button')
    document.getElementById('clickable_one_times_user').append(btn2)
    btn.className = "new-btn"
    btn2.className = "new-btn"
    btn.innerHTML = "+"
    btn2.innerHTML = "+"

    btn.onclick = () => createOTP(true)
    btn2.onclick = () => createOTP(false)

    function createOTP(isAdmin) {
        let xhr = new XMLHttpRequest()
        xhr.open('GET',`/getonetime?hash=${GetParams().hash}?username=${GetParams().username}?admin=${isAdmin?"1":"0"}`,false)
        xhr.send(null)
        let otp = xhr.responseText;
        getData();
        showObjPopup(otp,"one_times_admin","")
    }

    document.querySelectorAll('.cat').forEach(el => {
        let r = Math.round(Math.random() * 155) + 100
        let g = Math.round(Math.random() * 155) + 100
        let b = Math.round(Math.random() * 155) + 100
        el.style['background-color'] = `rgb(${r},${g},${b})`
    })
}

getData()


function GetParams() {
    let url = location.href
    let params = {};
    url.split("?").slice(1, 1024).forEach(element => {
        params[element.split('=')[0]] = decodeURI(element.split('=')[1]);
    });
    return params
}

$(document).ready(function () {
    getData()
});

$("#reload").onclick = function () {
    getData()
}

function showObjects(key) {
    document.querySelectorAll('.cat_objs').forEach(el => {
        el.innerHTML = ""
    })
    if (key === '') return;
    let objs = document.querySelector(`.cat_objs_${key}`)
    let keyjson = json[key];
    if (!keyjson) keyjson = json2[key];
    Object.keys(keyjson).forEach((el, i) => {
        obj = document.createElement('div')
        obj.innerHTML = `[${i}] : ${JSON.stringify(el)} : ${JSON.stringify(keyjson[el].username)}`
        obj.className = "cat_obj"
        obj.onclick = function () {
            showObjPopup(el, key, i)
        }
        if (el === GetParams().hash) {
            obj.innerHTML += ` [CURRENT]`
            obj.className = "cat_obj c-red"
        }
        objs.append(obj)
    })
}

function showObjPopup(obj_json, cat_a, index) {
    let popup = document.querySelector('.obj_popup')
    popup.style.display = 'block'
    popup.innerHTML = ""
    if (obj_json === '') {
        popup.style.display = 'none'
        return
    }
    let cat = document.createElement('div')
    cat.innerHTML = `${cat_a} [${index}]`
    cat.className = "popup_cat_name"

    let closebtn = document.createElement('div')
    closebtn.innerHTML = "X"
    closebtn.className = "popup_close_btn"
    closebtn.onclick = function () {
        showObjPopup('')
    }

    let vals = document.createElement('div')
    popup.append(cat)
    popup.append(vals)
    popup.append(closebtn)

    let frame = document.createElement('iframe')
    frame.src = `/ViewHashes/hash/${obj_json}?hash=${GetParams().hash}?username=${GetParams().username}`
    vals.append(frame)
    frame.className = 'result'

}
