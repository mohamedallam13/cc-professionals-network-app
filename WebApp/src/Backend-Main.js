function doGet(e) {
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);
  
  addToLog(e)
  var viewsObj = Toolkit.readFromJSON(allFileIds.viewsHTML);
  var htmlTemplates = Toolkit.readFromJSON(allFileIds.HTMLTemplates);
  var variables = {};
  variables.cardsJoinedPC = viewsObj.cardsJoinedPC;
  variables.cardsJoinedMOB = viewsObj.cardsJoinedMOB;
  variables.activeList = viewsObj.activeList;
  variables.selectedProf = e.parameter.name;
  variables.topics = htmlTemplates.topics;
  variables.categories = htmlTemplates.categories;
  if(sitePagesManager.Route[e.parameters.v]){
    return sitePagesManager.render(e.parameters.v,variables);
  }else{
//    return sitePagesManager.render('card');
    
//    variables.selectedProf = '';
//    Logger.log([variables.selectedProf,variables.topics,variables.categories]);
//    addToLog(variables)
//    return sitePagesManager.render('application',variables);

    return sitePagesManager.render('index',variables);
  }
}

function addToLog(e){
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);
  var logObj = Toolkit.readFromJSON(allFileIds.webappLogs);
  var email = Session.getActiveUser().getEmail();
  var date = new Date();
  logObj[date] = {}
  logObj[date].user = email;
  logObj[date].event = e;
  
  Toolkit.writeToJSON(logObj,allFileIds.webappLogs);
}

function addTemplateToFile(string){
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);
  
  const MJSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxhFEZEt5-Y6vXmhniJ5L3AiXjXUAh7IZ35KHOoVZJdY9l4G6Fz/exec';
  
  var HTMLTemplatesObj = Toolkit.readFromJSON(allFileIds.HTMLTemplates);
  if(!HTMLTemplatesObj.card){
    HTMLTemplatesObj.card = '';
  }

  HTMLTemplatesObj.card = string.toString();
  Toolkit.writeToJSON(HTMLTemplatesObj,allFileIds.HTMLTemplates);
  updateViewsAPI(MJSCRIPT_URL)
  return 'done!'
}

function updateViewsAPI(MJSCRIPT_URL){
  var load = {};
  load.event = {}; 
  load.event.ccPNSys = 'updateViews';
  var payload = JSON.stringify(load);
  var options = {
    'method': 'post',
    payload: payload,
  }
  var response = UrlFetchApp.fetch(MJSCRIPT_URL, options);
  Logger.log(response)
}

function getPopups(){
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);
  
  var viewsObj = Toolkit.readFromJSON(allFileIds.viewsHTML);
  var HTMLTemplatesObj = Toolkit.readFromJSON(allFileIds.HTMLTemplates);
  var combinedObj = {};
  combinedObj.popupsObj = viewsObj.popupsObj;
  combinedObj.welcomeNote = HTMLTemplatesObj["Welcome Note"];
  combinedObj.disclaimer = HTMLTemplatesObj["Disclaimer"];
  var combinedObjStr = JSON.stringify(combinedObj);
  return combinedObjStr
}