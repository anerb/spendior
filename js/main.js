

function selectItem(item) {
  item.classList.add('selected');
}

function ready() {
  console.log("ready");
  let body = {
    source: "",
    destination: "",
    amount: "",
    currency: "",
    what: "",
    notes: "",
  }
  
  // TODO: surround each endpoint with some data for the human-friendly version.
  source_element = document.querySelector('input[name="source"]:checked');
  if (source_element.value == "other1") {
    source_element = document.querySelector("#other_endpoint1").value;
  }
  if (source_element.value == "other2") {
    source_element = document.querySelector("#other_endpoint2").value;
  }
  body.source = source_element.value;
  document.querySelector('#from_helper').innerHTML = body.source;

  destination_element = document.querySelector('input[name="destination"]:checked');
  if (destination_element.value == "other1") {
    destination_element = document.querySelector("#other_endpoint1").value;
  }
  if (destination_element.value == "other2") {
    destination_element = document.querySelector("#other_endpoint2").value;
  }
  body.destination = destination_element.value;
  document.querySelector('#to_helper').innerHTML = body.destination;

  body.currency = document.querySelector('input[name="currency"]:checked').value;
  if (body.currency == "other") {
    body.currency = document.querySelector("#other_currency").value;
  }
  body.amount = document.querySelector("#amount").value;
  body.notes = document.querySelector("#notes").value;
  body.what = document.querySelector("#what").value;
  
  subject = body.source + " > " + body.amount + " (" + body.what + ") > " + body.destination;

  let body_json = JSON.stringify(body);
  var finalValues = [
    'mailto:anerbenartzi+email2sheet@gmail.com?subject=' + encodeURIComponent(subject),
    'cc=' + encodeURIComponent('"16I2ldN2v_an0u5c09zYpr_bKAw0DBeTH53NRnxtvFkw" <anerbenartzi+email2sheet@gmail.com>'),
    'bcc=' + encodeURIComponent('"entries" <anerbenartzi+email2sheet@gmail.com>'),
    'body=' + encodeURIComponent(body_json),
  ];

  var sendItem = document.querySelector("#send-email");
  sendItem.href = finalValues.join('&');  
  sendItem.style.display = "inline"
}


window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }

  let input_elements = document.querySelectorAll('input')
  for (let input_element of input_elements) {
    input_element.addEventListener('input', ready);
  }
}