const styles = `
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Arial', 'Inter', sans-serif;
}

/* Chat Bubble (Floating button) */
.chat-bubble {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 70px;
    height: 70px;
    background: #ffffffff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 1000;
}

.chat-bubble:hover {
    transform: scale(1.3);
}

.chat-bubble-icon {
    font-size: 28px;
    /* Added to make the image fit perfectly inside the circle */
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.chat-bubble-icon img {
    width: 65px;
    height: 65px;
    border-radius: 50%; /* Make image round */
}


/* nền đoạn chat sau padding */
.chat-window {
    position: fixed;
    bottom: 100px; /* Increased bottom to not overlap bubble */
    right: 20px;
    width: 400px;
    height: 60%;
    background: #f4f7f9;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
    display: none;
    flex-direction: column;
    z-index: 1000;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.chat-window.active {
    display: flex;
    opacity: 1;
    transform: translateY(0);
    // margin-top: 10px;
    padding-top: 27px;
    margin-bottom: 10px;
}

/* Header */
.chat-header {
    padding: 16px;
    background: #9e9e9eff;
    color: white;
    font-size: 10px;
    font-weight: 200;
    display: flex;
    height: 60px;
    justify-content: space-between;
    align-items: center;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}



.close-button:hover {
    color: #3e8ef7 !important; 
}

/* Chat Messages Section */
.chat-messages {
    flex-grow: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: #f4f7f9; /* Lighter background for better readability */
}

.message {
    padding: 12px 18px;
    border-radius: 20px;
    max-width: 80%;
    word-wrap: break-word;
    font-size: 16px;
    line-height: 1.4;
}

.message.sent {
    background: #007bff; /* Standard blue for sent messages */
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
}

.message.received {
    background: #e9e9eb; /* Standard grey for received messages */
    color: #333;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
}


.chat-input {
    display: flex;
    align-items: center; 
    padding: 4px; 
    gap: 8px;
    background-color: #ffffff; ;
    border: 1px solid #e0e0e0; 
    border-radius: 20px;  
    transition: border-color 0.3s ease; 
    margin-right: 16px; 
    margin-left: 16px; 
    margin-bottom: 10px;
}

.chat-input:focus-within {
    border-color: #3e8ef7; /* Viền xanh khi focus */
}

.message-input {
    flex-grow: 1;
    padding: 8px 10px; 
    border: none;      
    outline: none;     
    background: transparent; 
    font-size: 16px;
    color: #333;
}
// .chat-input {
//     display: flex;
//     padding: 16px;
//     gap: 12px;
//     background: #ffffffff;
//     border-top: 1px solid #e0e0e0;
// }

// .message-input {
//     flex-grow: 1;
//     padding: 12px 18px;
//     border: 1px solid #e0e0e0;
//     border-radius: 30px;
//     outline: none;
//     font-size: 16px;
//     transition: border-color 0.3s ease;
// }

.message-input:focus {
    border-color: #3e8ef7;
}

.send-button {
    background: transparent; /* Transparent background */
    color: white;
    border: none;
    border-radius: 50%; /* Make send button circular */
    width: 48px;
    height: 48px;
    cursor: pointer;
    transition: background 0.3s ease;
    font-size: 24px;
    display: flex; /* Center the icon */
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.send-button:hover {
    // background: #bfbfbfff;
    scale: 1.1; /* Slightly enlarge on hover */
    animation: pulse 0.5s infinite;
}

// .send-button:active {
//     background: #2566a0;
// }

.typing-indicator {
    padding: 10px;
    display: flex;
    align-items: center;
}

.typing-dots {
    display: flex;
    align-self: flex-start;
}

.typing-dots span {
    height: 8px;
    width: 8px;
    margin: 0 4px;
    background-color: #3e8ef7;
    display: block;
    border-radius: 50%;
    opacity: 0.4;
    animation: typing 1s infinite ease-in-out;
    align-self: flex-start;
}

.typing-dots span:nth-child(1) {
    animation-delay: 0.1s;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.3s;
}

.highlighted-link {
    text-decoration: underline;
    color: rgb(255, 255, 255);
}

.copy-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: #444;
    color: #e6e6e6;
    border: none;
    border-radius: 3px;
    padding: 2px 5px;
    font-size: 12px;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
}

pre:hover .copy-btn {
    opacity: 1;
}

.copy-btn:hover {
    background-color: #555;
}

pre {
    background-color: #2d2d2d;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 15px;
    padding-top: 30px; /* Space for the copy button */
    overflow-x: auto;
    position: relative;
    color: #f8f8f2;
}

code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
}

p code {
    background-color: #e0e0e0;
    color: #333;
    padding: 2px 4px;
    border-radius: 3px;
}

@media (max-width: 767px) {
    .chat-window {
        width: 100%;
        height: 100%;
        border-radius: 0;
        bottom: 0;
        right: 0;
    }

    .chat-messages {
        flex-grow: 1; /* Allow messages to take full available height */
        max-height: none;
    }
}

@keyframes typing {
    0% {
        transform: translateY(0px);
        background-color: #888;
    }
    28% {
        transform: translateY(-7px);
        background-color: #aaa;
    }
    44% {
        transform: translateY(0px);
        background-color: #888;
    }
}
.bubble-icon-wrapper {
    width: 40px;
    height: 40px;
    background-color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    /* margin-right: 10px; */
}

.bubble-icon-header img {
    margin-top: 3px;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    object-fit: cover;
}

.close-button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 18px;
    transition: color 0.3s ease;
    margin-bottom: 10px;
}

.suggess.messages {
    cursor: pointer;
    padding: 12px 18px;
    border-radius: 10px;
    max-width: 100%;
    word-wrap: break-word;
    font-size: 16px;
    line-height: 1.4;
    background: #cce7ff; /* Light blue background for suggestion */
    color: #007bff; /* Blue text */
    margin: 0 16px 10px 16px; /* Match input margins */
    // border-bottom-right-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Slight shadow for prominence */
    transition: background 0.3s ease;
    text-align: center; /* Align text to the right */
}

.suggess.messages:hover {
    background: #b3d9ff; /* Darker on hover */
}
`;


