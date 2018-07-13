var voltageFactor = 3.7;
var playStatus = 1;
var fadeStatus = 1;
window.onbeforeunload = closeWebsocket;

function closeWebsocket(){
    connection.close();
    return false;
}

var connection = new WebSocket('ws://'+location.hostname+':81/', ['arduino']);
	connection.onopen = function () {
    connection.send('Connect ' + new Date());
};
connection.onerror = function (error) {
    console.log('WebSocket Error ', error);
    alert("Connection error. Try disconnecting all other devices!");
};

connection.onmessage = function (e) {  
    console.log('Wemos says: ', e.data);
    var res = JSON.parse(e.data);
    if(res.hasOwnProperty('voltage')){
		parseVoltage(res.voltage);
	}
	else if(res.hasOwnProperty('maxBrightness')) {
		document.getElementById('blinkMax').value = res.maxBrightness;
		console.log("Brightness loaded", res.maxBrightness);
	}
	if(res.hasOwnProperty('minBrightness')) {
		document.getElementById('blinkMin').value = res.minBrightness;
	}
	if(res.hasOwnProperty('blinkSpeed')) {
		document.getElementById('blinkSpeed').value = res.blinkSpeed;
	}
	if(res.hasOwnProperty('blinkRandomness')) {
		document.getElementById('blinkRandomness').value = res.blinkRandomness;
	}
	else console.log("Unexpected JSON message:", e.data,"end");
};

connection.onclose = function(){
    console.log('WebSocket connection closed');
};

function preheat() {
	connection.send("O");
	clearSettingsMsg();
	document.getElementById('offButton').style.backgroundColor = '#00878F';
	document.getElementById('playButton').style.backgroundColor = '#999';
    document.getElementById('fadeButton').style.backgroundColor = '#999';	
    //document.getElementById('dimmer').className = 'disabled';
    //document.getElementById('dimmer').disabled = true;
    //document.getElementById('blinkMax').className = 'disabled';
    //document.getElementById('blinkMax').disabled = true;

	}

function debounce(fun, mil){
    var timer; 
    return function(){
        clearTimeout(timer); 
        timer = setTimeout(function(){
            fun(); 
        }, mil); 
    };
}

function handlePlayPause() {

	if (playStatus == 1) {
		play();
		}
	else if (playStatus == -1) {
		pause();
		}
	else {
		alert("Play button error");
	}
	playStatus = -1*playStatus;
}



function play(){
	
	document.getElementById('playButton').innerHTML = "Pause";
	document.getElementById('blinkMax').className = 'enabled';
	clearSettingsMsg();
    document.getElementById('blinkMax').disabled = false;
	connection.send("B");
    document.getElementById('offButton').style.backgroundColor = '#999';
    document.getElementById('playButton').style.backgroundColor = '#00878F';
    document.getElementById('fadeButton').style.backgroundColor = '#999';
    
    //document.getElementById('dimmer').className = 'disabled';
    //document.getElementById('dimmer').disabled = true; 
}


function pause(){
	connection.send("P");
	clearSettingsMsg();
	document.getElementById('playButton').innerHTML = "Play";
    document.getElementById('offButton').style.backgroundColor = '#999';
    document.getElementById('playButton').style.backgroundColor = '#00878F';
	document.getElementById('fadeButton').style.backgroundColor = '#999';
    //document.getElementById('dimmer').className = 'disabled';
    //document.getElementById('dimmer').disabled = true; 
}


function handleFadeInFadeOut() {

	if (fadeStatus == 1) {
		fadeIn();
		}
	else if (fadeStatus == -1) {
		fadeOut();
		}
	else {
		alert("Fade button error");
	}
	fadeStatus = -1*fadeStatus;
}

function fadeIn() {
	connection.send("I");
	clearSettingsMsg();
	document.getElementById('fadeButton').innerHTML = "Fade Out";
    document.getElementById('fadeButton').disabled = false;
    document.getElementById('playButton').style.backgroundColor = '#999';
    document.getElementById('offButton').style.backgroundColor = '#999';
    document.getElementById('fadeButton').style.backgroundColor = '#00878F';
	}
	
function fadeOut() {
	connection.send("U");
	clearSettingsMsg();
	document.getElementById('fadeButton').innerHTML = "Fade In";
    document.getElementById('fadeButton').disabled = false;
    document.getElementById('playButton').style.backgroundColor = '#999';
    document.getElementById('offButton').style.backgroundColor = '#999';
    document.getElementById('fadeButton').style.backgroundColor = '#00878F';
	}


function saveSettings(){
	connection.send("S");
	document.getElementById('settingsMsg').innerHTML = "<p>Settings saved.</p>";
}

function loadSettings(){
	connection.send("L");
	document.getElementById('settingsMsg').innerHTML = "<p>Settings loaded.</p>";
}

function clearSettingsMsg() {
	document.getElementById('settingsMsg').innerHTML = "";
	}


function setBlinkMax() {
   		var b = parseInt(document.getElementById('blinkMax').value);
		var str = '*'+ b.toString(16);    
		console.log('Sending value: ' + str); 
		connection.send(str);
}

function setBlinkMin() {
		clearSettingsMsg();
   		var b = parseInt(document.getElementById('blinkMin').value);
		var str = '#'+ b.toString(16);    
		console.log('Sending value: ' + str); 
		connection.send(str);
}

function setBlinkRandomness() {
		clearSettingsMsg();
   		var b = parseInt(document.getElementById('blinkRandomness').value);
		var str = '_'+ b.toString(16);    
		console.log('Sending value: ' + str); 
		connection.send(str);
}

function setBlinkSpeed() {
		clearSettingsMsg();
   		var b = parseInt(document.getElementById('blinkSpeed').value);
		var str = '^'+ b.toString(16);    
		console.log('Sending value: ' + str); 
		connection.send(str);
}


function parseVoltage(voltage) {
		var val = Number(voltage);
		if (val < 0.83) {
			warnVoltage((voltageFactor*val).toPrecision(2));
			}
		else {
			clearVoltage();
			showVoltage((voltageFactor*val).toPrecision(2));
			}		
}

function showVoltage(voltage) {
	document.getElementById('voltage').innerHTML = "<p>Battery level: <strong>"+voltage+"</strong> V</p>";
	}
 
function warnVoltage(voltage) {
	document.getElementById('voltage').style.backgroundColor = '#FF0000';
	document.getElementById('voltage').innerHTML = "<p>Battery critically low. The system will shut down soon.</p> <p>Battery level: <strong>"+voltage+"</strong> V</p>";
	}

	
function clearVoltage() {
	document.getElementById('voltage').style.backgroundColor = '#FFFFFF';
	}		
