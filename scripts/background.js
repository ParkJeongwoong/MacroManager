// Variables
let flag = false;
const logs = [];

// Functions;
const getCurrentTab = async () => {
  const queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

const sendMessageToTab = async (tab, type, payload, callback) => {
  return await chrome.tabs.sendMessage(tab.id, {
    type,
    payload,
  });
};

const recordStart = url => {
  chrome.storage.local.set({ startUrl: url });
};

const recordLoad = async callback => {
  const selectors = logs.map(log => log.selector);
  chrome.storage.local.get("startUrl", result => {
    callback(result.startUrl, selectors);
  });
};

const rewindLogs = async () => {
  const tab = await getCurrentTab();
  chrome.storage.local.get("startUrl", async result => {
    // redirect to startUrl
    await sendMessageToTab(tab, "redirect", {
      url: result.startUrl,
    });

    // rewind logs
    logs.forEach((log, index) => {
      // sleep 1s
      setTimeout(async () => {
        const response = await sendMessageToTab(tab, "reClick", {
          selector: log.selector,
        });
      }, 1000 * (index + 1));
    });
  });
};

const saveLog = payload => {
  logs.push(payload);
};

const clearLogs = () => {
  logs.splice(0, logs.length);
};

// Events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    // from Content Script
    case "greeting":
      console.log(
        "[Background 수신] <= ContentScript. message received: " +
          request.payload.message
      );
      const returnMessage = `[Background 발신] => ContentScript. 응답 메시지. 방식 sendResponse`;
      sendResponse({
        message: returnMessage,
      });
      break;

    case "recordStart":
      recordStart(request.payload.url);
      sendResponse({
        message: "[Background 발신] Save URL Response",
        data: {
          url: request.payload.url,
        },
      });
      clearLogs();
      flag = true;
      break;

    case "recordLoad":
      recordLoad((startUrl, clicks) =>
        sendResponse({
          message: "[Background 발신] Load URL Response",
          data: { startUrl, clicks },
        })
      );
      break;

    case "recordStop":
      flag = false;
      clearLogs();
      break;

    case "click":
      if (flag) {
        saveLog(request.payload);
      }
      break;

    case "rewind":
      flag = false;
      rewindLogs();
      break;
  }

  return true; // 비동기로 작업 시 필요
});
