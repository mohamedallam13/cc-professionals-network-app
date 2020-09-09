;(function(root,factory){
  root.updateDB = factory()
})(this,function(){
  //Clasp used to push
  var updateDB = {};
  
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromFile(MASTER_INDEX_FILE_ID);

  var updateDashboardBool = true;
  var counterResetBool = false;
  
  var dbObj;
  var namesIndex;
  var editingCodesObj;
  var profInfoObj;
  var allIDs;
  var sheetObj;
  var newEntries = [];
  var avaiableCodesArray;
  var currSource
  var editingFormPrefilled;

  function inititateDB(){
    dbObj = Toolkit.readFromFile(allFileIds.profDB);
    avaiableCodesArray = Toolkit.readFromFile(allFileIds.availableRatingCodes);
    if(!dbObj.namesIndex){
      dbObj.namesIndex = {};
    }
    namesIndex = dbObj.namesIndex;
    
    if(!dbObj.editingCodesObj){
      dbObj.editingCodesObj = {};
    }
    editingCodesObj = dbObj.editingCodesObj;
    
    if(!dbObj.profInfoObj){
      dbObj.profInfoObj = {};
    }
    profInfoObj = dbObj.profInfoObj;
    
    if(dbObj.profInfoObj){
      allIDs = Object.keys(dbObj.profInfoObj);
    }else{
      allIDs = [];
    }
    editingFormPrefilled = getEditingFormPrefilledLink();
  }
  
  function clearDB(){
    Toolkit.writeToJSON({}, allFileIds.profDB);
    clearDashboard();
    counterResetBool = true;
  }
  
  function init(FILE_ID,type){
    var sourcesObj = Toolkit.readFromFile(FILE_ID);
    var countArray = sourcesObj.map(function(source){return updateData(source,type)});
    countArray.forEach(function(newCount,i){
      sourcesObj[i].formCount = newCount;
    })
    Toolkit.writeToJSON(sourcesObj, FILE_ID)
  }
  
  function updateData(source,type){
    inititateDB();
    currSource = source.sourceName;
    sheetObj = Toolkit.readSheet(source);
    var objData = sheetObj.objectifiedValues.entriesDataObjArr;
    var oldCount = counterResetBool? 0 : source.formCount;
    var newCount = objData.length;
    if(newCount - oldCount > 0){
      var dataToProcess = objData.slice(oldCount);
      switch(type) {
        case 1:
          var idData = getFilterIdData(dataToProcess);
          idData.forEach(addData);
          if(updateDashboardBool){
            writeToDashboard(newEntries);
          }
          break;
        case 2:
          dataToProcess.forEach(addReviews);
          //          writeToDashboard(profSpecificObj)
          Toolkit.writeToJSON(avaiableCodesArray, allFileIds.availableRatingCodes);
          break;
        default:
      }
      Toolkit.writeToJSON(dbObj, allFileIds.profDB)
    }
    return newCount;
  }
  
  function reUpdateDashboard(FILE_ID){
    inititateDB();
    var sourcesObj = Toolkit.readFromFile(FILE_ID);
    sourcesObj.forEach(function(source){
      var sheetObj = Toolkit.readSheet(source);
      var objData = sheetObj.objectifiedValues.entriesDataObjArr;
      var idData = getFilterIdData(objData);
      idData.forEach(addData);
      writeToDashboard();
    });
  }
  
  function addData(row){
    if(!profInfoObj[row['ID']]){
      profInfoObj[row['ID']] = new ProfObj(row);
    }else{
      profInfoObj[row['ID']].collectedData.unshift(row);    
    }
    namesIndex[profInfoObj[row['ID']].userData.fullName] = row['ID'];
    newEntries.push(profInfoObj[row['ID']].userData)
  }
  
  function getDashboardSheetOptions(){
    var dashboardSheetOptions = {
      ssid: '1O2mdrUMFh8p9T2nHYXkQcEHH6xFQrzTtVnr9F0ORzeU',
      sheetName: 'Tracker',
      headerRow: 2,
      skipRows: 1
    }
    var dataWriteStartColName = 'dataWriteStartCol';
    var dataWriteStartCol = SpreadsheetApp.openById(dashboardSheetOptions.ssid).getSheetByName(dashboardSheetOptions.sheetName).getRange(dataWriteStartColName).getColumn();
    dashboardSheetOptions.startCol = dataWriteStartCol;
    dashboardSheetOptions.countBy = dataWriteStartCol;
    return dashboardSheetOptions;
  };
  
  function writeToDashboard(){
    var dashboardSheetOptions = getDashboardSheetOptions();
    var dashboardSheetObj = Toolkit.readSheet(dashboardSheetOptions);
    var header = dashboardSheetObj.header;
    var lastRow = dashboardSheetObj.lastRow;
    var writeArr = Toolkit.objArrToArray(newEntries,header,true);
    Toolkit.writeToSheet(writeArr,dashboardSheetOptions.ssid,dashboardSheetOptions.sheetName,lastRow + 1,dashboardSheetOptions.startCol);
    newEntries = [];
  }
  
  function clearDashboard(){
    var dashboardSheetOptions = getDashboardSheetOptions();
    var sheet = SpreadsheetApp.openById(dashboardSheetOptions.ssid).getSheetByName(dashboardSheetOptions.sheetName);
    sheet.getRange(dashboardSheetOptions.headerRow + dashboardSheetOptions.skipRows + 1,dashboardSheetOptions.startCol,sheet.getLastRow(),sheet.getLastColumn()).clearContent();
  
  }
  
  function addReviews(row){
    var codeIndex = vaiableCodesArray.indexOf(row["Rating Code"]);
    if(codeIndex > -1){
      var id = namesIndex[row['Select the Professional']];
      var profObj = profInfoObj[id];
      var reportReviewBool = row['What would you like to do?'] == 'Report'? false : true;
      if(reportReviewBool){
        var reviewObj = new ReviewObj(row);
        profObj.reviews.submitted.push(reviewObj);
        processRatingReview(profObj)
      }else{
        var reportObj = new ReportObj(row);
        profObj.reports.push(reportObj);
      }
      Toolkit.removeArrayElement(avaiableCodesArray,row["Rating Code"])
    }
  }
  
  function ReviewObj(row){
    this.reviewDate = new Date(row['Timestamp']);
    this.topic = row['Topic'];
    this.generalRating = row['General Rating'];
    this.review = row['Review'];
    this.dateOfLastSession = row['Date Of Last Session'];
    this.ratingCode = row['Rating Code'];
  }
  
  function ReportObj(row){
    this.reportDetails = {reportDate: new Date(row['Timestamp']), reason: row['Report Reasons'], detailed: row['Please Elaborate']};
    this.reportDecision = '';
  }
  
  function processRatingReview(profObj){
    profObj.reviews.ratingCount = profObj.reviews.submitted.length;
    profObj.reviews.writtenReviewsArr = [];
    profObj.reviews.submitted.forEach(function(reviewObj){
      if(reviewObj.review != ''){
        profObj.reviews.writtenReviewsArr.push({rating:reviewObj.generalRating ,review: reviewObj.review});
      }
    })
    profObj.reviews.averagRating = (profObj.reviews.averagRating * ((profObj.reviews.ratingCount - 1)/ profObj.reviews.ratingCount)) + row['General Rating'];
  }
  
  function ProfObj(row){
    this.approved = false;
    this.active = false;
    this.rejected = false;
    this.supervisorAccount = undefined;
    this.userData = new UserData(row);
    this.statusHistory = [new StatusObj(row)];
    this.reviews = {averageRating: 0, ratingCount: 0, submitted: []};
    this.reports = [];
    this.requests = [];
    this.imageUploads = [];
    var generatedEditingCode = generateCode();
    this.editingCode = generatedEditingCode;
    editingCodesObj[generatedEditingCode] = row['ID'];
//    this.editingLink =  editingFormPrefilled.replace(/<editingCode>/g,generatedEditingCode);
    this.collectedData = [row];
  }
  
  function UserData(row){
    var self = this;
    Object.keys(row).forEach(function(key){
      self[key] = row[key];
    })
    var FullName = Toolkit.nameFormatting(row['First Name'],row['Last Name']);
    this.fullName = FullName;
    this.dob = getVirtualBirthDate(row['Timestamp'],row['Age']);
    this.firstName =  FullName.split(" ")[0];
    this.lastName = FullName.split(" ")[1];
    this.lastUpdated = Toolkit.timestampCreate(row['Timestamp'],'dd.MM.YYYY HH:mm:ss');
    this.dataUpdateHistory = [{timestamp: Toolkit.timestampCreate(row['Timestamp'],'dd.MM.YYYY HH:mm:ss'), via: currSource}];
    this.currentImageFileID = '1N_HfpUUnPl5ZC3nSXwPTMvP4xByfvSsC';
    this.currentCVLink = '';
    this.discountRate = '0%';
  }
  
  function StatusObj(row){
    this.applied = Toolkit.timestampCreate(row['Timestamp'],'dd.MM.YYYY HH:mm:ss');
    this.contacted = null;
    this.responded = null;
    this.followUp1 = null;
    this.followUp2 = null;
    this.verified = null;
    this.activated = null;
    this.deactivated = null;
    this.rejected = null;
  }
  
  function getVirtualBirthDate(timestamp,age){
    var date = new Date(timestamp);
    return new Date(date.setYear(timestamp.getYear() - age));
  }

  function getFilterIdData(dataToProcess){
    var idData = dataToProcess.filter(function(row){
      return row['ID'] != "";
    })
    return idData;
  }
  

  /////////////////////////////////////////////////////////////////////////////////
  
  function generateCode(){
    var result = '';
    var length = 7
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    result = result.toUpperCase();
    avaiableCodesArray.push(result)
    return result;
  }
  
    function getEditingFormPrefilledLink(){
//    var formId = allFileIds.editingFormURL;
//    var form = FormApp.openById(formId);
//    var items = form.getItems();
//    for (var i in items) { 
//      var ratingCodeId;
//      var formResponse = form.createResponse();
//      if(items[i].getTitle() == 'Editing Code'){
//        ratingCodeId = items[i].getId();
//        var formItem = items[i].asTextItem();
//        var response = formItem.createResponse('<editingCode>');
//        formResponse.withItemResponse(response);
//        var editingFormPrefilled = formResponse.toPrefilledUrl();
//        break;
//      }
//    }
//    return editingFormPrefilled;
  }
  
  updateDB.init = init;
  updateDB.reUpdateDashboard = reUpdateDashboard;
  updateDB.clearDB = clearDB;
  
  return updateDB
  
})

function resetDB(){
  updateDB.clearDB();
  updateAllDB();
}

function clearDB(){
  updateDB.clearDB();
}

function updateAllDB(){
  
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromFile(MASTER_INDEX_FILE_ID);
  
  updateDB.init(allFileIds.profSources,1)
  
}

function updateAllReviews(){
  
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromFile(MASTER_INDEX_FILE_ID);
  
  updateDB.init(allFileIds.ccpnratingsreviewsSources,2)
}

function reUpdateDashboard(){
  
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromFile(MASTER_INDEX_FILE_ID);
  
  updateDB.reUpdateDashboard(allFileIds.profSources)
  
}
