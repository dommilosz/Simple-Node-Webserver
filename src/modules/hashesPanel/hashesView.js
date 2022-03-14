shown = ""

function getData() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `/hashes`, false)
    xhr.send(null)
    let raw_json = JSON.parse(xhr.responseText)

    json = {admin: {}, user: {}, expired: {}}
    Object.keys(raw_json).forEach(key => {
        let ts = +new Date()
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

    document.querySelectorAll('.cat').forEach(el => {
        let r = Math.round(Math.random() * 155) + 100
        let g = Math.round(Math.random() * 155) + 100
        let b = Math.round(Math.random() * 155) + 100
        el.style['background-color'] = `rgb(${r},${g},${b})`
    })
}

getData()

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
    Object.keys(keyjson).forEach((el, i) => {
        let obj = document.createElement('div')
        obj.innerHTML = `[${i}] : ${JSON.stringify(el)} : ${JSON.stringify(keyjson[el].username)}`
        obj.className = "cat_obj"
        obj.onclick = function () {
            showObjPopup(el, key, i)
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
    frame.src = `/ViewHashes/hash/${obj_json}`
    vals.append(frame)
    frame.className = 'result'

}
