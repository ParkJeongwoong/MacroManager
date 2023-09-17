// // IndexedDB
// window.indexedDB =
//   window.indexedDB ||
//   window.mozIndexedDB ||
//   window.webkitIndexedDB ||
//   window.msIndexedDB;
// window.IDBTransaction =
//   window.IDBTransaction ||
//   window.webkitIDBTransaction ||
//   window.msIDBTransaction;
// window.IDBKeyRange =
//   window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

// let db;
// const request_db = window.indexedDB.open("macroManager", 1);
// request_db.onerror = function (event) {
//   console.log("error: " + event.target.errorCode);
// };
// request_db.onsuccess = function (event) {
//   db = request_db.result;
//   console.log("success: " + db);
// };

// Variables
let flag = false;
const logs = [];
let startUrl = "";

// Functions;
const getCurrentTab = async () => {
  const queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

const sendMessageToTab = async (tab, type, payload) => {
  return await chrome.tabs.sendMessage(tab.id, {
    type,
    payload,
  });
};

const recordStart = url => {
  startUrl = url;
};

const rewindLogs = async () => {
  const tab = await getCurrentTab();
  // redirect to startUrl
  await sendMessageToTab(tab, "redirect", {
    url: startUrl,
  });

  // rewind logs
  let wait = 1;
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
    }, 1000 * wait);
    if (index < logs.length - 1) {
      if (logs[index + 1].type !== "input") {
        wait++;
      }
    }
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

    case "recordRead":
      sendResponse({
        message: "[Background 발신] Read URL Response",
        data: { startUrl, logs },
      });
      break;

    case "recordStop":
      flag = false;
      break;

    case "recordDelete":
      flag = false;
      clearLogs();
      break;

    case "log":
      if (flag) {
        saveLog(request.payload);
      }
      break;

    case "getFlag":
      sendResponse({
        message: "[Background 발신] Get Flag Response",
        data: { flag },
      });
      break;

    // from Popup
    case "rewind":
      flag = false;
      rewindLogs();
      break;

    case "recordSave":
      // save logs in indexedDB

      sendResponse({
        message: "[Background 발신] Save Logs Response",
      });
      break;

    case "recordLoad":
      logs = JSON.parse(window.localStorage.getItem("logs"));
      sendResponse({
        message: "[Background 발신] Load Logs Response",
        data: { logs },
      });
      break;
  }

  return true; // 비동기로 작업 시 필요
});
