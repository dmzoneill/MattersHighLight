// this is the background code...

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status == 'complete') {
                chrome.tabs.insertCSS(tab.ib, {
                        file: 'jquery-ui.min.css'
                });
                chrome.tabs.executeScript(tab.ib, {
                        file: 'jq.js'
                });
                chrome.tabs.executeScript(tab.ib, {
                        file: 'jquery-ui.min.js'
                });
                chrome.tabs.executeScript(tab.ib, {
                        file: 'inject.js'
                });
        }
});

// listen for our browerAction to be clicked
chrome.browserAction.onClicked.addListener(function (tab) {
        // for the current tab, inject the "inject.js" file & execute it
        chrome.tabs.insertCSS(tab.ib, {
                file: 'jquery-ui.min.css'
        });
        chrome.tabs.executeScript(tab.ib, {
                file: 'jq.js'
        });
        chrome.tabs.executeScript(tab.ib, {
                file: 'jquery-ui.min.js'
        });
        chrome.tabs.executeScript(tab.ib, {
                file: 'inject.js'
        });
});
