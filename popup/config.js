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

//Fetches list of all tabs in the current window
function genTabList() {

    //Get all tabs in current window
    //Once query finishes, send to render on document
    let querying = browser.tabs.query({ currentWindow: true }).then(
        (tabs) => { renderTabList(tabs); }
    );
}

//Creates and adds list item elements of tabs passed in
function renderTabList(tabList) {

    let tabListbox = document.getElementById("selectTabList");

    //Clear the list
    while (tabListbox.firstChild) {
        tabListbox.removeChild(tabListbox.firstChild);
    }


    for (let i = 0; i < tabList.length; i++) {

        //Create a list item element for the tab
        let newOption = document.createElement("option");
        newOption.value = tabList[i].id;
        newOption.textContent = tabList[i].title;
        //Add the list item element to the tab list
        tabListbox.appendChild(newOption);
    }
}

//Request the currently monitored tabs from the background script and pass them to the render function
function genMonitoredTabList() {

    let sending = browser.runtime.sendMessage({ msg: "requestlist" }).then(
        (msg) => {
            renderMonitoredTabList(msg.tabs);
        },
        (err) => {
            console.log(err);
        }
    );
}

//Creates and adds list item elements of currently monitored tabs passed in
function renderMonitoredTabList(monitoredTabs) {

    if (!monitoredTabs) return;

    let monitoredTabsList = document.getElementById("monitoredTabsList");

    //Clear out list display
    while (monitoredTabsList.firstChild) {
        monitoredTabsList.removeChild(monitoredTabsList.firstChild);
    }

    /* Create a list object and stop button for each returned
        tab being monitored */
    for (let i = 0; i < monitoredTabs.length; i++) {

        let itemWrapper = document.createElement("div");
        itemWrapper.className = "activeTabWr";
        let titleItem = document.createElement("li");
        titleItem.textContent = monitoredTabs[i].tabTitle;
        let infoItem = document.createElement("span");
        infoItem.textContent = "'" + monitoredTabs[i].searchInfo.term + "' - " + monitoredTabs[i].interval + " seconds";
        infoItem.className = "infoItem";

        let removeTabBtn = document.createElement("button");
        removeTabBtn.textContent = "Stop";
        //Handler for the stop button
        removeTabBtn.onclick = () => {
            stopMonitoringTab(monitoredTabs[i].tabId);
        }

        itemWrapper.appendChild(titleItem);
        itemWrapper.appendChild(infoItem);
        itemWrapper.appendChild(removeTabBtn);
        //Add the list item element to the monitored tabs list
        monitoredTabsList.appendChild(itemWrapper);
    }
}

//Reqest the tab selected in the popup now be added to the monitoring list
function monitorTab() {

    //Grab selected option from popup
    let selectedTab = document.getElementById("selectTabList").selectedOptions[0];
    let tabId = parseInt(selectedTab.value);
    let tabTitle = selectedTab.textContent;
    let interval = document.getElementById("intervalIn").value;

    let searchInfo = {
        term: document.getElementById("searchTermIn").value,
        regexUsed: document.getElementById("regexUsedIn").checked
    }

    if (!interval || isNaN(interval) || interval < 3) return;

    //Send to the background script and ask for it to be monitored
    let sending = browser.runtime.sendMessage({
        msg: "monitortab",
        tabTitle: tabTitle,
        tabId: tabId,
        searchInfo: searchInfo,
        interval: interval
    }).then(
        (msg) => {
            genMonitoredTabList();
        },
        (err) => {
            console.log(err);
        }
        );
}

//Request the tab associated with this ID be removed from monitoring
function stopMonitoringTab(tabId) {

    //Background script will remove the tab off the monitored tabs array and stop its timer 
    let sending = browser.runtime.sendMessage({ msg: "stopmonitoringtab", tabId: tabId }).then(
        (msg) => {
            //Now that the tab is gone internally, we need to refresh and redisplay our front-end list
            genMonitoredTabList();
        },
        (err) => {
            console.log(err);
        }
    );
}

function displayHelp() {
    browser.tabs.create({ url: "/popup/help.html" });
}

function refresh() {
    genTabList();
    genMonitoredTabList();
}

//Popup loaded, this happens everytime the button is clicked
window.onload = () => {

    refresh();

    //Submit pressed
    document.getElementById("subm").onclick = monitorTab;

    //Info button pressed
    document.getElementById("infoBtn").onclick = displayHelp;
};
