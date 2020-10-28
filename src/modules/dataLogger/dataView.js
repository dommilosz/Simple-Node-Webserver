shown = ""

function getData() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `/data?hash=${GetParams().hash}?username=${GetParams().username}`, false)
    xhr.send(null)
    json = JSON.parse(xhr.responseText)
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
    if (key === shown) {
        showObjects('')
        return;
    }
    shown = key;
    document.querySelectorAll('.cat_objs').forEach(el => {
        el.innerHTML = ""
    })
    if (key === '') return;
    let objs = document.querySelector(`.cat_objs_${key}`)
    let keyjson = json[key];
    keyjson.forEach((el, i) => {
        if (!el) el = {body: 'undefined'}
        obj = document.createElement('div')

        let txt = JSON.stringify(el.body)
        obj.innerHTML = `[${i}] : ${txt.substring(0, 200)}`
        obj.className = "cat_obj"
        obj.onclick = function () {
            showObjPopup(el, key, i)
        }
        objs.append(obj)
    })
}

function showObjPopup(obj_json, cat_a, index) {
    function Do_delete() {
        if (confirm(`Do You Want to delete ${cat_a} [${index}] item?`)) {
            let req = new XMLHttpRequest()
            req.open("GET", `/Data/delitem/${cat_a}/${index}?hash=${GetParams().hash}?username=${GetParams().username}`)
            req.send(null)
            showObjPopup('')
            setTimeout(getData,500)

        }
    }

    let popup = document.querySelector('.obj_popup')
    popup.style.display = 'block'
    popup.innerHTML = ``
    let btn = document.createElement('button')
    btn.innerHTML = "DELETE"
    btn.onclick = () => Do_delete()

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
    btn.className = "delete_btn"
    popup.append(cat)
    popup.append(btn)
    popup.append(vals)
    popup.append(closebtn)

    let frame = document.createElement('iframe')
    frame.src = `/ViewData/item/${cat_a}/${index}?hash=${GetParams().hash}?username=${GetParams().username}`
    vals.append(frame)
    frame.className = 'result'

}
