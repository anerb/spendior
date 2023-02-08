

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
    notes: "",
  }
  
  body.source = document.querySelector('input[name="source"]:checked').value;
  if (body.souce == "other1") {
    body.source = document.querySelector("#other_endpoint1").value;
  }
  if (body.souce == "other2") {
    body.source = document.querySelector("#other_endpoint2").value;
  }
 
  body.destination = document.querySelector('input[name="destination"]:checked').value;
  if (body.destination == "other1") {
    body.destination = document.querySelector("#other_endpoint1").value;
  }
  if (body.destination == "other2") {
    body.destination = document.querySelector("#other_endpoint2").value;
  }
  body.currency = document.querySelector('input[name="currency"]:checked').value;
  if (body.currency == "other") {
    body.currency = document.querySelector("#other_currency").value;
  }
  body.amount = document.querySelector("#amount").value;
  body.notes = document.querySelector("#notes").value;
  
  let body_json = JSON.stringify(body);
  var finalValues = [
    'mailto:anerbenartzi+email2sheet@gmail.com?subject=' + encodeURIComponent('This is not a very good description.'),
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

  let input_elements = document.querySelector('input')
  for (let input_element of input_elements) {
    input_element.addEventListener('input', ready);
  }
}