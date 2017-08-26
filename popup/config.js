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

//List of all browser tabs
function genTabList() {
    let tabListbox = document.getElementById("selectTabList");

    //Clear the list
    while (tabListbox.firstChild) {
        tabListbox.removeChild(tabListbox.firstChild);
    }

    //Get all tabs in current window
    let querying = browser.tabs.query({ currentWindow: true });
    querying.then(
        (tabs) => {
            for (let i = 0; i < tabs.length; i++) {

                //Create a list item for the tab
                let newOption = document.createElement("option");
                newOption.value = tabs[i].id;
                newOption.textContent = tabs[i].title;
                tabListbox.appendChild(newOption);
            }
        });
}

//Request the monitored tabs from the background script and pass them to the render function
function genActiveTabList() {

    let sending = browser.runtime.sendMessage({ msg: "requestlist" });
    sending.then(
        (msg) => {
            renderActiveTabList(msg.tabs);
        },
        (err) => {
            console.log(err);
        }
    );
}

function renderActiveTabList(tabStack) {

    //Leave if there are no tabs monitored
    if (!tabStack) return;

    let domList = document.getElementById("tabsMonitored");

    //Clear out list display
    while (domList.firstChild) {
        domList.removeChild(domList.firstChild);
    }

    /* Create a list object and stop button for each returned
        tab being monitored */
    for (let i = 0; i < tabStack.length; i++) {

        let itemWrapper = document.createElement("div");
        itemWrapper.className = "activeTabWr";
        let titleItem = document.createElement("li");
        titleItem.textContent = tabStack[i].tabTitle;
        let infoItem = document.createElement("span");
        infoItem.textContent = "'" + tabStack[i].searchInfo.term + "' - " + tabStack[i].interval + " seconds";
        infoItem.className = "infoItem";

        let removeTabBtn = document.createElement("button");
        removeTabBtn.textContent = "Stop";
        //Handler for the stop button
        removeTabBtn.onclick = () => {
            removeTab(tabStack[i].tabId);
        }

        itemWrapper.appendChild(titleItem);
        itemWrapper.appendChild(infoItem);
        itemWrapper.appendChild(removeTabBtn);
        domList.appendChild(itemWrapper);
    }
}

//Reqest the tab selected in the popup now be added to the monitoring list
function addTab() {

    //Grab options from popup
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
        msg: "addtab",
        tabTitle: tabTitle,
        tabId: tabId,
        searchInfo: searchInfo,
        interval: interval
    });
    sending.then(
        (msg) => {
            genActiveTabList();
        },
        (err) => {
            console.log(err);
        }
    );
}

//Request the tab associated with this ID be removed from monitoring
function removeTab(tabId) {

    let sending = browser.runtime.sendMessage({ msg: "removetab", tabId: tabId });
    sending.then(
        (msg) => {
            genActiveTabList();
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
    genActiveTabList();
}

//Popup loaded, this happens everytime the button is clicked
window.onload = () => {

    refresh();

    //Submit pressed
    document.getElementById("subm").onclick = addTab;

    //Info button pressed
    document.getElementById("infoBtn").onclick = displayHelp;
};
