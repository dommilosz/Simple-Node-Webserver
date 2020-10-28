function GetParams(){
    let url = location.href
    let params = {};
    url.split("?").slice(1,1024).forEach(element => {
        params[element.split('=')[0]] =  decodeURI(element.split('=')[1]);
    });
    return params
}