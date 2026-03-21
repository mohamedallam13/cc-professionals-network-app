;(function(root,factory){
  root.doubleEmailer = factory()
})(this,function(){
  
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);
  
  var live = true;
  
  const TEST_MAIL = 'mh.allam@yahoo.com'
  
  var dbObj = Toolkit.readFromJSON(allFileIds.profDB);
  var namesIndex = dbObj.namesIndex;
  var profInfoObj = dbObj.profInfoObj;
  
  var templates = Toolkit.readFromJSON(allFileIds.HTMLTemplates);
  
  var doubleEmailer = {};
  
  function init(request){
    request.ratingLink = getRatingLink(request.ratingCode);
    var id = namesIndex[request.selectedProfessional];
    var profObj = profInfoObj[id].userData;
    var variables = Toolkit.mergeObjects(profObj,request)
    addContacts(variables);
    emailToProf(variables);
    emailToRequester(variables);    
  }
  
  function addContacts(variables){
  var contactsKeys = ['Contact Phone Number','Contact Email','Facebook Page','Website'];
    contactsKeys.forEach(function(key){
      if(variables[key] != ''){
        variables['add ' + key] = key + ' : ' + variables[key];
      }else{
        variables['add ' + key] = '';
      }
    })
  }
  
  function emailToProf(variables){
    var emailOptions = new ProfEmailOptions(variables);
    sendEmail(emailOptions);
  }
  
  function ProfEmailOptions(variables){
    this.name = "Cairo Confessions Professionals Network";
    this.subject = "Dr. " + variables.firstName + ", You have a request!"
    this.to = live? variables['Contact Email'] : TEST_MAIL;
    this.replyTo = variables.requesterEmail;
    this.cc = variables.linkedEmail;
    this.body = Toolkit.createTemplateSimple(templates["Email to Professional"],variables); //TODO Make a template and add elements to it
  }
  
  function emailToRequester(variables){
    var emailOptions = new ReqEmailOptions(variables);
    sendEmail(emailOptions);
  }
  
  function ReqEmailOptions(variables){
    this.name = "Cairo Confessions Professionals Network";
    this.subject = "Hello, you have made a request to be connected to a professional"
    this.to = variables.requesterEmail;
    this.body = Toolkit.createTemplateSimple(templates["Email to Requester"],variables);
  }
  
  
  function getRatingLink(ratingCode){
    var formId = '1NGts4M2VPdrOPLflwZlKrwkUqqX7PzO0gHbcsVz6ST0';
    var form = FormApp.openById(formId);
    var items = form.getItems();
    for (var i in items) { 
      var ratingCodeId;
      var formResponse = form.createResponse();
      if(items[i].getTitle() == 'Rating Code'){
        ratingCodeId = items[i].getId();
        var formItem = items[i].asTextItem();
        var response = formItem.createResponse(ratingCode);
        formResponse.withItemResponse(response);
        var ratingLink = formResponse.toPrefilledUrl();
        break;
      }
    }
    return ratingLink;
  }
  
  function sendEmail(emailOptions) {
    /* parameters
    attachments  - BlobSource[] - an array of files to send with the email
    bcc          - String       - a comma-separated list of email addresses to BCC
    body         - String       - the body of the email
    cc           - String       - a comma-separated list of email addresses to CC
    htmlBody     - String       - if set, devices capable of rendering HTML will use it instead of the required body argument; you can add an optional inlineImages field in HTML body if you have inlined images for your email
    inlineImages - Object       - a JavaScript object containing a mapping from image key (String) to image data (BlobSource); this assumes that the htmlBody parameter is used and contains references to these images in the format <img src="cid:imageKey" /> (see example)
    name         - String       - the name of the sender of the email (default: the user's name)
    noReply      - Boolean      - true if the email should be sent from a generic no-reply email address to discourage recipients from responding to emails; this option is only possible for Google Apps accounts, not Gmail users
    replyTo      - String       - an email address to use as the default reply-to address (default: the user's email address)
    subject      - String       - the subject of the email
    to           - String       - the address of the recipient
    */
    var rdq = getRemainingDailyQuota();
    if (rdq < 1) {
      throw 'Remaining e-mail quota exceeded. Please send e-mail manually.';
    } else {
      try{
        MailApp.sendEmail(emailOptions)
      }catch(e){
        Logger.log(e)
        return e
      };
    }
  }
  
  function getRemainingDailyQuota() {
    var rdq = MailApp.getRemainingDailyQuota();
    return rdq;
  }
  
  
  
  doubleEmailer.init = init;
  
  return doubleEmailer
  
})

function sendOutDoubleEmails(request){
//  var request = {selectedProfessional: "David George", requesterEmail: "mh.allam@yahoo.com", age: "22", genderchoice: "Male", problemExplained: "asd", category: 'whatever', topics: 'adult, plus 19, harsh', ratingCode: 'HJSFH13'}
  return doubleEmailer.init(request);
}