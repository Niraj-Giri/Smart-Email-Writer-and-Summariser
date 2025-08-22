console.log("✅ Content script loaded");

// 🔍 Extract email content
function getEmailContent() {
  const selectors = [
    ".h7",
    ".a3s.aiL",
    ".gmail_quote",
    "[role='presentation']"
  ];

  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) {
      console.log(`✅ Extracted content using selector: ${selector}`);
      return content.innerText.trim();
    }
  }
  console.warn("⚠️ No email content found");
  return "";
}

// 🔍 Find Gmail toolbar
function findComposeToolbar() {
  const selectors = [
    ".btC",
    ".aDh",
    "[role='toolbar']",
    ".gU.Up"
  ];
  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) {
      console.log(`✅ Toolbar found with selector: ${selector}`);
      return toolbar;
    }
  }
  console.warn("⚠️ Compose toolbar not found yet");
  return null;
}

// 🧹 Clean API text (remove markdown **, *, extra spaces)
function cleanText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // remove **bold**
    .replace(/^\s*[\*\-]\s*/gm, "• ") // convert * or - bullets → "•"
    .replace(/\n{3,}/g, "\n\n") // collapse multiple blank lines
    .trim();
}

// ✨ Create Tone Selector
function createToneSelector() {
  const select = document.createElement("select");
  select.className = "ai-tone-selector";
  select.style.marginRight = "8px";
  select.style.padding = "4px";
  select.style.borderRadius = "6px";
  select.style.fontSize = "12px";

  const tones = ["professional", "casual", "friendly", "formal", "neutral"];
  tones.forEach(tone => {
    const option = document.createElement("option");
    option.value = tone;
    option.textContent = tone.charAt(0).toUpperCase() + tone.slice(1);
    select.appendChild(option);
  });

  return select;
}

// ✨ Create AI button
function createAIButton(label, mode, toneSelector) {
  const button = document.createElement("div");
  button.className = "T-I J-J5-Ji ao0 v7 T-I-atl L3 ai-button";
  button.style.marginRight = "8px";
  button.innerHTML = label;
  button.setAttribute("role", "button");
  button.setAttribute("data-tooltip", `AI ${label}`);

  button.addEventListener("click", async () => {
    try {
      console.log(`🚀 ${label} button clicked`);
      button.innerHTML = "Generating...";
      button.disabled = true;

      const emailContent = getEmailContent();
      console.log("📩 Extracted email content:", emailContent.substring(0, 200) + "...");

      const tone = toneSelector ? toneSelector.value : "neutral";
      const requestBody = {
        emailContent: emailContent || "⚠️ No content found",
        tone: tone,
        mode: mode
      };

      console.log("📤 Sending request body:", requestBody);

      const response = await fetch("http://localhost:8080/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      console.log("📡 API Response Status:", response.status);

      if (!response.ok) throw new Error(`API Request Failed: ${response.status}`);

      const data = await response.json();
      console.log("✅ Generated text from API:", data);

      let generatedText = data.result || "[No result returned]";
      generatedText = cleanText(generatedText); // 🧹 clean messy text
      console.log("✍️ Cleaned text to insert:", generatedText);

      const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
      if (composeBox) {
        composeBox.focus();

        // 🧹 Always clear previous content before inserting
        composeBox.innerHTML = "";

        document.execCommand("insertText", false, generatedText);
        console.log("📌 Inserted generated text into compose box");
      } else {
        console.error("❌ Compose box not found");
      }
    } catch (error) {
      console.error(`❌ Failed to generate ${mode}`, error);
      alert(`Failed to generate ${mode}`);
    } finally {
      button.innerHTML = label;
      button.disabled = false;
    }
  });

  return button;
}

// 🚀 Inject buttons + tone selector
function injectButtons() {
  const existingButtons = document.querySelectorAll(".ai-button, .ai-tone-selector");
  existingButtons.forEach(btn => btn.remove());

  const toolbar = findComposeToolbar();
  if (!toolbar) return;

  console.log("🎯 Injecting AI buttons into toolbar");

  // Create tone selector first
  const toneSelector = createToneSelector();

  // Create buttons
  const summarizeBtn = createAIButton("Summarize", "summarize", toneSelector);
  const replyBtn = createAIButton("Reply", "reply", toneSelector);

  // Insert into Gmail toolbar
  toolbar.insertBefore(replyBtn, toolbar.firstChild);
  toolbar.insertBefore(summarizeBtn, toolbar.firstChild);
  toolbar.insertBefore(toneSelector, toolbar.firstChild);
}

// 🔄 Watch Gmail compose window
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposeElements = addedNodes.some(node =>
      node.nodeType === Node.ELEMENT_NODE &&
      (node.matches(".aDh,.btC,[role='dialog']") ||
        node.querySelector?.(".aDh,.btC,[role='dialog']"))
    );

    if (hasComposeElements) {
      console.log("📬 Compose window detected");
      setTimeout(injectButtons, 1000);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
