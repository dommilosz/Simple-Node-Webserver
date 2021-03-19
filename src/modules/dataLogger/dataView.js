shown = ""

function getData() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `/data${createURLWithHash()}`, false)
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
        txt.innerHTML = `${key} (${json[key].length})`
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
        obj_p = document.createElement('div')

        let txt = JSON.stringify(el.body)
        let displayTxt = txt.substring(0, 200)
        if(el.body.username){
            displayTxt = el.body.username
        }
        obj_p.innerHTML = `[${i}] : ${displayTxt}`
        obj.className = "cat_obj"
        obj_p.className = "el_det"
        obj_p.onclick = function () {
            showObjPopup(el, key, i)
        }
        let btn = document.createElement('button')

        objs.append(obj)
        obj.append(obj_p)
        obj.append(btn)
        btn.innerHTML = "X"
        btn.className = "delBtn"
        btn.onclick = function () {
            if (confirm(`Do You Want to delete ${key} [${i}] item?`)) {
                let req = new XMLHttpRequest()
                req.open("GET", `/Data/delitem/${key}/${i}${createURLWithHash()}`)
                req.send(null)
                setTimeout(function(){
                    getData();
                    showObjects(shown)
                },500)
            }
        }
    })
}
function showObjPopup(obj_json, cat_a, index) {
    function Do_delete() {
        if (confirm(`Do You Want to delete ${cat_a} [${index}] item?`)) {
            let req = new XMLHttpRequest()
            req.open("GET", `/Data/delitem/${cat_a}/${index}${createURLWithHash()}`)
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
    frame.src = `/ViewData/item/${cat_a}/${index}${createURLWithHash()}`
    vals.append(frame)
    frame.className = 'result'

}
