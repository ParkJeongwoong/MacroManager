// Functions;
const sendMessageToBackground = (type, payload) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type,
        payload,
      },
      response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
};

const checkSystem = async () => {
  console.log(
    "[ContentScript 수신] <= Popup. chrome.tabs.sendMessage: " +
      request.payload.message
  );

  const response = await sendMessageToBackground("greeting", {
    message: "[ContentScript 발신] => Background. 응답은 sendResponse",
  });
  console.log(
    "[ContentScript 발신] <= Background. message received by sendResponse: " +
      response.message
  );
};

const sendRecordStart = async () => {
  const url = window.location.href;
  console.log(url);
  const response = await sendMessageToBackground("recordStart", { url });
  console.log("Save Record Response : " + response.message);
  console.log(response);
};

const sendRecordLoad = async () => {
  console.log("Load Record");
  const response = await sendMessageToBackground("recordLoad", {});
  console.log("Load Record Response : " + response.data.startUrl);
  console.log(response.data.clicks);
};

const sendRecordStop = async () => {
  const response = await sendMessageToBackground("recordStop", {});
  console.log("Stop Record Response : " + response.message);
};

// getSelector : To get unique component selector from DOM
const getSelector = el => {
  if (!(el instanceof Element)) return;
  var path = [];
  while (el.nodeType === Node.ELEMENT_NODE) {
    var selector = el.nodeName.toLowerCase();
    if (el.id) {
      selector += "#" + el.id;
      path.unshift(selector);
      break;
    } else {
      var sib = el,
        nth = 1;
      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName.toLowerCase() == selector) nth++;
      }
      if (nth != 1) selector += ":nth-of-type(" + nth + ")";
    }
    path.unshift(selector);
    el = el.parentNode;
  }
  return path.join(" > ");
};

const handleClick = e => {
  const { clientX, clientY } = e;
  console.log(clientX, clientY);
  console.log(e.target);
  const selector = getSelector(e.target);
  console.log(selector);
  sendMessageToBackground("click", {
    selector,
    clientX,
    clientY,
    url: window.location.href,
  });
};

// Events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    // from Popup
    case "greeting":
      checkSystem();
      break;

    case "recordStart":
      sendRecordStart();
      break;

    case "recordLoad":
      sendRecordLoad();
      break;

    case "recordStop":
      sendRecordStop();
      break;

    // from Background
    case "redirect":
      sendResponse({ message: "redirected" });
      window.location.href = request.payload.url;
      break;

    case "reClick":
      console.log("reClick!!");
      const selector = request.payload.selector;
      const element = document.querySelector(selector);
      element.click();
      break;
  }

  return true;
});

document.addEventListener("click", handleClick);
