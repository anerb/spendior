# Spendior

## Introduction

Spendior is a phone app for privately keeping track of any spending transactions you perform.

It is **not** an automatic tracker.  The entire value of Spendior comes from the
fact that you explicitly record each transaction.

Because recording transactions individually takes work, Spendior aims to minimize
that work as much as possible.

The app's interface is designed to get you in and out with as few clicks as possible.

*In the extreme case, you should only need to open the app, and click "send".*

## Requirements and Recommendations for a Spendior Mobile (on a phone)

1. An Android phone with Chrome web browser. [^1]
2. An internet connection while using the app. [^2]
3. A Server to recieve the data.
  - [SpreadsheetServer](https://github.com/anerb/GAS_email_processing/blob/642a23d3bce5f31626e6c66a89299db34c04da5a/EmailProcessing.gs), based on Google Apps Script and Google Sheets is recommended.
  - Follow the instructions for setting up your own personal SpreadsheetServer,
    or ask the person who set one up to give you the server's url for recieving data.
4. (optional) An image server that provides images for use in the app.
  a. (under development) The public url of a folder of images, with names that match your transaciton endponts.
  b. A Google Spreadsheet with a sheet that has images, and is published on the web. 
5. (optional) An endpoints preference list published online
  a. (future development) A url on the Server that can return a list of 

[^1]: Other operating systems and browsers will hopefullly be supported soon.
[^2]: Being able to use the app while offline is a top priority.
