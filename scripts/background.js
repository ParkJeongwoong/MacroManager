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
  chrome.storage.local.get("startUrl", result => {
    callback(result.startUrl, logs);
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
        const response = await sendMessageToTab(tab, "logBack", {
          log,
        });
        // pause인 경우 1초에 한 번씩 다시 보내기
        if (!response || response.pause) {
          let fail = true;
          let num = 1;
          let interval = setInterval(async () => {
            const response = await sendMessageToTab(tab, "logBack", {
              log,
            });
            if (!response.pause) {
              fail = false;
              clearInterval(interval);
            } else if (num > 10) {
              clearInterval(interval);
            }
            num++;
          }, 1000);
          if (fail) {
            console.log("fail to rewind");
            return;
          }
        }
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
      recordLoad((startUrl, logs) => {
        sendResponse({
          message: "[Background 발신] Load URL Response",
          data: { startUrl, logs },
        });
      });
      break;

    case "recordStop":
      flag = false;
      clearLogs();
      break;

    case "log":
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
