//If enter is pressed start logging in procedure
onkeypress = function(key){
    if(key.key==="Enter"){
        GetHash()
    }
}

//Handle logging in and set hash in cookies.
function GetHash() {
    try {
        let theUrl = "/auth"
        let body = {
            username: btoa(document.getElementsByClassName("usrinp")[0].value),
            password: btoa(document.getElementsByClassName("passwinp")[0].value),
        }
        if (adminLogin === true) {
            body['admin'] = '1'
        }
        const xhttp = new XMLHttpRequest();
        xhttp.open("POST", theUrl, false);
        xhttp.setRequestHeader("Content-Type", "Application/json");
        xhttp.send(JSON.stringify(body));
        if (xhttp.status === 200) {
            document.cookie = "hash="+JSON.parse(xhttp.responseText).hash;
            document.cookie = "username="+btoa(document.getElementsByClassName("usrinp")[0].value);
            window.location.reload()
        } else if (xhttp.status !== 200 && xhttp.readyState === 4) {
            showStatusModal(xhttp.responseText)
        }

    } catch (ex) {
        showModal(`Exception : ${ex.message}`)
    }
}

//Check permissions level needed to acces the Endpoint and display it.
//Remove hash from url.
function OnLoad() {
    if (document.URL.includes("?hash="))
        window.location.href = window.location.href.split('?')[0]
    if (adminLogin) {
        document.getElementsByClassName('perms')[0].innerHTML = "[ADMIN]"
        document.getElementsByClassName('perms')[0].style['color'] = 'red';
        document.title = "Login [ADMIN]"

        if(checkLogin()){
            document.querySelector("#current-perms").style.display = "";
        }
    }
}