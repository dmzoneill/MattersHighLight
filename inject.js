// this is the code which will be injected into a given page...

var highlights = [];
var ignored_events = ["channel_viewed", "channel_viewed", "hello", "status_change", "user_updated"];
var last_id = "m8mmriwf578hujsnuc1udr1mmo";

var highmonVisible = true;
var debugmode = false;

function debug(msg, override = false) {
	if (debugmode || override) {
		console.log(msg);
	}
}

function addHighlight(eventData, historial) {
	debug(eventData);
	var mmobj = JSON.parse(eventData);

	if (ignored_events.indexOf(mmobj.event) > -1) {
		debug("Ignored event: " + mmobj.event);
		return false;
	}

	var data = mmobj.data;

	if (!data.hasOwnProperty('post')) {
		return false;
	}

	debug(data);
	var post = JSON.parse(data.post);

	debug(data['channel_display_name'])
	debug("sender = " + data['sender_name'])
	debug("sender id = " + post['user_id'])
	debug("message = " + post['message'])
	debug("create_at = " + post['create_at'])

	if (post['id'] == last_id) {
		return;
	}

	var found = false;
	var val = "";
	var color_msg = post['message'];

	var soundboard = JSON.parse(window.localStorage.getItem('soundboard'));

	debug(soundboard);

	debug(data, true);

	$.each(soundboard, function (key, value) {
		var escapedBoldMarkdown = key.replace(/\*\*/g, '\\*\\*');
		var re = new RegExp(escapedBoldMarkdown, 'gi');
		var matches = post['message'].match(re);
		if (matches != null) {
			var thecolor = key.indexOf("stop the") > -1 ? "#dd0000" : "#2998fb";
			color_msg = post['message'].replace(key, "<span style='color:" + thecolor + "'>" + key + "</span>")
			val = value;
			found = key;

			if (val[1] == true && (hours < window.localStorage.getItem('hour_min') || hours > window.localStorage.getItem('hour_max'))) {
				debug(found + " was true, but its outside business hours");
			} else {
				if (historial == false && window.localStorage.getItem('cb_sounds') == "true") {
					playSound(val[0]);
				}
			}
		}
	});

	if (found == false) {
		return;
	}

	var create_at = new Date(parseInt(post['create_at']));
	var hours = ('0' + create_at.getHours().toString()).slice(-2);
	var minutes = ('0' + create_at.getMinutes().toString()).slice(-2);
	//var seconds = ('0' + create_at.getSeconds().toString()).slice(-2);
	var dstring = hours + ":" + minutes;

	var channel_display_name = data['channel_display_name'].charAt(0) == '@' ? data['channel_display_name'].substring(1) : data['channel_display_name'];
	var sender_name = data['sender_name'].charAt(0) == '@' ? data['sender_name'].substring(1) : data['channel_display_name'];
	//Open Sans", sans-serif
	var row = "<tr class='highlightRow'>";
	row += "<td style='padding-left: 10px; padding-right: 20px; width: 70px; white-space: nowrap; padding-top: 4px'><span style='font-size: 9pt; color: #83827e;'>" + dstring + "</span></td>";
	row += "<td style='padding-left: 20px; font-size: 10pt; width: 120px; white-space: nowrap; padding-top: 4px'>" + channel_display_name + "</td>";
	row += "<td style='padding-left: 20px; font-size: 10pt; width: 100%; text-alight: left; padding-top: 4px'><b>" + sender_name + ": </b>&nbsp;&nbsp;" + color_msg + "</td>";
	row += "</tr>";

	var matches = post['message'].match(/(https?:\/\/[^\s]+)/gi);
	if (matches != null && historial == false) {
		if (window.localStorage.getItem('cb_xdgopen') == "true") {
			var last = "";
			for (var t = 0; t < matches.length; t++) {
				var thematch = matches[t];
				if(thematch.endsWith(")")) {
					thematch = thematch.substring(0, thematch.length - 1);
				}
				if(thematch.endsWith("):")) {
					thematch = thematch.substring(0, thematch.length - 2);
				}
				if(thematch != last) {
					// prevent duplicate openings
					debug("opening: " + thematch);
					window.open(thematch, "_blank");
					last = thematch;
				}
			}
		}
	}

	if (window.localStorage.getItem('cb_pagerduty') == "true" && historial == false) {
		debug("=====================================");
		var matches = post['message'].trim().match(/[A-Z0-9]{7} \*\*TRIGGERED\*\*/gi);
		debug(matches);
		if (matches != null) {
			for (var t = 0; t < matches.length; t++) {
				debug(matches[t]);
				parts = matches[t].split(/\s+/);
				debug(parts);
				$.ajax({
					type: "PUT",
					url: "https://api.pagerduty.com/incidents",
					data: '{"incidents": [{"id": "' + parts[0] + '","type": "incident_reference","status": "acknowledged"}]}',
					headers: {
						'Accept': 'application/vnd.pagerduty+json;version=2',
						'Authorization': 'Token token=' + window.localStorage.getItem('pagerDutyKey').trim(),
						'Content-Type': 'application/json'
					},
					success: function (data) { debug(data); },
					dataType: "json"
				});
			}
		}
	}

	$('#highmon_history tbody').append(row);
	$('#highmonBody').animate({ scrollTop: $('#highmonBody').prop("scrollHeight") }, 250);

	var rowCount = $('#highmon_history >tbody >tr').length;
	if (rowCount > 1000) {
		highlights.shift();
		$("#highmon_history >tbody >tr:first-child").remove();
	}

	last_id = post['id'];

	return true;
}

