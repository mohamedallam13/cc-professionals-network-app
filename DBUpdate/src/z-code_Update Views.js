;(function(root,factory){
  root.updateViews = factory()
})(this,function(){
  
  var updateViews = {};
  
  const MASTER_INDEX_FILE_ID = '1iOfa8u5DF74ovrD4bpG5FgUSEhJV_tW1';
  var allFileIds = Toolkit.readFromFile(MASTER_INDEX_FILE_ID);
  
  var DB_FILE_ID = allFileIds.profDB;
  var VIEWS_FILE_ID = allFileIds.viewsHTML;
  var HTML_TEMPLATES_FILE_ID = allFileIds.HTMLTemplates;
  
  var dbObj;
  var namesIndex;
  var profInfoObj;
  var templatesObj;
  var allViewsObj;
  
  function inititateDB(){
    dbObj = Toolkit.readFromFile(DB_FILE_ID);
    templatesObj = Toolkit.readFromFile(HTML_TEMPLATES_FILE_ID);
    if(!dbObj){
      return;
    }
    namesIndex = dbObj.namesIndex;
    profInfoObj = dbObj.profInfoObj;
    allViewsObj = {cardsArr: [], popupsObj: {}, perProfessional: {},activeList: []}
    return true;
  }
  
  
  
  function init(){
    if(inititateDB()){
      Object.keys(profInfoObj).forEach(processProfessional);
      joinCards();
      Toolkit.writeToJSON(allViewsObj,VIEWS_FILE_ID);
    }
  }
  
  function joinCards(){
    var finalJoinHTMLStringPC = '';
    var finalJoinHTMLStringMOB = '';
    finalJoinHTMLStringPC += '<div class="row" id="mainRow"><!--Open Row-->';
    allViewsObj.cardsArr.forEach(function(cardHTML,i){
      if(i > 0 && i % 3 == 0){
         finalJoinHTMLStringPC += '</div><!--Close Row--><div class="row" id="mainRow"><!--Open Row-->'
      }
      finalJoinHTMLStringPC += cardHTML;
      finalJoinHTMLStringMOB += cardHTML;
    })
    allViewsObj.cardsJoinedPC = finalJoinHTMLStringPC;
    allViewsObj.cardsJoinedMOB = finalJoinHTMLStringMOB;
  }
  
  function processProfessional(id){
    var profObj = profInfoObj[id];
    if(profInfoObj[id].active){
      allViewsObj.perProfessional[id] = {};
      var variables = new VariablesObj(profObj);
      allViewsObj.activeList.push(variables.fullName);
      generateViews(variables,id);
    }
  }
  
  function generateViews(variables,id){
    Object.keys(templatesObj).forEach(function(templateName){
      if(['card','More Info'].indexOf(templateName) != -1){
        var template = templatesObj[templateName];
        var view = Toolkit.createTemplateSimple(template,variables)
        allViewsObj.perProfessional[id][templateName] = view;
        if(templateName == 'card'){
          allViewsObj.cardsArr.push(view);
        }else if(templateName == 'More Info'){
          allViewsObj.popupsObj[variables.fullName] = view;
        }
      }
    })
  }
  
  function VariablesObj(profObj){
    var self = this;
    Object.keys(profObj.userData).forEach(function(key){
      self[key] = profObj.userData[key]
    })
    this.ratngStars = getRatingStars(profObj,self)
    this.trimmedTopics = getTrimmedTopics(profObj.userData['Topics (Choose all that applies)']);
    this.allTopics = profObj.userData['Topics (Choose all that applies)'];
    addRatingVariables(profObj,self);
    this.rate = profObj.userData['Cost per session (Standardized in EGP per 1 hr)'];
    this.discountRibbon = getDiscountRibbon(profObj.userData['Can you offer a discount for those who request help through CC for the sessions of 10-15%'],profObj.userData['Cost per session (Standardized in EGP per 1 hr)'])
    this.clinicDisp = profObj.userData['Clinic Name'] == ''? '' : '/ ' + profObj.userData['Clinic Name'];
    this.brief = profObj.userData["Brief (Background and Methods)"];
    this.reviewsList = getReviews(profObj);
    this.title = profObj.userData["Title"];
    this.background = profObj.userData["Qualification"] + ', ' + profObj.userData["Highest Degree"] + ', ' + profObj.userData["University/School"];
    this.onlineSessionsPossible = profObj.userData["Can you make online sessions?"];
    this.location = getLocation(profObj);
  }
  
    function getLocation(profObj){
      var gov = profObj.userData["City/Governorate"] + ', ' + profObj.userData["District"];
      switch(gov){
        case "":
          return "Cairo";
        case "Outside Egypt":
          return profObj.userData["Country"];
        default:
          return gov;
      }
    }  
    
  function getTrimmedTopics(topics){
    var topicsArr = topics.split(",");
    var sliced = topicsArr.slice(0,4);
    var trimmedTopics = sliced.join(",") + ', and other topics';
    return trimmedTopics
  }
  
  function addRatingVariables(profObj,self){
    var reviewsObj = profObj.reviews;
    if(reviewsObj.ratingCount == 0){
      self.ratingCount = '';
      self.ratingStars = 'No rating yet';
    }else if(reviewsObj.ratingCount > 1){
      if(reviewsObj.ratingCount == 1){
        self.ratingCount = '1 rating';
      }else{
        self.ratingCount = reviewsObj.ratingCount + ' ratings';
      }
      self.ratingStars = getRatingStars(reviewsObj.generalRating,true);
    }
  }
  
  function getRatingStars(generalRating,type){
    var roundedUpRating = Toolkit.approximateToHalf(generalRating);
    var ratingStarsString = '';
    var appendedString
    for(var i = 0; i < 5; i++){
      if(roundedUpRating > 0){
        if(roundedUpRating < 1){
          appendedString = type? '<i class="material-icons">star</i> ' : '★'
        }else{
          appendedString = type? '<i class="material-icons">star_half</i> ' : '★'
        }
      }else{
        appendedString = type? '<i class="material-icons">star_border</i> ' : '☆'
      }
      ratingStarsString += appendedString
    }
    return ratingStarsString;
  }
  
  function getDiscountRibbon(discount,rate){
    if(rate == 0 || rate == "Free Consultations Only"){
      return '<div class="ribbon"><span>Free Questions</span></div>';
    }
    if(discount == 'Yes'){
      return '<div class="ribbon"><span>CC DISCOUNT</span></div>'
    }
    return ''
  }
  
  function getReviews(profObj){
    var writtenReviewsArr = profObj.reviews.writtenReviewsArr;
    if(!writtenReviewsArr ||  writtenReviewsArr.length == 0){
      return 'No reviews yet'
    }
    var reviewListArr = writtenReviewsArr.map(createReviewList)
    return  reviewListArr.join('<br><br>');
  }
  
  function createReviewList(writtenReviewObj){
    var stars = getRatingStars(writtenReviewObj.rating,false);
    var reviewString = '"' + stars + ' ' + writtenReviewObj.review + '"';
    return reviewString;
  }
  
  updateViews.init = init;
  
  return updateViews
  
})

function updateHTMLViews(){
  updateViews.init();
}