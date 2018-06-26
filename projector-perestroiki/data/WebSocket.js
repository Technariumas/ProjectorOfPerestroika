
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
	connection.send("S");	
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
		val = parseInt(voltage);
		if (val < 4) {
			warnVoltage();
			showVoltage(voltage);
			}
		else if (val < 3.8) {
			warnVoltage();
			showVoltage(voltage);
			}
		else {
			clearVoltage();
			showVoltage(voltage);
			}		
}

function showVoltage(voltage) {
	document.getElementById('voltage').innerHTML = "<p>"+voltage+"</p>";
	}

function warnVoltage() {
	document.getElementById('voltage').style.backgroundColor = '#FF0000';
	document.getElementById('voltage').innerHTML = "<p>Battery critically low. The system will shut down immediately.</p> <p>"+voltage+"</p>";
	}

	
function clearVoltage() {
	document.getElementById('voltage').style.backgroundColor = '#FFFFFF';
	}		