function playSound(sound) {
	var myAudio = new Audio(chrome.runtime.getURL(sound));
	myAudio.volume = 0.1;
	myAudio.play();
}

function listenToSocketHighlights() {
	debug("=======cookie=============");
	debug(document.cookie);
	debug("=======cookie=============");

	var exampleSocket = new WebSocket("wss://" + window.location.hostname + "/api/v4/websocket");
	var token = window.localStorage.getItem('mattersMostToken').trim();

	exampleSocket.onopen = function (event) {
		exampleSocket.send("{\"seq\": 1,\"action\": \"authentication_challenge\",\"data\": {\"token\": \"" + token + "\"}}");
	}

	exampleSocket.onmessage = function (event) {
		var result = addHighlight(event.data, false);
		if (result) {
			highlights.push(event.data);
			window.localStorage.setItem('highlights', JSON.stringify(highlights));
		}
	}

	exampleSocket.onclose = function(event) {
		debug('onclose: ' + event.code, true)
		debug('onclose: ' + event.reason, true)
		debug('onclose: ' + event.wasClean, true)
	};

	exampleSocket.onerror = function(event) {
		debug('onerror: ' + event.error, true)
	};
}

function refreshSwatch() {
	$("#highmonBody").animate({ height: $("#slider").slider("value") }, 350, function () {
		$('#highmonBody').animate({ scrollTop: $('#highmonBody').prop("scrollHeight") }, 250);
		window.localStorage.setItem('highmonHeight', $("#slider").slider("value"));
		debug(window.localStorage.getItem('highmonHeight'));
	});
}

function save_soundboard() {
	var new_soundboard = {};
	$(".highlighRow").each(function (index, element) {
		var highlight = $(this).children("div:first").children("input:first").val();
		var audiofile = $(this).children("select").eq(1).val();
		var businesshours = $(this).children("select:first").val() == "true" ? true : false;
		new_soundboard[highlight] = [audiofile, businesshours];
	});
	debug(new_soundboard);
	window.localStorage.setItem('soundboard', JSON.stringify(new_soundboard));
}

