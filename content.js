(() => {
  // Gemini API key (replace with your real key)
  const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // Replace this with your real API key

  // Show a loading overlay while processing
  function showLoadingOverlay() {
    if (document.getElementById("gemini-loading")) return;
    const overlay = document.createElement("div");
    overlay.id = "gemini-loading";
    overlay.style = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5); z-index: 999999;
      display: flex; justify-content: center; align-items: center;
      flex-direction: column; color: white; font-size: 16px;
    `;
    overlay.innerHTML = `
      <div style="margin-bottom: 10px;"> Checking screenshots...</div>
      <div style="border: 6px solid #f3f3f3; border-top: 6px solid #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
      <style>
        @keyframes spin { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
      </style>
    `;
    document.body.appendChild(overlay);
  }

  // Remove the loading overlay
  function hideLoadingOverlay() {
    const el = document.getElementById("gemini-loading");
    if (el) el.remove();
  }

  // Remove any existing warning notes from the page
  function removeExistingNotes() {
    const notes = document.querySelectorAll(".activity-warning-note");
    notes.forEach((note) => note.remove());
  }

  // Convert an image element to a base64-encoded JPEG string
  function getImageBase64(img) {
    return new Promise((resolve) => {
      const imgClone = new Image();
      imgClone.crossOrigin = "anonymous";
      imgClone.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = imgClone.naturalWidth;
        canvas.height = imgClone.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgClone, 0, 0);
        resolve(canvas.toDataURL("image/jpeg").split(",")[1]);
      };
      imgClone.src = img.src;
    });
  }

  // Ask Gemini API to compare two screenshots and return a summary
  async function askGeminiComparison(prevBase64, currentBase64) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: "Compare these two screenshots. Are they visually similar, identical, or show no significant change in work or activity?",
            },
            { inlineData: { mimeType: "image/jpeg", data: prevBase64 } },
            { inlineData: { mimeType: "image/jpeg", data: currentBase64 } },
          ],
        },
      ],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  }

  // Main function to scan screenshots and flag suspicious ones
  async function scanScreenshots(config) {
    // Find all screenshot containers
    const containers = document.querySelectorAll(
      ".screenshot-container, .activity-screenshot"
    );
    let flaggedCount = 0;
    let prevBase64 = null;

    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const img = container.querySelector("img");
      if (!img || !img.src) continue;

      //Check for notes
      if(config.notes) {
        const noteButton = container.querySelector('.inline-link.clickable.text-success');
        if(noteButton){
          continue;
        }
      }

      // Read activity from data-original-title
      const progressEl = container.querySelector(".progress");
      const tooltip = progressEl?.getAttribute("data-original-title") || "";
      const activityMatches = tooltip.match(/\d+%/g);
      let total = null,
        keyboard = null,
        mouse = null;

      // Parse activity percentages if available
      if (activityMatches?.length >= 3) {
        total = parseInt(activityMatches[0]);
        keyboard = parseInt(activityMatches[2]);
        mouse = parseInt(activityMatches[1]);

        // Flag if total activity is below threshold
        if (total < config.total) {
          container.style.border = "3px solid red";
          container.appendChild(
            makeNote(` Low total activity (<${config.total}%)`, "red")
          );
          flaggedCount++;
        }

        // Flag if keyboard is low and mouse is high
        if (keyboard < config.keyboard && mouse > config.mouse) {
          container.style.border = "3px solid purple";
          container.appendChild(
            makeNote(
              ` Keyboard <${config.keyboard}%, Mouse >${config.mouse}%`,
              "purple"
            )
          );
          flaggedCount++;
        }
      }

      // Optionally use Gemini API to compare with previous screenshot
      if (config.gemini) {
        const currentBase64 = await getImageBase64(img);
        if (prevBase64) {
          try {
            const reply = await askGeminiComparison(prevBase64, currentBase64);
            const lower = reply.toLowerCase();
            if (
              lower.includes("identical") ||
              lower.includes("very similar") ||
              lower.includes("no significant change")
            ) {
              container.style.border = "3px solid orange";
              container.appendChild(
                makeNote("⚠️ Gemini: visually similar", "orange")
              );
              flaggedCount++;
            }
          } catch (err) {
            console.warn(`Gemini error at image ${i + 1}:`, err);
          }
        }
        prevBase64 = currentBase64;
      }
    }

    alert(`Scan complete. ${flaggedCount} screenshot(s) flagged.`);
  }

  // Create a colored note element
  function makeNote(text, color) {
    const note = document.createElement("div");
    note.className = "activity-warning-note";
    note.style = `color: ${color}; font-weight: bold; font-size: 12px;`;
    note.textContent = text;
    return note;
  }

  // Entry point: load config and run scan
  chrome.storage?.sync?.get(
    ["useGemini", "totalThreshold", "keyboardThreshold", "mouseThreshold","ignorewithNotes"],
    async ({ useGemini, totalThreshold, keyboardThreshold, mouseThreshold,ignorewithNotes }) => {
      const config = {
        gemini: useGemini ?? true,
        total: parseInt(totalThreshold ?? 20),
        keyboard: parseInt(keyboardThreshold ?? 1),
        mouse: parseInt(mouseThreshold ?? 0),
        notes: ignorewithNotes ?? true,
      };

      removeExistingNotes();
      showLoadingOverlay();
      try {
        await scanScreenshots(config);
      } catch (e) {
        console.error("Scan failed:", e);
        alert("Error occurred during screenshot analysis.");
      } finally {
        hideLoadingOverlay();
      }
    }
  );
})();
