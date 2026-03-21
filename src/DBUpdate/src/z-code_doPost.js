function doPost(e){
  Logger.log(e)
  var event = JSON.parse(e.postData.contents).event;
  Logger.log('POST event: ' + JSON.stringify(event));
  if(event.ccPNSys == 'updateViews'){
    updateViews.init();
  }else if(event.ccPNSys == 'updateDB'){
    updateAllDB();
  }
}