function prepareHighLightMonitor() {
	var uppic = chrome.runtime.getURL("up.png");
	var downpic = chrome.runtime.getURL("down.png");
	var alertpic = chrome.runtime.getURL("alert.png");
	var settingsic = chrome.runtime.getURL("settings.png");

	var header = "<img style='width: 16px;' src='" + alertpic + "'> <b>Highlight Monitor<b>";
	header += " <img style='cursor: pointer;' id='highmonToggle' src='" + downpic + "'> ";
	header += " <input style='margin-left:10px;' type='checkbox' id='cb_pagerduty'> <span style='font-size: 9pt; color: #83827e;'> &nbsp;&nbsp;Pager Duty Acker<span> ";
	header += " <input style='margin-left:10px;' type='checkbox' id='cb_xdgopen'> <span style='font-size: 9pt; color: #83827e;'> &nbsp;&nbsp;Auto open url<span> ";
	header += " <input style='margin-left:10px;' type='checkbox' id='cb_sounds'> <span style='font-size: 9pt; color: #83827e;'> &nbsp;&nbsp;Sound notifcations<span> ";
	header += " <div id='slider' style='margin-left:10px; display: inline-block; width: 80px'></div>";
	header += " <button style='margin-left:10px;' id='clearAlerts'>Clear Alerts</button>";
	header += " <img style='margin-left:10px; width: 16px; cursor: pointer;' id='settingsButton' src='" + settingsic + "'> ";
	header += "<br>";
	header += "<div id='highMonSettings' style='margin-left:25px; margin-top: 10px'>";
	header += " Pager Duty Key <input type='text' id='pagerDutyKey' style='margin-right:10px; margin-left:10px; font-size: 9pt; height:20px; width: 200px'>";
	header += " MattersMost Token <input type='text' id='mattersMostToken' style='margin-right:10px; margin-left:10px; font-size: 9pt; height:20px; width: 200px'><br>";
	header += " <div style='margin-top: 10px; margin-bottom: 10px;'> Business hours <div style='display: inline-block; width:250px; margin-left:20px; margin-right:10px' id='business-hours-range'></div> <span id='hours'/></div>";
	header += " <span style='display: inline-block; margin-top:0px; font-weight: bold'>Highlights</span>";
	header += "<button style='margin-left:0px; margin-top:0px; font-size: 8pt; font-weight: bold; border: 0px; height:20px; background-color: transparent;' class='addItem'>";
	header += "<img style='width:16px' src='" + chrome.runtime.getURL("add.png") + "'>";
	header += "</button>";
	header += "<div id='highlightsTable' style='margin-top: 5px; margin-bottom: 5px; border-bottom: 1px solid #454545; border-top: 1px solid #454545; padding: 10px'></div>";
	header += "<div style='padding: 10px'>1) Input is treated as regex.<br>2) ** will be replaced by \\*\\*<br>3) * is normal the normal 0 1 or many multiplier</div>";
	header += "</div>";

	$("#highmonHeader").html("");
	$("#highmonHeader").append(header);

	var soundboard = {
		// highlight, audio file, business hours
		'[A-Z0-9]{7} \*\*TRIGGERED\*\*': ['fart6.mp3', true],
		'dmzoneill': ['fart8.mp3', true],
		'bsv': ['fart6.mp3', true],
		'bsavg': ['fart5.mp3', true],
		'bscvg': ['fart4.mp3', true],
		'bsteam': ['fart2.mp3', true],
		'bseng': ['fart2.mp3', true],
		'bsmgmt': ['fart1.mp3', true],
		'stop the line': ['flush.mp3', false],
		'stop the line bootstack': ['flush.mp3', false],
		'stop the line - bootstack': ['flush.mp3', false],
		'pastebin.canonical.com': ['facebook.mp3', true],
		'canonical.my.salesforce.com': ['facebook.mp3', true]
	}

	if (window.localStorage.getItem('soundboard') != null) {
		soundboard = JSON.parse(window.localStorage.getItem('soundboard'));
	} else {
		window.localStorage.setItem('soundboard', JSON.stringify(soundboard));
	}

	var manifest = chrome.runtime.getManifest();
	debug(manifest);
	var war = manifest['web_accessible_resources'];
	var warmp3 = [];
	$.each(war, function (key, value) {
		if (value.toLowerCase().endsWith("mp3")) {
			warmp3.push(value);
		}
	});

	var x = 0;
	$.each(soundboard, function (key, value) {
		var row = "<div style='margin-bottom: 4px' class='highlighRow'>";

		row += "Highlight<div style='margin-right: 10px; margin-left: 10px; padding: 2px; background-color: #FFFFFF; border-radius: 3px 3px; width: 250px; display:inline-block;'>";
		row += "<span style='width: 10px; padding 0px; margin-left: 5px; margin: 0px; align: center; text-align: center; display:inline-block;'>/</span>";
		row += "<input type='text' value='" + key + "' style='border: 0px; outline: none; width:220px; font-size: 9pt; height: 14px' class='highlighItem'>";
		row += "<span style='width: 10px; padding 0px; margin: 0px; align: center; text-align: center; display:inline-block;'>/gi</span>";
		row += "</div>";

		//row += "Highlight /<input type='text' value='" + key + "' style='margin-right:10px; margin-left:10px; font-size: 9pt; height:20px' class='highlighItem'>/gi ";
		row += "Restrict to <select style='margin-right:10px; margin-left:10px; font-size: 9pt; height:20px' class='highlighItem'>";
		row += "<option value='true' " + (value[1] == true ? "selected='selected'" : "") + ">Business hours</option>";
		row += "<option value='false' " + (value[1] == false ? "selected='selected'" : "") + ">Anytime</option></select>";

		var select = "<select style='margin-right:10px; margin-left:10px; font-size: 9pt; height:20px' class='highlighItem'>";
		$.each(warmp3, function (key, val) {
			select += "<option value='" + val + "' " + (value[0] == val ? "selected='selected'" : "") + ">" + val + "</option>";
		});
		select += "</select>";

		row += "Sound " + select;
		row += "<button style='margin-left:0px; font-size: 8pt; font-weight: bold; border: 0px; height:20px; background-color: transparent;' class='playAudioItem'>";
		row += "<img style='width:16px' src='" + chrome.runtime.getURL("play.png") + "'";
		row += "</button>";
		row += "<button style='margin-left:0px; font-size: 8pt; font-weight: bold; border: 0px; height:20px; background-color: transparent;' class='deleteItem'>";
		row += "<img style='width:16px' src='" + chrome.runtime.getURL("delete.png") + "'";
		row += "</button>";
		row += "</div>";
		$("#highlightsTable").append(row);
		x++;
	});

	$('body').on('change', '.highlighItem', function() {
		save_soundboard();
	});

	$('body').on('click', 'button.playAudioItem', function() {
		var parent = $(this).parent();
		var audiofile = $(parent).children("select").eq(1).val();
		var myAudio = new Audio(chrome.runtime.getURL(audiofile));
		myAudio.volume = 0.2;
		myAudio.play();
	});

	$('body').on('click', 'button.deleteItem', function() {
		var parent = $(this).parent();
		$(parent).remove();
		save_soundboard();	
	});

	$(".addItem").click(function () {
		var row = "<div style='margin-bottom: 4px' class='highlighRow'>";
		row += "Highlight<div style='margin-right: 10px; margin-left: 10px; padding: 2px; background-color: #FFFFFF; border-radius: 3px 3px; width: 250px; display:inline-block;'>";
		row += "<span style='width: 10px; padding 0px; margin: 0px; margin-left: 5px; align: center; text-align: center; display:inline-block;'>/</span>";
		row += "<input type='text' value='[A-Za-z0-9]*whatever' style='border: 0px; outline: none; width:220px; font-size: 9pt; height: 14px' class='highlighItem'>";
		row += "<span style='width: 10px; padding 0px; margin: 0px; align: center; text-align: center; display:inline-block;'>/gi</span>";
		row += "</div>";

		//row += "Highlight /<input type='text' value='[A-Za-z0-9]*whatever' style='margin-right:10px; margin-left:10px; font-size: 9pt; height:20px' class='highlighItem'>/gi ";
		row += "Restrict to <select style='margin-right:10px; margin-left:10px; font-size: 9pt; height:20px' class='highlighItem'>";
		row += "<option value='true'>Business hours</option>";
		row += "<option value='false'>Anytime</option></select>";

		var select = "<select style='margin-right:10px; margin-left:10px; font-size: 9pt; height:20px' class='highlighItem'>";
		$.each(warmp3, function (key, val) {
			select += "<option value='" + val + "'>" + val + "</option>";
		});
		select += "</select>";

		row += "Sound " + select;
		row += "<button style='font-size: 8pt; font-weight: bold; border: 0px; height:20px; background-color: transparent;' class='playAudioItem'>";
		row += "<img style='width:16px' src='" + chrome.runtime.getURL("play.png") + "'";
		row += "</button>";
		row += "<button style='font-size: 8pt; font-weight: bold; border: 0px; height:20px; background-color: transparent;' class='deleteItem'>";
		row += "<img style='width:16px' src='" + chrome.runtime.getURL("delete.png") + "'";
		row += "</button>";
		row += "</div>";
		$("#highlightsTable").append(row);	
		save_soundboard();	
	});

	$("#highmonToggle").click(function () {
		if (highmonVisible) {
			$("#slider").hide();
			$("#highmonBody").hide();
			$("#highmonToggle").attr('src', uppic);
		} else {
			$("#slider").show();
			$("#highmonBody").show();
			$("#highmonToggle").attr('src', downpic);
		}
		highmonVisible = !highmonVisible;
	});

	$("#mattersMostToken").change(function () {
		window.localStorage.setItem('mattersMostToken', $("#mattersMostToken").val());
	});

	$("#pagerDutyKey").change(function () {
		window.localStorage.setItem('pagerDutyKey', $("#pagerDutyKey").val());
	});

	$("#clearAlerts").click(function () {
		highlights = [];
		$("#highmon_history > tbody").html("");
		window.localStorage.setItem('highlights', JSON.stringify(highlights));
	});

	// pagerduty
	if (window.localStorage.getItem('cb_pagerduty') != null) {
		if (window.localStorage.getItem('cb_pagerduty') == "true") {
			$("#cb_pagerduty").attr("checked", "checked");
		}
	}
	$('#cb_pagerduty').change(function () {
		window.localStorage.setItem('cb_pagerduty', $(this).is(":checked"));
	});

	// sounds
	if (window.localStorage.getItem('cb_sounds') != null) {
		if (window.localStorage.getItem('cb_sounds') == "true") {
			$("#cb_sounds").attr("checked", "checked");
		}
	}
	$('#cb_sounds').change(function () {
		window.localStorage.setItem('cb_sounds', $(this).is(":checked"));
	});

	// xdg open
	if (window.localStorage.getItem('cb_xdgopen') != null) {
		if (window.localStorage.getItem('cb_xdgopen') == "true") {
			$("#cb_xdgopen").attr("checked", "checked");
		}
	}
	$('#cb_xdgopen').change(function () {
		window.localStorage.setItem('cb_xdgopen', $(this).is(":checked"));
	});


	// busness hours
	var hour_min = 9;
	var hour_max = 17;
	if (window.localStorage.getItem('hour_min') != null) {
		hour_min = window.localStorage.getItem('hour_min');
	} else {
		window.localStorage.setItem('hour_min', hour_min);
	}
	if (window.localStorage.getItem('hour_max') != null) {
		hour_max = window.localStorage.getItem('hour_max');
	} else {
		window.localStorage.setItem('hour_max', hour_max);
	}

	$("#hours").html(hour_min + " - " + hour_max);
	
	$("#business-hours-range").slider({
		range: true,
		min: 0,
		max: 23,
		values: [ hour_min, hour_max ],
		slide: function( event, ui ) {
			window.localStorage.setItem('hour_min', ui.values[0]);
			window.localStorage.setItem('hour_max', ui.values[1]);
			$("#hours").html(ui.values[0] + " - " + ui.values[1]);
		}
	});

	$("#highMonSettings").toggle();

	$("#settingsButton").click(function () {
		$("#highMonSettings").toggle();
	});

	if (window.localStorage.getItem('mattersMostToken') != null) {
		$("#mattersMostToken").val(window.localStorage.getItem('mattersMostToken'));
	}

	if (window.localStorage.getItem('pagerDutyKey') != null) {
		$("#pagerDutyKey").val(window.localStorage.getItem('pagerDutyKey'));
	}

	var table = "<table id='highmon_history' style='margin-top:10px; width: 100%;'>";
	table += "<thead>";
	table += "<tr>";
	table += "<th style='padding-left: 10px; margin-right: 20px; font-size: 10pt; width: 70px; white-space: nowrap;'>Time</th>";
	table += "<th style='padding-left: 20px; margin-right: 20px; font-size: 10pt; white-space: nowrap;'>Channel</th>";
	table += "<th style='padding-left: 20px; font-size: 10pt; width: 100%; text-alight: left'>Message</th>";
	table += "</tr>";
	table += "</thead>";
	table += "<tbody>";
	table += "</tbody>";
	table += "</table>";

	var sheight = window.localStorage.getItem('highmonHeight');
	debug(sheight);
	sheight = sheight == null ? 400 : parseInt(sheight);

	$("#highmonBody").html("");
	$("#highmonBody").append(table);
	$("#slider").slider({
		orientation: "horizontal",
		range: "min",
		min: 150,
		max: 1000,
		value: sheight,
		change: refreshSwatch
	});

	$("#highmonBody").css('height', sheight);

	if (highlights.length > 0) {
		for (var x = 0; x < highlights.length; x++) {
			addHighlight(highlights[x], true);
		}
	}

	listenToSocketHighlights();

	debug("high monitor");
}

