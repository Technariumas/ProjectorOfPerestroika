var rainbowEnable = false;
var connection = new WebSocket('ws://'+location.hostname+':81/', ['arduino']);
connection.onopen = function () {
    connection.send('Connect ' + new Date());
};
connection.onerror = function (error) {
    console.log('WebSocket Error ', error);
};
connection.onmessage = function (e) {  
    console.log('Server: ', e.data);
};
connection.onclose = function(){
    console.log('WebSocket connection closed');
};

function sendRGB() {
//    var b = Math.round(document.getElementById('dimmer').value**2/1023);
    var b = parseInt(document.getElementById('dimmer').value);
    var str = '#'+ b.toString(16);    
    console.log('Sending value: ' + str); 
    connection.send(str);
}

function randomize(){
    rainbowEnable = ! rainbowEnable;
    if(rainbowEnable){
        connection.send("R");
        document.getElementById('randomizeButton').style.backgroundColor = '#00878F';
        document.getElementById('dimmer').className = 'disabled';
        document.getElementById('dimmer').disabled = true;
    } else {
        connection.send("N");
        document.getElementById('randomizeButton').style.backgroundColor = '#999';
        document.getElementById('dimmer').className = 'enabled';
        document.getElementById('dimmer').disabled = false;
        sendRGB();
    }  
}
