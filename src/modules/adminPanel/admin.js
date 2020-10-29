function GetParams(){
    let url = location.href
    let params = {};

    let regex = /\?[a-z0-9]*=[^?]*/gm;
    let m;
    while ((m = regex.exec(url)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        m.forEach((match, groupIndex) => {
            match = match.replace('?','')
            let matcharr = match.split('=')
            matcharr.shift()
            params[match.split('=')[0]] = matcharr.join('=')
        });
    }

    return params
}