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

function search(searchInfo) {


    //Walk the document node by node, accept only text
    let treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                return NodeFilter.FILTER_ACCEPT;
            }
        }, false);

    //This is gross

    if (searchInfo.regexUsed) {
        regex = new RegExp(searchInfo.term);
        while (treeWalker.nextNode()) {
            n = treeWalker.currentNode;
            if (n.wholeText.search(regex) != -1) return true;
        }

    } else {
        while (treeWalker.nextNode()) {
            n = treeWalker.currentNode;
            if (n.wholeText.indexOf(searchInfo.term) != -1) return true;
        }
    }
    return false;
}

(function () {
    browser.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            if (request.msg == "searchinfo") {
                sendResponse({ msg: "searchresult", result: search(request.searchInfo) });
            }
        });
})();
