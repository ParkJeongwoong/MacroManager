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
  console.log(response.data.logs);
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

const onClick = e => {
  console.log(e);
  const selector = getSelector(e.target);
  sendMessageToBackground("log", {
    type: "click",
    selector,
    clientX: e.clientX,
    clientY: e.clientY,
    url: window.location.href,
    value: e.target.value,
  });
};

const onType = e => {
  console.log(e);
  const { key } = e;
  const selector = getSelector(e.target);
  sendMessageToBackground("log", {
    type: "type",
    selector,
    key,
    url: window.location.href,
    value: e.target.value,
  });
};

const handleClick = log => {
  console.log("click BACK!!");
  const selector = log.selector;
  const element = document.querySelector(selector);
  if (!element) {
    return false;
  }
  element.value = log.value;
  element.click();
  return true;
};

const handleType = log => {
  console.log("type BACK!!");
  const selector = log.selector;
  const element = document.querySelector(selector);
  // Enter case
  if (log.key === "Enter") {
    element.value = log.value;
    if (!element) {
      return false;
    }
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
    });
    element.dispatchEvent(event);
  } else if (log.key === "Backspace") {
    element.value = log.value.slice(0, -1);
  } else {
    element.value += log.key;
  }
  return true;
};

// Events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    // from Popup
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

    case "logBack":
      // 주소 불일치 시 Redirect
      if (request.payload.log.url !== window.location.href) {
        console.log("redirect pause");
        sendResponse({ pause: true });
        window.location.href = request.payload.log.url;
      }
      switch (request.payload.log.type) {
        case "click":
          if (!handleClick(request.payload.log)) {
            console.log("click pause");
            sendResponse({ pause: true });
          }
          break;
        case "type":
          if (!handleType(request.payload.log)) {
            console.log("type pause");
            sendResponse({ pause: true });
          }
          break;
      }
      sendResponse({ pause: false });
      break;
  }

  return true;
});

document.addEventListener("click", onClick);
document.addEventListener("keydown", onType);
