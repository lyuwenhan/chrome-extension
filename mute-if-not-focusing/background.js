let focusedTabId = null;
let timer = null;
async function setMuted(tabId, muted) {
	try {
		await chrome.tabs.update(tabId, {
			muted
		})
	} catch (error) {}
}

function scheduleApplyMutePolicy() {
	if (timer !== null) {
		clearTimeout(timer)
	}
	timer = setTimeout(async function() {
		timer = null;
		await applyMutePolicy()
	}, 50)
}
async function applyMutePolicy() {
	const tabs = await chrome.tabs.query({});
	for (const tab of tabs) {
		if (typeof tab.id !== "number") {
			continue
		}
		const shouldBeMuted = tab.id !== focusedTabId;
		await setMuted(tab.id, shouldBeMuted)
	}
}
chrome.runtime.onMessage.addListener(function(message, sender) {
	if (!sender.tab || typeof sender.tab.id !== "number") {
		return
	}
	if (!message || message.type !== "page-focus-state") {
		return
	}
	if (message.hasFocus && message.visibilityState === "visible") {
		focusedTabId = sender.tab.id
	} else {
		if (focusedTabId === sender.tab.id) {
			focusedTabId = null
		}
	}
	scheduleApplyMutePolicy()
});
chrome.runtime.onInstalled.addListener(function() {
	focusedTabId = null;
	scheduleApplyMutePolicy()
});
chrome.runtime.onStartup.addListener(function() {
	focusedTabId = null;
	scheduleApplyMutePolicy()
});
chrome.tabs.onActivated.addListener(function(activeInfo) {
	focusedTabId = activeInfo.tabId;
	scheduleApplyMutePolicy()
});
chrome.tabs.onRemoved.addListener(function(tabId) {
	if (focusedTabId === tabId) {
		focusedTabId = null
	}
	scheduleApplyMutePolicy()
});
chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	if (focusedTabId === removedTabId) {
		focusedTabId = addedTabId
	}
	scheduleApplyMutePolicy()
});
