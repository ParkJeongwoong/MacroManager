// Send to Content Script
// Start Record Button
document.getElementById("btnStartRecord").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: "recordStart",
      },
      response => {
        console.log(response);
      }
    );
  });
});

// Read Record Button
document.getElementById("btnReadRecord").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: "recordRead",
      },
      response => {
        console.log(response);
      }
    );
  });
});

// Stop Record Button
document.getElementById("btnStopRecord").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: "recordStop",
      },
      response => {
        console.log(response);
      }
    );
  });
});

// Delete Record Button
document.getElementById("btnDeleteRecord").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: "recordDelete",
      },
      response => {
        console.log(response);
      }
    );
  });
});

// Rewind Click Button
document.getElementById("btnRewind").addEventListener("click", () => {
  chrome.runtime.sendMessage(
    {
      type: "rewind",
    },
    response => {}
  );
});

// Save Record Button
document.getElementById("btnSaveRecord").addEventListener("click", () => {
  chrome.runtime.sendMessage(
    {
      type: "recordSave",
    },
    response => {
      console.log(response.message);
    }
  );
});

// Load Record Button
document.getElementById("btnLoadRecord").addEventListener("click", () => {
  chrome.runtime.sendMessage(
    {
      type: "recordLoad",
    },
    response => {
      console.log(response);
    }
  );
});
