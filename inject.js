// this is the code which will be injected into a given page...

var eodlog = [];
var pastes = [];
var pagerDuty = [];
var salesforce = [];
var selected = [];
var customers = [];


function setup() {

	$("a[id=action-link]").click(function () {

		var title = $(this).closest('td').prev('td').text();
		var customer = $(this).closest('td').prev('td').prev('td').prev('td').text();

		var id = $(this).attr('class');
		var ticket_id = id.split('-');
		var sfid = ticket_id[2];

		console.log(title)
		console.log(customer)
		console.log(sfid)

		$("#submitForm" + sfid).click(function () {
			var id = $(this).attr('id');
			var ticket_id = id.split('m');
			var sfid = ticket_id[2];

			var comment_made = $("#comment_" + sfid).val();
			var status_made = $("#status_" + sfid).val();
			var severity_made = $("#severity_" + sfid).val();

			addToLog("Triaged " + sfid, sfid, [customer, title, comment_made, status_made, severity_made]);
		});

		addToLog("clicked " + sfid, sfid, [customer, title]);
	});

	$(".btn-primary").click(function () {

		var title = $(".page-header").find('a:first').text();
		var customer = $(".page-header").find('div:first').text();
		var idp = window.location.href.split('/');
		var sfid = idp[idp.length - 1];

		console.log(title)
		console.log(customer)
		console.log(sfid)

		addToLog("Action " + sfid, sfid, [customer, title]);
	});

	$(".ack-incidents").click(function () {

		$('.ember-checkbox:checkbox:checked').each(function () {
			var status = $(this).closest('td').next('td').text().trim();
			var urgency = $(this).closest('td').next('td').next('td').text().trim();
			var title = $(this).closest('td').next('td').next('td').next('td').text().trim();
			var create = $(this).closest('td').next('td').next('td').next('td').next('td').text().trim();

			addToPagerDuty("Marked Acknowledged", [status, urgency, title, create]);
		});
	});

	$(".resolve-incidents").click(function () {

		$('.ember-checkbox:checkbox:checked').each(function () {
			var status = $(this).closest('td').next('td').text().trim();
			var urgency = $(this).closest('td').next('td').next('td').text().trim();
			var title = $(this).closest('td').next('td').next('td').next('td').text().trim();
			var create = $(this).closest('td').next('td').next('td').next('td').next('td').text().trim();

			addToPagerDuty("Marked Resolved", [status, urgency, title, create]);
		});
	});

	$(".snooze-incidents").click(function () {

		$('.ember-checkbox:checkbox:checked').each(function () {
			var status = $(this).closest('td').next('td').text().trim();
			var urgency = $(this).closest('td').next('td').next('td').text().trim();
			var title = $(this).closest('td').next('td').next('td').next('td').text().trim();
			var create = $(this).closest('td').next('td').next('td').next('td').next('td').text().trim();
			addToPagerDuty("Marked Snoozed", [status, urgency, title, create]);
		});
	});
}

function addToLog(message, sfid, additional) {
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0');
	var yyyy = today.getFullYear();

	var timenow = new Date();
	var timestr = timenow.getHours() + ":" + timenow.getMinutes()

	today = dd + '/' + mm + '/' + yyyy;
	var todaylog = { 'date': today, 'time': timestr, 'action': message, 'sfid': sfid };

	if (additional != undefined) {
		todaylog.extra = additional;
	}

	eodlog.push(todaylog);

	saveLog();
}

function addToPagerDuty(message, additional) {
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0');
	var yyyy = today.getFullYear();

	var timenow = new Date();
	var timestr = timenow.getHours() + ":" + timenow.getMinutes()

	today = dd + '/' + mm + '/' + yyyy;
	var todaylog = { 'date': today, 'time': timestr, 'action': message };

	if (additional != undefined) {
		todaylog.extra = additional;
	}

	pagerDuty.push(todaylog);

	savePagerDuty();
}


function logPaste(from, url) {
	pastes.push([from, url]);
	savePastes();
}

function logSF(title, url) {
	salesforce.push([title, url]);
	saveSF();
}


function saveLog() {
	var myJSON = JSON.stringify(eodlog);

	console.log(myJSON);

	chrome.storage.local.set({ log: myJSON }, function () {
		console.log('Value is set to ' + myJSON);
		printLog();
	});
}

function savePastes() {
	var myJSON = JSON.stringify(pastes);

	chrome.storage.local.set({ pastes: myJSON }, function () {
		console.log('Value is set to ' + myJSON);
	});
}

function loadLog() {
	console.log("load log");
	chrome.storage.local.get(['log'], function (result) {
		console.log(result)
		if (result.hasOwnProperty("log")) {
			eodlog = JSON.parse(result.log);
			printLog();
		}
		else {
			console.log("log was empty");
		}

		if (window.location.href.indexOf("https://portal.admin.canonical.com/bootstack/cases") != -1) {
			var title = $(".page-header").find('a:first').text();
			var customer = $(".page-header").find('div:first').text();
			var idp = window.location.href.split('/');
			var sfid = idp[idp.length - 1];
			if(sfid!=""){
				addToLog("Reviewed " + sfid, sfid, [customer, title]);
			}			
		}
	});
}

function loadPagerDuty() {
	chrome.storage.local.get(['pagerDuty'], function (result) {
		pagerDuty = JSON.parse(result.pagerDuty);
		console.log('Value read from log as ' + pagerDuty);
	});
}

function savePagerDuty() {
	var myJSON = JSON.stringify(pagerDuty);

	chrome.storage.local.set({ pagerDuty: myJSON }, function () {
		console.log('Value is set to ' + myJSON);
	});
}

