# Auto Tab Searcher - WebExtension 
Periodically reloads and searches a tab for text. Sounds an alarm and sends a notification when the text has been found.

#### Download the add-on for Firefox:
https://addons.mozilla.org/en-us/firefox/addon/auto-tab-searcher/

Master branch is the last submitted to Mozilla and found on mozilla.org.

#### Technical details

- The popup the user interacts with is called "config", under `popup/`. It has an HTML and CSS file as you'd expect, defining the styles.
- `config.js` defines interactions with buttons on the config popup, and fires every time it is clicked to grab all current browser window tabs
- `config.js` requests the background script, `scripts/background.js`, to monitor the tab requested
- `config.js` also requests it to be removed, and handles all front-end mechanics for refreshing and updating the popup lists
- `background.js` is persistent as long as the addon is enabled, hence why it must be used to track timers and refresh/search tabs
- `background.js` receives messages to monitor tabs, stop monitoring them, and manages the timers with listeners
- `background.js` injects the content script `scripts/content-script.js` into the monitored tab when it is refreshed, and sounds the alarm/notification should results come
- `content-script.js` is responsible for searching for the string term/regex in the tab it is injected to. It must be done this way, because `background.js` cannot interact with the document in any tabs. It passes back its results to `background.js`.