// Get configuration from window object or use defaults
const config = window.DeepTutorConfig || {
    // apiUrl: "http://localhost:8000/api/v1/chat-bubble/chat",
    // apiUrl: "https://ral-wms-logistic.rangdong.com.vn:9004/api/v1/workspace/nw/chatRequest",
    apiUrl: "http://localhost:9030/api/v1/workspace/nw/chat",

    logoUrl: "http://localhost:8000/static/chat-bubble/IconRangDong.png",
    styleUrl: "http://localhost:8000/static/chat-bubble/style.css"
};

const apiUrl = config.apiUrl;
const logoUrl = config.logoUrl;


const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);


const chatBubble = document.createElement("div");
chatBubble.className = "chat-bubble";
chatBubble.innerHTML = `<span class="chat-bubble-icon"><img src="${logoUrl}" alt="Chat Icon"></span>`;
document.body.appendChild(chatBubble);

const link = document.createElement("link");
link.rel = "stylesheet";
link.href = config.styleUrl;
document.head.appendChild(link);


const chatWindow = document.createElement("div");
chatWindow.className = "chat-window";
chatWindow.innerHTML = `
  <div class="chat-header" style="padding: 5px;">
    <div class="bubble-icon-wrapper">
        <span class="bubble-icon-header" ><img src="${logoUrl}"></span>
    </div>
    <button class="close-button">
     <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="white" viewBox="0 0 24 24">
  <path d="M6 18h12v2H6z"/>
</svg>

</button>
  </div>
  
  <div class="chat-messages">
  </div>
  <div class="suggess messages">Tóm tắt nội dung trang</div>
  <div class="chat-input">
    <input type="text" class="message-input" placeholder="Nhập tin nhắn...">
    <button class="send-button" style="margin-right: 5px;">
    <svg xmlns:xlink="http://www.w3.org/1999/xlink" width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.91158 12H7.45579H4L2.02268 4.13539C2.0111 4.0893 2.00193 4.04246 2.00046 3.99497C1.97811 3.27397 2.77209 2.77366 3.46029 3.10388L22 12L3.46029 20.8961C2.77983 21.2226 1.99597 20.7372 2.00002 20.0293C2.00038 19.9658 2.01455 19.9032 2.03296 19.8425L3.5 15" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style=""/>
</svg>
    </button>
  </div>
`;

document.body.appendChild(chatWindow);

// Get references to elements
const closeButton = chatWindow.querySelector(".close-button");
const messagesContainer = chatWindow.querySelector(".chat-messages");
const messageInput = chatWindow.querySelector(".message-input");
const sendButton = chatWindow.querySelector(".send-button");
const suggestionDiv = chatWindow.querySelector(".suggess.messages");

// Chat state
let isOpen = false;

addMessage("Xin chào!! Tôi có thể giúp gì cho bạn?", false);

function toggleChat(open) {
  isOpen = open;
  chatWindow.classList.toggle("active", isOpen);

  if (isOpen) {
    chatBubble.style.display = "none";

    chatWindow.style.bottom = '20px';
    messageInput?.focus();
  } else {
    chatBubble.style.display = "flex";

    chatWindow.style.bottom = '100px';
  }
}

// function closeChat() {
//     isOpen = false;
//     chatWindow.classList.remove("active");
// }

