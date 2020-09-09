;(function(root,factory){
  root.sitePagesManager = factory()
})(this,function(){
  
  var sitePagesManager = {};
  
  var Route = {
    card: true,
    application: true,
    index: true
  }
  
  function include(filename){
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  }
  
  function render(page,variables){
    var tmp = HtmlService.createTemplateFromFile(page);
    Logger.log(variables)
    Logger.log(tmp)
    if(variables){
      var keys = Object.keys(variables)
      keys.forEach(function(key){
        tmp[key] = variables[key]
      })
    }
    return tmp.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  
  function stringToHTML(str) {
    return HtmlService.createHtmlOutput(str);
  }
  
  sitePagesManager.Route = Route;
  sitePagesManager.render = render;
  sitePagesManager.include = include;
  sitePagesManager.stringToHTML = stringToHTML;
  
  return sitePagesManager;
  
})