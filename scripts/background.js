/*
	Copyright (C) 2016 izzymg
	This file is part of Auto Tab Searcher.
    Auto Tab Searcher is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    Auto Tab Searcher is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with Auto Tab Searcher.  If not, see <http://www.gnu.org/licenses/>.
*/

const NOTIFY_ID = "alarm";
var tabStack = [];
var alarmAudio;


function addTab(tabId, tabTitle, searchInfo, interval) {

    //Check for a duplicate ID in tabStack
    for (let t of tabStack) {
        if (t.tabId === tabId) {
            return;
        }
    }

    //Reload on interval
    var timerId = window.setInterval(() => { reloadTab(tabId); }, interval * 1000);

    //Add the new active tab to the stack
    tabStack[tabStack.length] = {
        "tabId": tabId,
        "tabTitle": tabTitle,
        "interval": interval,
        "searchInfo": searchInfo,
        "timerId": timerId
    };

}

function reloadTab(tabId) {

    browser.tabs.reload(tabId).then(
        null,
        //Usually procs due to tab being closed
        (err) => {
            removeTab(tabId);
        }
    );
}

function removeTab(tabId) {
    for (let stack of tabStack) {
        if (stack.tabId === tabId) {
            //Stop the timer id associated with the tab
            window.clearInterval(stack.timerId);
            //Remove it from the tabStack array
            tabStack.splice(i, 1);
        }
    }
}

function injectTabSearch(tabId, searchInfo) {
    //Inject script into tab
    var executing = browser.tabs.executeScript(tabId, {
        file: 'scripts/content-script.js'
    });

    window.setTimeout(
        () => {
            executing.then(
                () => {
                    requestSearch(tabId, searchInfo);
                },
                (err) => {
                    console.log(err);
                });
        }, 1000
    );
}

//Request the script search and post the result
function requestSearch(tabId, searchInfo) {

    browser.tabs.sendMessage(tabId, { msg: "searchinfo", searchInfo: searchInfo }).then(
        (response) => {
            //Found the term
            if (response.result == true) {
                notify(searchInfo);
                removeTab(tabId);
            }
        },
        (err) => {
            console.log(err);
        }
    );
}

function notify(searchInfo) {
    let notification = browser.notifications.create(NOTIFY_ID,
        {
            type: "basic",
            title: "Found search term!",
            message: "Found \"" + searchInfo.term + "\"  in a tab you are monitoring!"
        }
    );

    alarmAudio.play();

}

//Statup
(function () {

    alarmAudio = new Audio('rsc/av/alarm.wav');
    alarmAudio.loop = true;

    //Listen for requests made by the config menu
    browser.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {

            if (request.msg == "requestlist") {
                //Popup requesting the tab information
                sendResponse({ tabs: tabStack });
            } else if (request.msg == "addtab") {
                //Popup requesting to add a new tab
                addTab(request.tabId, request.tabTitle, request.searchInfo, request.interval);
            } else if (request.msg == "removetab") {
                //Popup requesting to remove a tab from monitoring
                removeTab(request.tabId);
            } else if (request.msg == "searchdone") {
                //Content script finished searching
                handleSearch(request.result);
            }
        }
    );

    //Listens on all tab updates
    browser.tabs.onUpdated.addListener(

        (tabId, cInfo, tInfo) => {
            //Ensure tab being updated has finished loading
            if (cInfo.status != "complete") return;

            for (let stack of tabStack) {
                //Match the ID to a monitored tab and inject the content script
                if (tabId == stack.tabId) {
                    injectTabSearch(tabId, stack.searchInfo);
                }
            }
        }
    );

    //Listen on a notification to be closed and stop the alarm
    browser.notifications.onClosed.addListener(

        (notificationId, byUser) => {
            if (notificationId == NOTIFY_ID) {
                alarmAudio.pause();
                alarmAudio.currentTime = 0.0;
            }
        }
    );
})();