function saveSF() {
	var myJSON = JSON.stringify(salesforce);

	chrome.storage.local.set({ salesforce: myJSON }, function () {
		console.log('Value is set to ' + myJSON);
	});
}

function loadPastes(title, url) {
	chrome.storage.local.get(['pastes'], function (result) {
		if (typeof (result.pastes) === "undefined") {
			// do nothing
		}
		else {
			pastes = JSON.parse(result.pastes);
			console.log('Value read from log as ' + pastes);
		}

		if (title != undefined) {
			logPaste(title, url);
		}
	});
}

function loadSF(title, url) {
	chrome.storage.local.get(['salesforce'], function (result) {
		if (typeof (result.salesforce) === "undefined") {
			// do nothing
		}
		else {
			salesforce = JSON.parse(result.salesforce);
			console.log('Value read from log as ' + salesforce);
		}
		if (title != undefined) {
			logSF(title, url);
		}
	});
}

function printLog() {
	for (i = 0; i < eodlog.length; i++) {
		console.log(eodlog[i]);
	}
}

function mapCustomerNamesToTicketHeader() {
	$(".table-condensed > tbody  > tr").each(function() {
	     var ticketId = $(this).find("th").eq(0).text();
	     var customer = $(this).find("td").eq(0).text();
	     console.log(ticketId + " - " + customer);
             var newheader = $("#triageCase"+ticketId).find("h4").eq(0).html() + " - " + customer;
	     $("#triageCase"+ticketId).find("h4").eq(0).html(newheader);
	
	     if(customer.trim() == "Delta Dental") {
		$(this).hide();
             }
	});
}

function highlightWOO() {
	$("td.dataCell").each(function() {
		var text = $(this).text();
		 
		if(text.indexOf("Waiting on Operations") != -1) {
			$(this).closest('tr').css('background-color', '#ffaaa7')
		}

		//if(text.indexOf("Waiting on Customer") != -1) {
		//	$(this).closest('tr').css('background-color', '#fed8b1')
		//}

		if(text.indexOf("Resolved") != -1) {
			$(this).closest('tr').css('background-color', '#90ee90')
		}

		if(text.indexOf("Waiting on Support") != -1) {
			$(this).closest('tr').css('background-color', '#ffaaa7')
		}		
	     
	});
}

function toggleCustomer(t, cust) {

	if(selected.indexOf(cust) == -1) {
		selected.push(cust);
		$("#cust" + t).css(
			{
				"display": "inline-block", 
				"padding": "5px", 
				"margin":"5px", 
				"border": "2px solid red", 
				"background-color": "#88B04B"
			}
		);
	} else {
		selected.splice(selected.indexOf(cust),1);
		$("#cust" + t).css(
			{
				"display": "inline-block", 
				"padding": "5px", 
				"margin":"5px", 
				"border": "1px solid green", 
				"background-color": "#88B04B"
			}
		);
	}

	console.log(selected);

	$('table > tbody  > tr').each(function(i) {
		var my_td = $(this).children("td");
		var second_col = my_td.eq(0);

		if(selected.indexOf(second_col.text()) > -1 || selected.length == 0) {
			$(this).show();
		} else {
			$(this).hide();
		}
	});
}


function addCaseFilters() {	
	$('table > tbody  > tr').each(function(i) {
		var $this = $(this);
		var my_td = $this.children("td");
		var second_col = my_td.eq(0);
		//var third_col = my_td.eq(2);
		if(customers.indexOf(second_col.text()) == -1) {
			if(second_col.text().trim() == "") return;
			customers.push(second_col.text());
		}
	});

	customers.sort(); 

	$("<div class=\"customer-filter\"></div>").insertAfter($(".page-header"))

	for(var t=0; t < customers.length; t++) {
		$(".customer-filter").append("<div class='customerspan' id='cust" + t + "'><a id='custlink" + t + "' style='color:#FFFFFF'>" + customers[t] + "</a></div>");
		$("#custlink" + t).click(function(){
			toggleCustomer($(this).attr('id').substring(8), $(this).text());
		});
	}
	$(".customerspan").css(
		{
			"display": "inline-block", 
			"padding": "5px", 
			"margin":"5px", 
			"border": "1px solid green", 
			"background-color": "#88B04B"
		}
	);
}



(function () {

	if (window.location.href.indexOf("https://portal.admin.canonical.com/incident/event") != -1) {
		var ele = document.getElementById("review-approve-event").style.display;
		if (ele == "none") {
			console.log("already approved, end of queue or direct linked");
			return;
		}

		document.getElementById("review-approve-event").click();
		document.location.href = document.getElementById("next-review-event").getAttribute('href');
		console.log("clicked");
	}

	if (window.location.href.indexOf("https://portal.admin.canonical.com/bootstack/triage/") != -1) {
		loadLog();
		setup();
		mapCustomerNamesToTicketHeader();
	}

	if (window.location.href.indexOf("https://portal.admin.canonical.com/bootstack/cases") != -1) {
		loadLog();
		setup();
	}

	if (window.location.href.indexOf("https://pastebin.canonical.com/p/") != -1) {
		loadPastes($("h1:eq( 1 )").text(), window.location.href);
	}

	if (window.location.href.indexOf("https://canonical.pagerduty.com/incident") != -1) {
		loadPagerDuty();
		setup();
	}

	if (window.location.href.indexOf("https://canonical.my.salesforce.com/") != -1) {
		//setup();
		var parts = window.location.href.split('/');
		if (parts.length == 4) {
			loadSF($(".efhpTitle").text(), window.location.href);
		}
		highlightWOO()
	}

	if (window.location.href.indexOf("https://portal.admin.canonical.com/bootstack/cases/") != -1) {
		addCaseFilters();	
	}	
})();
