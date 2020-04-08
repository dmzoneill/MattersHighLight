
var eodlog = [];
var pastes = [];
var pagerDuty = [];
var salesforce = [];
var myday = [];

$(document).ready(function () {
    $("#clearButton").click(function () {
        chrome.storage.local.clear(function () {
            var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            }
        });
    });

    loadLog();
});

function loadLog() {

    var raw = "EOD\n\nA) General Overview\n\n";
    raw += "\tBackscroll\n\tEmail\n#myday#";

    $("#eodPre").text(raw);

    chrome.storage.local.get(['log'], function (result) {
        if (typeof (result.log) !== "undefined") {
            eodlog = JSON.parse(result.log);
            console.log('Value read from log as ' + eodlog);
            populateEod();
        }

        chrome.storage.local.get(['pastes'], function (result) {
            if (typeof (result.pastes) !== "undefined") {
                pastes = JSON.parse(result.pastes);
                populatePastes();
            }

            chrome.storage.local.get(['pagerDuty'], function (result) {
                if (typeof (result.pagerDuty) !== "undefined") {
                    pagerDuty = JSON.parse(result.pagerDuty);
                    populatePagerDuty();
                }

                chrome.storage.local.get(['salesforce'], function (result) {
                    if (typeof (result.salesforce) !== "undefined") {
                        salesforce = JSON.parse(result.salesforce);
                        populateSalesForce();

                        $.getJSON("https://portal.admin.canonical.com/ajax/myday_summary/", function (result) {
                            var finalData = result.json_output.replace(/\\/g, "");
                            var raw = "\n\nB) My Day\n\n";
                            var myJSON = JSON.parse(finalData);

                            raw += "\tSales Force Open Triage: " + myJSON.sf_open_triage + "\n";
                            raw += "\tSales Force private comments: " + myJSON.sf_private_comments + "\n";
                            raw += "\tSales Force public comments: " + myJSON.sf_public_comments + "\n";
                            raw += "\tSales Force incidents touched: " + myJSON.incident_events_touched + "\n";
                            raw += "\tSales Force incident time: " + myJSON.sf_case_time + "\n";
                            raw += "\tSales Force Other Time: " + myJSON.sf_other_time + "\n";

                            raw += "\tTasks touched: " + myJSON.tasks_touched + "\n";
                            raw += "\tIncidents touched: " + myJSON.incident_events_touched + "\n";
                            raw += "\tIncidents time: " + myJSON.incident_events_time + "\n";

                            var newtxt = $("#eodPre").text().replace("#myday#", raw);
                            $("#eodPre").text(newtxt);
                        });
                    }
                });
            });
        });
    });
}

function fold(s, n, useSpaces, a) {
    a = a || [];
    if (s.length <= n) {
        a.push(s);
        return a;
    }
    var line = s.substring(0, n);
    if (!useSpaces) { // insert newlines anywhere
        a.push(line);
        return fold(s.substring(n), n, useSpaces, a);
    }
    else { // attempt to insert newlines after whitespace
        var lastSpaceRgx = /\s(?!.*\s)/;
        var idx = line.search(lastSpaceRgx);
        var nextIdx = n;
        if (idx > 0) {
            line = line.substring(0, idx);
            nextIdx = idx;
        }
        a.push(line);
        return fold(s.substring(nextIdx), n, useSpaces, a);
    }
}

function foldRgx(s, n) {
    var rgx = new RegExp('.{0,' + n + '}', 'g');
    return s.match(rgx);
}

function populateEod() {

    var raw = "";
    raw += "\n\nC) Work Log\n\n";
    var lastmessage = ""

    var cnt = 1;
    var lastheadline = "";
    var squash = 0;

    for (i = 0; i < eodlog.length; i++) {

        var tempraw = ""
        var tempmessage = "";

        if (eodlog[i]['extra'].length > 2) {
            tempraw += "   [" + cnt + "] (Actioned) ";
        }
        else {
            tempraw += "   [" + cnt + "] (Reviewed) ";
        }

        var headline = eodlog[i]['extra'][0] + "   " + eodlog[i]['date'] + "   " + eodlog[i]['time'];
        tempraw += headline + "\n";
        tempraw += "        SF# " + eodlog[i]['sfid'] + "    " + eodlog[i]['extra'][1] + "\n\n";

        if (eodlog[i]['extra'].length > 2) {

            var cols = 80;
            var isSmart = true;
            var orig = eodlog[i]['extra'][2];
            var lines = fold(orig, cols, isSmart);
            lines = orig.split("\n")

            for (t = 0; t < lines.length; t++) {
                line = lines[t].replace(/(\r\n|\n|\r)/gm, "");
                tempmessage += "\t\t   " + line + "\n";
            }

            tempraw += "\t   status: " + eodlog[i]['extra'][3] + "\n\n";
            tempraw += "\t\tNote To Customer: \n\n";
            tempraw += tempmessage;
            tempraw += "\n\t\tNotes: \n\n";

        }
        else {
            if (lastheadline != headline) {
                if (squash > 0) {
                    //cnt++;
                    //raw += "   [" + cnt + "] (Squashed) " + headline + " \n\n";
                }
                raw += tempraw;
                squash = 0;
            }
            else {
                squash++;
            }
            lastheadline = headline;
            cnt++;
            continue;
        }

        if (squash > 0) {
            //cnt++;
            //raw += "   [" + cnt + "] (Squashed) " + headline + " \n\n";
        }

        if (tempmessage != lastmessage) {
            raw += tempraw;
        }

        lastmessage = tempmessage;
        lastheadline = headline;
        cnt++;
    }

    $("#eodPre").text($("#eodPre").text() + raw);
}


function populatePastes() {

    var lookup = [];

    var raw = "\n\nD) Relevant Pastes\n\n";

    var cnt = 1;

    for (i = 0; i < pastes.length; i++) {

        if (lookup.indexOf(pastes[i][1]) == -1) {
            raw += "    [" + cnt + "] " + pastes[i][0] + "\n";
            raw += "        " + pastes[i][1] + "\n";
            cnt++;
        }

        lookup.push(pastes[i][1]);
    }

    $("#eodPre").text($("#eodPre").text() + raw);
}

function populatePagerDuty() {

    var lookup = [];

    var raw = "\n\nE) Relevant Page Duty Alerts\n\n";

    for (i = 0; i < pagerDuty.length; i++) {
        // [status, urgency, title, create]
        var titlelines = pagerDuty[i]['extra'][2].split('\n');
        raw += "    [" + i + "] " + pagerDuty[i]['action'] + " " + pagerDuty[i]['time'] + "\n";
        raw += "\t" + titlelines[0] + " alerted [ " + pagerDuty[i]['extra'][1] + " ] @ " + pagerDuty[i]['extra'][3] + "\n\n";
    }

    $("#eodPre").text($("#eodPre").text() + raw);
}

function populateSalesForce() {

    var lookup = [];

    var raw = "\n\nF) Relevant Salesforce Links\n\n";

    var cnt = 1;
    for (i = 0; i < salesforce.length; i++) {
        var title = salesforce[i][0].trim();
        var parts = salesforce[i][1].split('/');
        if (lookup.indexOf(salesforce[i][1]) == -1) {
            if (title != "") {
                if (parts.length == 4) {
                    raw += "    [" + cnt + "] " + salesforce[i][0] + "\n\t" + salesforce[i][1] + "\n";
                    cnt++;
                }
            }
        }
        lookup.push(salesforce[i][1]);
    }

    $("#eodPre").text($("#eodPre").text() + raw);
}