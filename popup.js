// Get references to DOM elements
const toggle = document.getElementById("geminiToggle");
const totalInput = document.getElementById("totalThreshold");
const keyboardInput = document.getElementById("keyboardThreshold");
const mouseInput = document.getElementById("mouseThreshold");
const runBtn = document.getElementById("runBtn");

// Load saved settings from Chrome storage and update UI
chrome.storage.sync.get(
  ["useGemini", "totalThreshold", "keyboardThreshold", "mouseThreshold"],
  (res) => {
    toggle.checked = res.useGemini ?? true;
    totalInput.value = res.totalThreshold ?? 20;
    keyboardInput.value = res.keyboardThreshold ?? 1;
    mouseInput.value = res.mouseThreshold ?? 0;
  }
);

// Save changes to Gemini toggle
toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ useGemini: toggle.checked });
});

// Save changes to threshold inputs
[totalInput, keyboardInput, mouseInput].forEach((input, index) => {
  input.addEventListener("input", () => {
    const data = {
      totalThreshold: parseInt(totalInput.value),
      keyboardThreshold: parseInt(keyboardInput.value),
      mouseThreshold: parseInt(mouseInput.value),
    };
    chrome.storage.sync.set(data);
  });
});

// Run content script on current tab when button is clicked
runBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["content.js"]
    });
  });
});
