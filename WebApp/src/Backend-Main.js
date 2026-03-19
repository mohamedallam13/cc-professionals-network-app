// =========================================================
//  CONFIG
//  Update MASTER_INDEX_FILE_ID when the index Drive file changes.
// =========================================================
var MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';

// Internal API endpoint for triggering a view rebuild via the DBUpdate script.
var MJSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxhFEZEt5-Y6vXmhniJ5L3AiXjXUAh7IZ35KHOoVZJdY9l4G6Fz/exec';

// =========================================================
//  ENTRY POINT
// =========================================================
function doGet(e) {
  var allFileIds = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);

  addToLog(e);

  var viewsObj       = Toolkit.readFromJSON(allFileIds.viewsHTML);
  var htmlTemplates  = Toolkit.readFromJSON(allFileIds.HTMLTemplates);

  var variables = {
    cardsJoinedPC:  viewsObj.cardsJoinedPC,
    cardsJoinedMOB: viewsObj.cardsJoinedMOB,
    activeList:     viewsObj.activeList,
    selectedProf:   e.parameter.name,
    topics:         htmlTemplates.topics,
    categories:     htmlTemplates.categories
  };

  if (sitePagesManager.Route[e.parameters.v]) {
    return sitePagesManager.render(e.parameters.v, variables);
  }

  return sitePagesManager.render('index', variables);
}

// =========================================================
//  LOGGING
// =========================================================
function addToLog(e) {
  var allFileIds = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);
  var logObj     = Toolkit.readFromJSON(allFileIds.webappLogs);
  var date       = new Date();

  logObj[date] = {
    user:  Session.getActiveUser().getEmail(),
    event: e
  };

  Toolkit.writeToJSON(logObj, allFileIds.webappLogs);
}

// =========================================================
//  CARD TEMPLATE (used by DBUpdate to store pre-rendered HTML)
// =========================================================
function addTemplateToFile(string) {
  var allFileIds        = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);
  var htmlTemplatesObj  = Toolkit.readFromJSON(allFileIds.HTMLTemplates);

  htmlTemplatesObj.card = string.toString();
  Toolkit.writeToJSON(htmlTemplatesObj, allFileIds.HTMLTemplates);

  updateViewsAPI();
  return 'done!';
}

function updateViewsAPI() {
  var payload = JSON.stringify({ event: { ccPNSys: 'updateViews' } });
  var options = { method: 'post', payload: payload };
  UrlFetchApp.fetch(MJSCRIPT_URL, options);
}

// =========================================================
//  POPUPS (welcome note, disclaimer, per-prof info)
// =========================================================
function getPopups() {
  var allFileIds       = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);
  var viewsObj         = Toolkit.readFromJSON(allFileIds.viewsHTML);
  var htmlTemplatesObj = Toolkit.readFromJSON(allFileIds.HTMLTemplates);

  var combinedObj = {
    popupsObj:   viewsObj.popupsObj,
    welcomeNote: htmlTemplatesObj['Welcome Note'],
    disclaimer:  htmlTemplatesObj['Disclaimer']
  };

  return JSON.stringify(combinedObj);
}

// =========================================================
//  REQUEST HANDLER (delegated to z-code_Request Handler.js)
// =========================================================
function receiveRequest(request) {
  return handleRequest(request);
}
