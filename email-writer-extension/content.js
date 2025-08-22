console.log("Content script loaded ✅");

function getEmailContent() {
  const selectors = [
    '.h7',
    '.a3s.aiL',
    '.gmail_quote',
    '[role="presentation"]'
  ];

  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) {
      return content.innerText.trim();
    }
  }
  return '';
}

function findComposeToolbar() {
  const selectors = [
    '.btC',              // Gmail send toolbar
    '.aDh',              // Another Gmail compose toolbar
    '[role="toolbar"]',  // ARIA role
    '.gU.Up'             // Extra fallback
  ];
  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) return toolbar;
  }
  return null;
}

function createAIButton() {
  const button = document.createElement('div');
  button.className = 'T-I J-J5-Ji ao0 v7 T-I-atl L3 ai-reply-button';
  button.style.marginRight = '8px';
  button.innerHTML = 'AI Reply';
  button.setAttribute('role', 'button');
  button.setAttribute('data-tooltip', 'Generate AI Reply');
  return button;
}

function injectButton() {
  const existingButton = document.querySelector('.ai-reply-button');
  if (existingButton) existingButton.remove();

  const toolbar = findComposeToolbar();
  if (!toolbar) {
    console.log("Toolbar not found yet ⏳");
    return;
  }

  console.log("Toolbar found → injecting AI Reply button");
  const button = createAIButton();

  button.addEventListener('click', async () => {
    try {
      button.innerHTML = 'Generating...';
      button.disabled = true;

      const emailContent = getEmailContent();
      console.log("Extracted email content:", emailContent);

      const response = await fetch('http://localhost:8080/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent, tone: "professional" })
      });

      if (!response.ok) throw new Error('API Request Failed');

      const generatedReply = await response.text();
      const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

      if (composeBox) {
        composeBox.focus();
        document.execCommand('insertText', false, generatedReply);
      } else {
        console.error('Compose box not found ❌');
      }

    } catch (error) {
      console.error('Failed to generate reply ❌', error);
      alert('Failed to generate reply');
    } finally {
      button.innerHTML = 'AI Reply';
      button.disabled = false;
    }
  });

  // insert button at the beginning of the toolbar
  toolbar.insertBefore(button, toolbar.firstChild);
}

// 🔄 Keep watching DOM changes (for when Gmail opens a compose window)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposeElements = addedNodes.some(node =>
      node.nodeType === Node.ELEMENT_NODE &&
      (node.matches('.aDh,.btC,[role="dialog"]') ||
        node.querySelector?.('.aDh,.btC,[role="dialog"]'))
    );

    if (hasComposeElements) {
      console.log("Compose window detected 📨");
      setTimeout(injectButton, 1000); // wait a bit for toolbar to render
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
