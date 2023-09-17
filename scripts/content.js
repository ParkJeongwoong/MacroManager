// Variables
let flag = true;

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
  flag = true;
  const url = window.location.href;
  console.log(url);
  const response = await sendMessageToBackground("recordStart", { url });
  console.log("Save Record Response : " + response.message);
  console.log(response);
};

const sendRecordRead = async () => {
  console.log("Read Record");
  const response = await sendMessageToBackground("recordRead", {});
  console.log(response.data.logs);
};

const sendRecordStop = async () => {
  flag = false;
  const response = await sendMessageToBackground("recordStop", {});
  console.log("Stop Record Response : " + response.message);
};

const sendRecordDelete = async () => {
  flag = false;
  const response = await sendMessageToBackground("recordDelete", {});
  console.log("Delete Record Response : " + response.message);
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
  if (flag) {
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
  }
};

const onType = e => {
  if (flag) {
    if (e.key !== "Enter") {
      if (e.target.tagName === "INPUT") {
        return;
      }
    }
    console.log(e);
    const selector = getSelector(e.target);
    sendMessageToBackground("log", {
      type: "type",
      selector,
      key: e.key,
      url: window.location.href,
      value: e.target.value,
    });
  }
};

const onInput = e => {
  if (flag) {
    console.log(e);
    const selector = getSelector(e.target);
    sendMessageToBackground("log", {
      type: "input",
      selector,
      key: e.target.value,
      url: window.location.href,
      value: e.target.value,
    });
  }
};

const setFlag = async () => {
  const response = await sendMessageToBackground("getFlag", {});
  flag = response.data.flag;
  console.log("FLAG : " + flag);
};

const handleClick = log => {
  try {
    console.log("click BACK!!");
    const selector = log.selector;
    const element = document.querySelector(selector);
    if (!element) {
      return false;
    }
    element.value = log.value;
    element.click();
    return true;
  } catch (error) {
    console.log("오노우");
    console.log(error);
    return false;
  }
};

const handleType = log => {
  try {
    console.log("type : " + log.key);
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
  } catch (error) {
    console.log(error);
    return false;
  }
};

const handleInput = log => {
  try {
    console.log("input : " + log.key);
    const selector = log.selector;
    const element = document.querySelector(selector);
    if (!element) {
      return false;
    }
    element.value = log.value;
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    // from Popup
    case "recordStart":
      sendRecordStart();
      break;

    case "recordRead":
      sendRecordRead();
      break;

    case "recordStop":
      sendRecordStop();
      break;

    case "recordDelete":
      sendRecordDelete();
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
        case "input":
          if (!handleInput(request.payload.log)) {
            console.log("input pause");
            sendResponse({ pause: true });
          }
      }
      sendResponse({ pause: false });
      break;
  }

  return true;
});

document.addEventListener("click", onClick);
document.addEventListener("keydown", onType);
const inputs = document.querySelectorAll("input");
inputs.forEach(input => {
  input.addEventListener("input", onInput);
});
window.onload = () => {
  console.log("onload");
};
setFlag();
