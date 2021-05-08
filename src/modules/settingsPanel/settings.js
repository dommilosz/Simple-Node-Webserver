function restartServer() {
    postAction("restart");
}

function stopServer() {
    postAction("stop");
}

function postAction(actionType) {
    let resp = XHRPost("/serverAction", {actionType: actionType});
    showStatusModal(resp);
}