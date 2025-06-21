const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");


// API setup
const API_KEY = "AIzaSyD20VVgJQcQnjyZVhailig2BG3qYJCJ-lY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const userData = {
  message: null,
  file:{
    data: null,
    mime_type: null
  }
}

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");


  // add user message to chat history
  chatHistory.push( {
        role:"user",
        parts: [
          { text: userData.message },
          ...(userData.file?.data
            ? [{ inline_data: userData.file }]
            : [])
        ]
      });

  const requestOptions = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: chatHistory 
  })
}


  try {
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Extract and display bot's response
    const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*(.*?)\*\*/g, "$1").trim();
    messageElement.innerText = apiResponseText;
    chatHistory.push( {
        role:"model",
        parts: [
          { text: apiResponseText}]
      });



  } catch (error) {
    //handle error in API response
    console.log(error);
    messageElement.innerText = error.message;
    messageElement.style.color = "#ff0000";
  } finally{
    //reset user file data removing thinking indicator and scroll  to bottom
    userData.file = {};
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth"});
  }
};

// handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();

  userData.message = messageInput.value.trim();
  messageInput.value = "";
  fileUploadWrapper.classList.remove("file-uploaded");
  messageInput.dispatchEvent(new Event("input"));



//create and display usermessage
  const messageContent = `
  <div class="message-text"></div>
  ${
    userData.file.data
      ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`
      : ""
  }
`;


  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth"});

  // simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<svg class="bot-avatar" width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g fill="#212121" fill-rule="nonzero">
        <path d="M17.75,14C18.99,14 20,15.01 20,16.25V17.15C20,18.25 19.52,19.29 18.69,20C17.13,21.34 14.89,22 12,22C9.11,22 6.87,21.34 5.31,20C4.48,19.29 4,18.25 4,17.15V16.25C4,15.01 5.01,14 6.25,14H17.75ZM12,2C12.38,2 12.69,2.28 12.74,2.65L12.75,2.75V3.5H16.25C17.49,3.5 18.5,4.51 18.5,5.75V10.25C18.5,11.49 17.49,12.5 16.25,12.5H7.75C6.51,12.5 5.5,11.49 5.5,10.25V5.75C5.5,4.51 6.51,3.5 7.75,3.5H11.25V2.75C11.25,2.37 11.53,2.06 11.9,2.01L12,2Z"/>
      </g>
    </svg>
    <div class="message-text">
      <div class="thinking-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>`;

    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && userMessage && !e.shiftkey && window.innerWidth > 768) {
    handleOutgoingMessage(e);
  }
});

//Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`; // Use backticks, not quotes
  messageInput.style.height = `${messageInput.scrollHeight}px`; // Same here

  // Fix: missing '.' in selector, and conditional logic wrapped correctly
  document.querySelector(".chat-form").style.borderRadius = 
    messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});





//Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
      fileUploadWrapper.querySelector("img").src = e.target.result;
      fileUploadWrapper.classList.add("file-uploaded");
      const base64String = e.target.result.split(",")[1];

  //store file data in userdata 
    userData.file = {
    data: base64String,
    mime_type: file.type
    }
    fileInput.value = "";
  }
  reader.readAsDataURL(file);
})
//cancel the file upload
fileCancelButton.addEventListener("click",() => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");

});


//initialize emoji picker
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },

  onClickOutside: (e) => {
    if(e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emojo-picker");
    } else {
       document.body.classList.remove("show-emojo-picker");

    }
  }
});

document.querySelector(".chat-form").appendChild(picker);


sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click",() => fileInput.click( ));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle
("show-chatbot"));
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