function addHighLightMonitor() {
	if ($("#highmonHeader").length) {
		prepareHighLightMonitor();
	}
	else {
		$("#app-content").prepend("<div id='highmonBody' style='padding: 10px 10px 10px 15px; overflow-y: scroll; overflow-x: hidden;'/>");
		$("#app-content").prepend("<div id='highmonHeader' style='border-bottom: 1px solid #454545; padding: 10px 10px 10px 15px;'/>");
		prepareHighLightMonitor();
	}
}

function compactMenu() {
	$(".sidebar-item").each(function() {
		$( this ).css("padding-left", "10px");
		$( this ).css("padding-top", "2px");
		$( this ).css("padding-bottom", "2px");
	});

	$(".nav-stacked li").each(function() {
		$( this ).css("padding-left", "10px");
		$( this ).css("padding-top", "0px");
		$( this ).css("padding-bottom", "0px");
	});	

	$(".nav-stacked li a").each(function() {
		$( this ).css("padding-left", "10px");
		$( this ).css("padding-top", "2px");
		$( this ).css("padding-bottom", "2px");
	});	

	$(".nav-stacked span").each(function() {
		$( this ).css("padding", "0px");
		$( this ).css("line-height", "12px");
	});
	
	$(".nav-stacked span").each(function() {
		$( this ).css("padding", "0px");
		$( this ).css("line-height", "12px");
	});
	
	$( ".icon icon__globe svg" ).each(function() {
		$( this ).width(9);
		$( this ).height(9);
	});

	$( "span.status > svg" ).each(function() {
		$( this ).width(9);
		$( this ).height(9);
	});
	
	$( ".sidebar-item__name span" ).each(function() {
		$( this ).css("font-size", "12px");
	});

	$( "span.sidebar-item__name > span" ).each(function() {
		debug($(this).html());
		$( this ).css("font-size", "12px");
		$( this ).css("line-height", "12px");
	});

	$(".sidebar-section__header").css("margin-top", "0px");

	$(".btn-close").css("height", "14px");
	$(".btn-close").css("width", "14px");
	$(".btn-close").css("font-size", "14pt");
}


var waitForEl = function (selector, callback) {
	if (jQuery(selector).length) {
		callback();
	} else {
		setTimeout(function () {
			waitForEl(selector, callback);
		}, 100);
	}
};


$(document).ready(function () {
	var m = $("meta[name=application-name]");
	var applicationname = m.attr("content");
	if(applicationname == "Mattermost") {
		try {
			highlights = JSON.parse(window.localStorage.getItem('highlights'));
			if (highlights == null) {
				highlights = [];
			}
		}
		catch (err) {
			highlights = [];
		}

		waitForEl("#app-content", function () {
			addHighLightMonitor();
			compactMenu();
			setInterval(function(){ compactMenu(); }, 10000);

			$('.sidebar-right-container').bind('DOMSubtreeModified', function(){
				if($('.sidebar-right-container').html().length == 0){
					$("#highmonBody").css("width", "100%");
					$("#channel-header").css("width", "100%");
				}
				else {
					$("#highmonBody").css("width", $(".post-list__dynamic").width());
					$("#channel-header").css("width", $(".post-list__dynamic").width());
				}
				console.log('changed');
				console.log($('.sidebar-right-container').html().length);
				console.log($(".post-list__dynamic").width());
			});
		});
	}
});
