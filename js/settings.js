'use strict';




function previewFile() {
  const preview = document.querySelector("#img2");
  const file = document.querySelector("#file2").files[0];
  const reader = new FileReader();

  reader.addEventListener(
    "load",
    () => {
      // convert image file to base64 string
      preview.src = reader.result;
    },
    false
  );

  if (file) {
    reader.readAsDataURL(file);
  }
}


function readFiles(files) {
  document.getElementById('count').innerHTML = files.length;

  var target = document.getElementById('target');
  target.innerHTML = '';

  for (var i = 0; i < files.length; ++i) {
    var item = document.createElement('li');
    item.setAttribute('data-idx', i);
    var file = files[i];

    var reader = new FileReader();
    reader.addEventListener('load', getReadFile(reader, i));
    reader.readAsDataURL()
    reader.readAsText(file);

    item.innerHTML = '' + file.name + ', ' + file.type + ', ' + file.size + ' bytes, last modified ' + file.lastModifiedDate + '';
    target.appendChild(item);
  };
}

// copy-paste 
// TODO: make a common.js work
function snake_case2PascalCase(snake_case, delimiter = "") {
    let PascalCaseTokens = [];
    for (let token of snake_case.split("_")) {
      token = token[0].toLocaleUpperCase() + token.slice(1);
      PascalCaseTokens.push(token);
    }
    return PascalCaseTokens.join(delimiter);
  }

// Using a global object, but others shouldn't use it.
const defaults = 
{
  "server_url": "https://script.google.com/macros/s/AKfycbyJkMt-FRy2Xo8kXyqzl024XejKBAMW0AJhvHgHBlgRLwUp3RbdJIFn9fgivYhvEraO/exec",
  "sheet_name": "data",
  "published_spreadsheet_url": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRMs9eegLp0nXmdSbFMKKVREhYVt6O0jBKPauV5bIvMLMIJkj65XjwkXi1WxvyqCk8DWiWBJB8Fi7_/pubhtml",
  "email_re": ".*",
  "keypad_location": "right",
//  "background_image_shortname": "pinkdior",
  "background_color": "#FFBBBB"
}

function fillSettings() {
  for (let key in defaults) {
    let value = window.localStorage.getItem(key) || defaults[key];
    let input = document.querySelector(`#${key}`);
    input.value = value;
  }
}
function updateSettings() {
  for (let key in defaults) {
    updateSetting(key);
  }
}

function updateSetting(key) {
  let input = document.querySelector(`#${key}`);
  window.localStorage.setItem(key, input.value);
}

function onUpdateSetting(e) {
  updateSetting(e.target.id);
}
function showSettings() {
  document.querySelector("#settings").classList.remove("display_none");
}
function setBackgroundSetting() {
  document.querySelector("#background").value = document.querySelector("#background_color").value;
  updateSettings();
}

class Setting extends HTMLElement {
  addAllEventListeners() {
    let inputs = this.querySelectorAll("input");
    for (let input of inputs) {
      input.addEventListener('input', onUpdateSetting);
    }
  }
  constructor() {
    // Always call super first in constructor
    super();
  
    // HACK to stop multiple constructor calls
    this.addAllEventListeners();
    if (this.children.length > 0) {
      return;
    }
  
    const key = this.getAttribute('key');

    const label = document.createElement('div');
    label.innerHTML = snake_case2PascalCase(key);
    label.classList.add('setting_label');
    const input = document.createElement('input');
    input.setAttribute('id', key);
    input.classList.add('setting_input');
  
    this.appendChild(label);
    this.appendChild(input);
    this.addAllEventListeners();
  }
}
 
function WebComponents() {
  customElements.define("sd-setting", Setting);
}

function appendSetting(parent, key) {
  if (!key) {
    return;
  }
  let html = `<sd-setting class="setting" key="${key}"></sd-setting>`;
  parent.innerHTML += html;
}

function BuildPage() {
  let parent = document.querySelector("#settings");
  for (let key in defaults) {
    appendSetting(parent, key);
  }
}

window.onload = function() {
  WebComponents();
  BuildPage();
  fillSettings();
  // The first time the app is opened, this is neede to fill in with
  // the default values.
  updateSettings();
}