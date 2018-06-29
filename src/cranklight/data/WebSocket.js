
var connection = new WebSocket('ws://'+location.hostname+':81/', ['arduino']);
connection.onopen = function () {
    connection.send('Connect ' + new Date());
};
connection.onerror = function (error) {
    console.log('WebSocket Error ', error);
};
connection.onmessage = function (e) {  
    console.log('Server: ', e.data);
    parseVoltage(e.data);
};
connection.onclose = function(){
    console.log('WebSocket connection closed');
};


function preheat() {
	connection.send("O");
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
    document.getElementById('blinkMax').disabled = false;
	connection.send("B");
    document.getElementById('offButton').style.backgroundColor = '#999';
    document.getElementById('playButton').style.backgroundColor = '#00878F';
	document.getElementById('pauseButton').style.backgroundColor = '#999';
    //document.getElementById('dimmer').className = 'disabled';
    //document.getElementById('dimmer').disabled = true; 
}

function pause(){
	connection.send("P");
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
   		var b = parseInt(document.getElementById('blinkMin').value);
		var str = '#'+ b.toString(16);    
		console.log('Sending value: ' + str); 
		connection.send(str);
}

function setBlinkRandomness() {
   		var b = parseInt(document.getElementById('blinkRandomness').value);
		var str = '_'+ b.toString(16);    
		console.log('Sending value: ' + str); 
		connection.send(str);
}



function setBlinkSpeed() {
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
