// importScripts('https://unpkg.com/dexie@3.2.3/dist/dexie.js')

'use strict';

// COPY-PASTE. HACKY
const version=20230504081258;

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
  "server_url": "",
  "sheet_name": "data",
  "published_revisions_url": "",
  "published_endpoints_url": "",
  "always_present_endpoints": "bank, credit_card, cash, person, store",
  "email_re": ".*",
  "keypad_location": "right",
  "background_color": "#FFBBBB",
  "local_directory": "click to select",
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

async function updateSetting(key) {
  let input = document.querySelector(`#${key}`);
  const db = new Dexie("Spendior");

  db.version(1).stores({
    records: "[server_id+server_revision],state,record_json",
    settings: "[key],value",
  });

  db.settings.put({key: key, value: input.value});
  window.localStorage.setItem(key, input.value);
}

function onUpdateSetting(e) {
  updateSetting(e.target.id);
}

function onClickSetting(e) {
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
    for (let input of inputs) {
      input.addEventListener('click', onClickSetting);
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
  window.location.assign(`./index.html?version=${version}`);
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