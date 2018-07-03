voltageFactor = 100;

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
	if(res.hasOwnProperty('blinkRate')) {
		document.getElementById('blinkRate').value = res.blinkRate;
	}
	else console.log("Unexpected JSON message:", e.data,"end");
};

connection.onclose = function(){
    console.log('WebSocket connection closed');
};

function useDimmer() {
//    var b = Math.round(document.getElementById('dimmer').value**2/1023);
    var b = parseInt(document.getElementById('dimmer').value);
    var str = '#'+ b.toString(16);    
    console.log('Sending value: ' + str); 
    connection.send(str);
}

function preheat() {
	connection.send("O");
	document.getElementById('offButton').style.backgroundColor = '#00878F';
	document.getElementById('randomizeButton').style.backgroundColor = '#999';
	document.getElementById('shineButton').style.backgroundColor = '#999';
    //document.getElementById('dimmer').className = 'disabled';
    //document.getElementById('dimmer').disabled = true;
    //document.getElementById('blinkMax').className = 'disabled';
    //document.getElementById('blinkMax').disabled = true;

	}
	
function shine() {
	connection.send("H");	
	document.getElementById('dimmer').className = 'enabled';
    document.getElementById('dimmer').disabled = false;
	document.getElementById('shineButton').style.backgroundColor = '#00878F';
	document.getElementById('offButton').style.backgroundColor = '#999';
	document.getElementById('randomizeButton').style.backgroundColor = '#999';
	//document.getElementById('blinkMax').className = 'disabled';
    //document.getElementById('blinkMax').disabled = true;

	}	

function randomize(){
	document.getElementById('blinkMax').className = 'enabled';
    document.getElementById('blinkMax').disabled = false;
	connection.send("B");
    document.getElementById('offButton').style.backgroundColor = '#999';
    document.getElementById('randomizeButton').style.backgroundColor = '#00878F';
	document.getElementById('shineButton').style.backgroundColor = '#999';
    //document.getElementById('dimmer').className = 'disabled';
    //document.getElementById('dimmer').disabled = true; 
}

function setBlinkMax() {
   		var b = parseInt(document.getElementById('blinkMax').value);
		var str = '*'+ b.toString(16);    
		console.log('Sending value: ' + str); 
		connection.send(str);
}

function setBlinkRate() {
   		var b = parseInt(document.getElementById('blinkRate').value);
		var str = '_'+ b.toString(16);    
		console.log('Sending value: ' + str); 
		connection.send(str);
}

function parseVoltage(voltage) {
		var val = Number(voltage);
		console.log("voltage: "+voltage);
		console.log("voltage: "+voltage);
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
