const pausedByExtension = new WeakSet;
const suspendedAudioContexts = new WeakSet;

function getMediaElementsFromRoot(root) {
	const results = [];
	if (!root || typeof root.querySelectorAll !== "function") {
		return results
	}
	const mediaElements = root.querySelectorAll("audio, video");
	for (const media of mediaElements) {
		results.push(media)
	}
	const allElements = root.querySelectorAll("*");
	for (const element of allElements) {
		if (element.shadowRoot) {
			const nested = getMediaElementsFromRoot(element.shadowRoot);
			for (const media of nested) {
				results.push(media)
			}
		}
	}
	return results
}

function getAllMediaElements() {
	return getMediaElementsFromRoot(document)
}

function pausePlayableMedia() {
	const mediaElements = getAllMediaElements();
	for (const media of mediaElements) {
		if (media.paused) {
			continue
		}
		pausedByExtension.add(media);
		media.pause()
	}
}
async function resumeMediaPausedByExtension() {
	const mediaElements = getAllMediaElements();
	for (const media of mediaElements) {
		if (!pausedByExtension.has(media)) {
			continue
		}
		pausedByExtension.delete(media);
		try {
			await media.play()
		} catch (error) {}
	}
}

function patchAudioContext() {
	const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
	if (!OriginalAudioContext) {
		return
	}

	function PatchedAudioContext(...args) {
		const context = new OriginalAudioContext(...args);
		if (!document.hasFocus() || document.visibilityState !== "visible") {
			try {
				context.suspend();
				suspendedAudioContexts.add(context)
			} catch (error) {}
		}
		return context
	}
	PatchedAudioContext.prototype = OriginalAudioContext.prototype;
	if (window.AudioContext) {
		window.AudioContext = PatchedAudioContext
	}
	if (window.webkitAudioContext) {
		window.webkitAudioContext = PatchedAudioContext
	}
}
async function suspendAudioContexts() {}
async function resumeAudioContexts() {}

function sendMessageSafe(message) {
	try {
		if (!chrome.runtime || !chrome.runtime.id) {
			return
		}
		chrome.runtime.sendMessage(message, function() {
			if (chrome.runtime.lastError) {
				return
			}
		})
	} catch (error) {}
}

function reportFocusState() {
	const hasRealFocus = document.hasFocus() && document.visibilityState === "visible";
	sendMessageSafe({
		type: "page-focus-state",
		hasFocus: document.hasFocus(),
		visibilityState: document.visibilityState
	});
	if (hasRealFocus) {
		resumeMediaPausedByExtension();
		resumeAudioContexts()
	} else {
		pausePlayableMedia();
		suspendAudioContexts()
	}
}
patchAudioContext();
window.addEventListener("focus", function() {
	reportFocusState()
}, true);
window.addEventListener("blur", function() {
	reportFocusState()
}, true);
document.addEventListener("visibilitychange", function() {
	reportFocusState()
}, true);
const observer = new MutationObserver(function() {
	if (!document.hasFocus() || document.visibilityState !== "visible") {
		pausePlayableMedia();
		suspendAudioContexts()
	}
});
observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});
reportFocusState();
setInterval(function() {
	reportFocusState()
}, 500);
