/*
* Copyright (c) 2015 - 2016 Intel Corporation.
*
* Permission is hereby granted, free of charge, to any person obtaining
* a copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to
* permit persons to whom the Software is furnished to do so, subject to
* the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
* LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
* OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

"use strict";

// The program is using the Node.js built-in `fs` module
// to load the config.json and any other files needed
var fs = require("fs");

// The program is using the Node.js built-in `path` module to find
// the file path to needed files on disk
var path = require("path");

// Load configuration data from `config.json` file. Edit this file
// to change to correct values for your configuration
var config = JSON.parse(
     fs.readFileSync(path.join(__dirname, "config.json"))
);

// Initialize the hardware for whichever kit we are using
var board;
if (config.kit) {
  board = require("./" + config.kit + ".js");
} else {
  board = require('./grove.js');
}
board.init(config);

var datastore = require("./datastore");
var mqtt = require("./mqtt");

// The program handles events generated by the various connected
// hardware devices using the Node.js built-in `events` module
var events = new (require("events").EventEmitter)();

// The program is using the `twilio` module
// to make the remote calls to Twilio service
// to send SMS alerts
var twilio;
var smsSent = false;
if (config.TWILIO_ACCT_SID && config.TWILIO_AUTH_TOKEN) {
  twilio = require("twilio")(config.TWILIO_ACCT_SID,
                             config.TWILIO_AUTH_TOKEN);
}

// Send an SMS alert that a possible fire has been detected
function notifySMS() {
  if (!config.TWILIO_ACCT_SID || !config.TWILIO_AUTH_TOKEN) {
    return;
  }

  // only send an SMS every 1 minute
  if (smsSent) {
    return;
  }

  var opts = { to: config.NUMBER_TO_SEND_TO,
               from: config.TWILIO_OUTGOING_NUMBER,
               body: "fire alarm" };

  // send SMS
  twilio.sendMessage(opts, function(err, response) {
    if (err) { return console.error("err:", err); }
    console.log("SMS sent", response);
  });

  smsSent = true;
  setTimeout(function() {
    smsSent = false;
  }, 1000 * 60);
}


	var Device = require('losant-mqtt').Device;
	// Construct a device instance.
	var device = new Device({
	  id: '58437c5ac0b30a010006498a',
  key: '74cb6d80-5743-4d53-8eb1-66c21abaad16',
  secret: '880bd7f430f60abc525a27042261c89a3c355112bf13f7d96146e9b3d9ddc924'
});
// Connect device to Losant.
device.connect();

function fillDashboard() {
  device.sendState({ temp: 100, earthlovepoints: 245, waterconsumed: 230, garbagesaved: 127, loyaltypoints: 6000, moneysaved:88 });
}
// Display and then store record in the remote datastore
// of each time a fire alarm condition has been triggered
function notify() {
  console.log("Drink too hot notification");

  notifySMS();

  var payload = { value: "hot drink", datetime: new Date().toISOString() };
  console.log(payload);
  var tempF = 100;
 // datastore.log(config, payload);
 // mqtt.log(config, payload);

}

// Loops every 500ms to check if the ambient temperature
// has exceeded the threshold, indicating that a possible
// fire emergency exists
function monitorTemperature() {
  var prev = 0;

  setInterval(function() {
    var current = board.getTemperature();

    board.message("temperature: " + current);

    // check if fire alarm should be triggered
    events.emit("start-alarm");
    if (prev < config.ALARM_THRESHOLD && current >= config.ALARM_THRESHOLD) {
    	board.message("treshold: " + config.ALARM_THRESHOLD);
    }

    if (prev >= config.ALARM_THRESHOLD && current < config.ALARM_THRESHOLD) {
      events.emit("stop-alarm");
    }

    prev = current;
  }, 500);
}

function count() {
	var boardCount = board.count;
	console.log("boardCount");
	console.log("********************************************");
	console.log(boardCount);
}
// Called to start the alarm when a possible fire
function alarm() {
  console.log("alarm log 1")
  notify();

  var tick = true;

  board.color("red");
  board.message("hot drink detected!", 1);
  board.buzz();


  events.once("stop-alarm", function() {
    clearInterval(interval);
    board.reset();
  });
}
var buttonCount = board.count;
// The main function makes sure the alarm buzzer and LCD
// are turned off, then starts checking the ambient temperature
// using the connected hardware.
// The custom event `start-alarm` is fired, if a possible
// fire emergency exists, which calls the `alarm()` function.
function main() {
  console.log("temp log 1");
  board.reset();
  console.log("temp log 2");
  monitorTemperature();
  console.log("temp log 3");
  board.setupEvents();
  fillDashboard();
  events.on("start-alarm", alarm);
}

main();