function addMessage(text, isSent = true) {
  const message = document.createElement("div");
  message.className = `message ${isSent ? "sent" : "received"}`;

  if (isSent) {
    message.textContent = text;
  } else {
    // Bot messages will be handled by updateBotMessage
    message.innerHTML = `<p>${text}</p>`;
  }
  messagesContainer.appendChild(message);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateBotMessage(text) {
  hideTypingIndicator();
  let botMessage = messagesContainer.querySelector(".message.received:last-child p");

  // If the last message isn't from the bot, or doesn't have a <p>, create a new message
  if (!botMessage || messagesContainer.lastElementChild.classList.contains('sent')) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message received';
    messageDiv.innerHTML = '<p></p>';
    messagesContainer.appendChild(messageDiv);
    botMessage = messageDiv.querySelector('p');
  }

  const processedText = processSpecialFormats(text);
  botMessage.innerHTML = processedText;
  addCopyButtons(botMessage.parentElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
  hideTypingIndicator();
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "message received typing-indicator"; // Use 'received' for styling
  typingIndicator.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
  messagesContainer.appendChild(typingIndicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = messagesContainer.querySelector(".typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

async function handleSendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  
  addMessage(text, true);
  messageInput.value = "";
  showTypingIndicator();

  // url gọi api chat
  const url = "https://ral-wms-logistic.rangdong.com.vn:9004/api/v1/workspace/nw/chatRequest";
  // const url = "http://localhost:9030/api/v1/workspace/nw/chat";

  let actualMessage = '@agent ' + text;
  if (text === "Tóm tắt nội dung trang") {
    const currentUrl = getCurrentPath();
    actualMessage = `@agent Hãy tóm tắt nội dung chính của trang web tại địa chỉ: ${currentUrl}. Nếu trong trang có đường dẫn tới google drive hãy liệt kê lại.`;
  }

  const payload = {
    message: actualMessage,
    mode: "chat"
  };
  console.log("Sending message:", actualMessage);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
            "Content-Type": "application/json",
            // "Authorization": "Bearer 44MEZFA-SQHM1HY-K231HMZ-H9Y3ZKA",
            "Accept": "application/json"
          },
      body: JSON.stringify(payload)
    });
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    console.log("Request payload:", JSON.stringify(payload, null, 2));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received data:", data);

    if (data.error) {
      updateBotMessage("Error: " + data.error);
    } else if (data.textResponse) {
      updateBotMessage(data.textResponse);
    } else {
      updateBotMessage("Unexpected response format.");
    }

    hideTypingIndicator();
  } catch (error) {
    hideTypingIndicator();
    updateBotMessage("Không thể kết nối tới máy chủ.");
    console.error("Lỗi:", error);
  }
}


function processSpecialFormats(text) {
  // Escape HTML first to prevent injection from markdown-like syntax
  let safeText = escapeHtml(text);


  safeText = safeText
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      // Un-escape the code content before putting it in pre/code
      const unescapedCode = code.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
      return `<pre><code class="language-${lang || ''}">${unescapedCode.trim()}</code></pre>`;
    })
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="highlighted-link" target="_blank">$1</a>');

  // Add paragraphs for lines that aren't inside a block element already
  return safeText.split('\n').map(line => {
    if (line.trim() === '') return '';
    // Avoid wrapping block elements in <p>
    if (line.startsWith('<pre>') || line.startsWith('<strong>') || line.startsWith('<em>')) {
      return line;
    }
    return `<p>${line}</p>`;
  }).join('');
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCurrentPath() {
  return window.location.href;
}

function quickSummarizeCurrentPage(){
  messageInput.value = "Tóm tắt nội dung trang";
  handleSendMessage();
}

function addCopyButtons(container) {
  const codeBlocks = container.querySelectorAll('pre');
  codeBlocks.forEach((block) => {
    if (!block.querySelector('.copy-btn')) {
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy';
      copyBtn.className = 'copy-btn';
      copyBtn.addEventListener('click', () => {
        const code = block.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
          }, 2000);
        });
      });
      block.appendChild(copyBtn);
    }
  });
}

// Event listeners
// chatBubble.addEventListener("click", toggleChat);
// closeButton.addEventListener("click", closeChat);
sendButton.addEventListener("click", handleSendMessage);
chatBubble.addEventListener("click", () => toggleChat(true));

closeButton.addEventListener("click", () => toggleChat(false));

messageInput.addEventListener("input", () => {
  if (messageInput.value.trim() === "") {
    suggestionDiv.style.display = "block";
  } else {
    suggestionDiv.style.display = "none";
  }
});

suggestionDiv.addEventListener("click", () => {
  quickSummarizeCurrentPage();
  suggestionDiv.style.display = "none";
});

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // Prevent form submission if it's in a form
    handleSendMessage();
  }
});

// Close chat when clicking outside
document.addEventListener("click", (e) => {
  if (
    isOpen &&
    !chatWindow.contains(e.target) &&
    !chatBubble.contains(e.target)
  ) {
    toggleChat(false);
  }
});