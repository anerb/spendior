'use strict';

// COPY-PASTE. HACKY

Element.prototype.$ = HTMLElement.prototype.querySelector;
Element.prototype.$$ = HTMLElement.prototype.querySelectorAll;
Document.prototype.$ = Document.prototype.querySelector;
Document.prototype.$$ = Document.prototype.querySelectorAll;


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
  "username": "Pick any Username",
  "server_url": "https://script.google.com/macros/s/AKfycbyJkMt-FRy2Xo8kXyqzl024XejKBAMW0AJhvHgHBlgRLwUp3RbdJIFn9fgivYhvEraO/exec",
  "sheet_name": "data",
  "published_endpoints_url": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRMs9eegLp0nXmdSbFMKKVREhYVt6O0jBKPauV5bIvMLMIJkj65XjwkXi1WxvyqCk8DWiWBJB8Fi7_/pub?gid=1056089378&single=true&output=csv",
  "always_present_endpoints": "bank, credit_card, cash, person, store",
  "email_re": ".*",
  "keypad_location": "right",
  "background_color": "#FFBBBB",
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

function resetStorage() {
  window.localStorage.clear();
  document.$('#reset_storage').innerHTML += '*';
  // After clearing, write back what is already in the settings screen.
  updateSettings();
}

function done() {
  window.location.assign('./index.html');
}

function AddEventListeners() {
  document.$('#reset_storage').addEventListener('click', resetStorage);
  document.$('#done').addEventListener('click', done);
}

window.onload = function() {
  WebComponents();
  BuildPage();
  fillSettings();
  // The first time the app is opened, this is neede to fill in with
  // the default values.
  updateSettings();
  AddEventListeners();
}