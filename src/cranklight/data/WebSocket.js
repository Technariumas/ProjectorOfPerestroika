
var connection = new WebSocket('ws://'+location.hostname+':81/', ['arduino']);
	connection.onopen = function () {
    connection.send('Connect ' + new Date());
};
connection.onerror = function (error) {
    console.log('WebSocket Error ', error);
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
	document.getElementById('pauseButton').style.backgroundColor = '#999';
    //document.getElementById('dimmer').className = 'disabled';
    //document.getElementById('dimmer').disabled = true;
    //document.getElementById('blinkMax').className = 'disabled';
    //document.getElementById('blinkMax').disabled = true;

	}

function play(){
	document.getElementById('blinkMax').className = 'enabled';
	clearSettingsMsg();
    document.getElementById('blinkMax').disabled = false;
	connection.send("B");
    document.getElementById('offButton').style.backgroundColor = '#999';
    document.getElementById('playButton').style.backgroundColor = '#00878F';
	document.getElementById('pauseButton').style.backgroundColor = '#999';
    //document.getElementById('dimmer').className = 'disabled';
    //document.getElementById('dimmer').disabled = true; 
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

function pause(){
	connection.send("P");
	clearSettingsMsg();
    document.getElementById('offButton').style.backgroundColor = '#999';
    document.getElementById('playButton').style.backgroundColor = '#999';
	document.getElementById('pauseButton').style.backgroundColor = '#00878F';
    //document.getElementById('dimmer').className = 'disabled';
    //document.getElementById('dimmer').disabled = true; 
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
			warnVoltage(voltage);
			}
		else {
			clearVoltage();
			showVoltage(voltage);
			}		
}

function showVoltage(voltage) {
	document.getElementById('voltage').innerHTML = "<p>Battery level: "+voltage+"</p>";
	}

function warnVoltage(voltage) {
	document.getElementById('voltage').style.backgroundColor = '#FF0000';
	document.getElementById('voltage').innerHTML = "<p>Battery critically low. The system will shut down soon.</p> <p>Battery level: "+voltage+"</p>";
	}

	
function clearVoltage() {
	document.getElementById('voltage').style.backgroundColor = '#FFFFFF';
	}		
