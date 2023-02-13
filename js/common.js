
async function readTag() {
    if ("NDEFReader" in window) {
      const ndef = new NDEFReader();
      try {
        await ndef.scan();
        ndef.onreading = event => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            consoleLog("Record type:  " + record.recordType);
            consoleLog("MIME type:    " + record.mediaType);
            consoleLog("=== data ===\n" + decoder.decode(record.data));
          }
        }
      } catch(error) {
        consoleLog(error);
      }
    } else {
      consoleLog("Web NFC is not supported.");
    }
  }
  
  
  function consoleLog(data) {
    var logElement = document.getElementById('log');
    logElement.innerHTML += data + '\n';
  }

  function gotoPage1() {
    document.querySelector(".page0").style.display = "none";
    document.querySelector(".page1").style.display = "block";
  }