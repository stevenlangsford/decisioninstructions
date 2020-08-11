var canvaswidth = window.innerWidth-30;
var canvasheight = window.innerHeight-30;

var superbest = 0; //new splash screens mees up this scraping thing: put these in constructor and add it on draw. End-of-exp feedback still desirable, but split by stage?
var rnd_guess = 0;

var phase = "phase0"; //phase1, phase2, phase3 set by splashscreen drawme. Changes rules for observation-budget / drawing. Sad about this global var hack, sorry.

function shuffle(a) { //via https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

//drawing params
var buttonheight = 100;
var buttonwidth = 100;
var digitheight = 90;
var digitwidth = 90/4;
var circle_size = 280;
var circle_x = 0;
var circle_y = 0;
var feature_precision = 3; //same for prob and pay features (split ?) ref'd at get_

//study params: n stim, dists of each feature, TODO obs budget?
var trialindex = 0; //refs the current trial.
var scorecounter = 0;

var choice_live = false; //toggle responsiveness of these buttons.
var feature_live = true;

function get_prob(){
    return (Math.random()).toPrecision(feature_precision);
}

function get_payoff(){
    function rnorm() { //standard normal via Box-Muller
	var u = 0, v = 0;
	while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
	while(v === 0) v = Math.random();
	return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }
    
    return (rnorm()*7+20).toPrecision(feature_precision);
}

function get_obsbudget(){
    return shuffle([1,2,3,4,5])[0]; //used to go up to 6, but now there's an all-revealed phase1 and phase2, can attncheck on those.
}
//stim setup:
var feature_lookup = {};

function splashScreen(text, caption){
    this.text = text;
    this.trialtype = "splash"
    
    this.drawMe = function(){
	//do the phase transition. Gods I am so sad that this phase thing got patched on with global vars. Last complain-comment, just venting.
	if(phase == "phase2") {
//	    console.log("entering phase 3")
	    phase = "phase3"
	}else if(phase == "phase1"){
//	    console.log("entering phase 2")
	    phase = "phase2"
	}else{
//	    console.log("entering phase 1")
	    phase = "phase1";
	}
	
	document.getElementById("uberdiv").innerHTML = "<canvas id=\"ubercanvas\" width=\""+canvaswidth+"\" height=\""+canvasheight+"\" ></canvas>";
	
	var canvas = document.getElementById("ubercanvas");
	// console.log("got canvas?")
	// console.log(canvas);
	
	var ctx = canvas.getContext('2d');
	//	ctx.clearRect(0,0,canvas.width,canvas.height);

	ctx.font = "3em Arial";
	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	ctx.fillText(this.text, canvas.width/2, 100); //was canvas.height/2

	abs_holder_div.innerHTML = "<img id='splash' src='/img/nextarrow.png' "+
	    "onmouseenter=\"this.src='"+"img/nextarrow_highlight.png"+"'\""+
	    "onmouseleave=\"this.src='"+"img/nextarrow.png"+"'\""+
	    "onclick=\"nextTrial()\""+
	    "style='"+
	    "height:"+100+"px; "+
	    "width:"+250+"px; "+
	    "position:fixed; "+
	    "top:"+300+"px; "+// was: (canvas.height/2+100)
	    "left:"+(canvas.width/2-150)+"px; "+
	    "'>"+"<div class='demoimg'><p>"+caption+"</p></div>";
	
    }
    
}

function makeTrial(idstring, obsbudget, p1, p2, p3, v1, v2, v3){


    this.ppntID = localStorage.getItem("ppntID");
    this.obsbudget = obsbudget; //tracker, decrements.
    this.obsbudget_initial = obsbudget; //recorder, fixed.
    this.observations = [];//obs pushed here as they're made.
    this.obstime = [];
    this.probfeatures = [p1, p2, p3];
    this.payfeatures = [v1, v2, v3];
    this.drawTime = -1;
    this.idstring = idstring;

    this.infostate = ["-","-","-","-","-","-"];//init: all unobserved. Keep 1-2-3 order while making observations, but used sorted order to save. Ok?

    
    feature_lookup[idstring+"prob1"] = p1;
    feature_lookup[idstring+"prob2"] = p2;
    feature_lookup[idstring+"prob3"] = p3;
    feature_lookup[idstring+"pay1"] = v1;
    feature_lookup[idstring+"pay2"] = v2;
    feature_lookup[idstring+"pay3"] = v3;
    
    this.drawMe = function(){
	
	this.phase = phase;
	this.drawTime = Date.now();
	//in polar cords, position1 is (d,0)
	//position 2 is (d, 2pi/3)
	//position 3 is (d, 4pi/3)

	// so pos 1 in rect cords is: d*cos(0),d*sin(0) = (d,0)
	// pos 2 is d*cos(2pi/3), d*sin(2pi/3)
	//pos 3 is d*cos(4pi/3), d*sin(4pi/3)
	document.getElementById("uberdiv").innerHTML ="";
	var bg_center_x = window.innerWidth/2-buttonwidth*2.1;
	var bg_center_y = window.innerHeight/2-buttonheight*.6;
	
	var background_imgstring =  "<img class='trial' src='buttons/texturecloud.png' "+
	    "height='"+(buttonheight+10)+"px' "+
	    "width='"+(buttonwidth*4)+"px' "+
	    "style=\"position:fixed;"+
	    "top:"+(bg_center_y+circle_size+circle_y - 130)+"px;"+
	    "left:"+(bg_center_x+circle_x)+"px;"+
	    "\">"+
	    "<img class='trial' src='buttons/texturecloud.png' "+
	    "height='"+(buttonheight+10)+"px' "+
	    "width='"+(buttonwidth*4)+"px' "+
	    "style=\"position:fixed;"+
	    "top:"+(bg_center_y+circle_size*Math.cos(2*Math.PI/3)+circle_y)+"px;"+
	    "left:"+(bg_center_x+circle_size*Math.sin(2*Math.PI/3)+circle_x)+"px;"+
	    "\">"+
	    "<img class='trial' src='buttons/texturecloud.png' "+
	    "height='"+(buttonheight+10)+"px' "+
	    "width='"+(buttonwidth*4)+"px' "+
	    "style=\"position:fixed;"+
	    "top:"+(bg_center_y+circle_size*Math.cos(4*Math.PI/3)+circle_y)+"px;"+
	    "left:"+(bg_center_x+circle_size*Math.sin(4*Math.PI/3)+circle_x)+"px;"+
	    "\">"

				       // 	       left+buttonwidth*.1,
				       // buttonheight*.8,
				       // buttonwidth*3);
	document.getElementById("uberdiv").innerHTML += background_imgstring;
	
	document.getElementById("uberdiv").innerHTML += option_string(idstring+"prob1",idstring+"pay1",
								     circle_size+circle_y - 130,//fudge why?
								     0+circle_x,
								     true);
	document.getElementById("uberdiv").innerHTML += option_string(idstring+"prob2",idstring+"pay2",
								     circle_size*Math.cos(2*Math.PI/3)+circle_y,
								     circle_size*Math.sin(2*Math.PI/3)+circle_x,
								     false);
	document.getElementById("uberdiv").innerHTML += option_string(idstring+"prob3",idstring+"pay3",
								     circle_size*Math.cos(4*Math.PI/3)+circle_y,
								     circle_size*Math.sin(4*Math.PI/3)+circle_x,
								     false);

	document.getElementById("uberdiv").innerHTML += ("<div class = 'trial' id='infodiv'"+
							 "style=\"position:fixed; text-align:center"+
							 // "top:"+(window.innerHeight/2-100)+"px;"+
							 // "left:"+(window.innerWidth/2-100)+"px;"+
							 "\">"+get_current_info_message()+"</div>");
	
	document.getElementById("uberdiv").innerHTML += ("<div class = 'trial' id='progressfooter'"+
							 "style=\"position:fixed;"+
							 "bottom:0;"+
							 "right:0;"+
							 "width:200px;"+
							 "\">Trial "+(trialindex+1)+" of "+trials.length+"</div>");
	

	var info_width = document.getElementById('infodiv').offsetWidth;
	var info_height = document.getElementById('infodiv').offsetHeight;

	document.getElementById("infodiv").style.top = (window.innerHeight/2-info_height/2-10)+"px";
	document.getElementById("infodiv").style.left = (window.innerWidth/2-info_width/2)+"px";

	//for phase1 and 2, pre-click everything and change obsbudget message: here be dragons
// 	if(phase == "phase1" || phase == "phase2"){
// 	    var featureids = [
// 		trials[trialindex].idstring+"_prob1",
// 		trials[trialindex].idstring+"_prob2",
// 		trials[trialindex].idstring+"_prob3",
// 		trials[trialindex].idstring+"_pay1",
// 		trials[trialindex].idstring+"_pay2",
// 		trials[trialindex].idstring+"_pay3"
// 		]
	    
// 	    for(var i = 0; i<6 ; i++){
// 		var featureid = featureids[i]; //doesn't js have iterators now? Can't you for x in collection?
		
// 		document.getElementById("infodiv").innerHTML= get_current_info_message();
// 		//copypasted from click_feature
// 		var me = document.getElementById(featureid);
// 		console.log("this is me:")
// 		console.log(me)
// //		me.parentNode.removeChild(me);
		
// 		var mynumber = ""+feature_lookup[featureid];
	    
// 	    for(var i=0;i<mynumber.length; i++){
// 		var mychar = mynumber.charAt(i) == "." ? "pt" : mynumber.charAt(i);
// 		var digit_imgstring = "<img class='trial' src='digits/"+mychar+".png' "+
// 		    "height='"+digitheight+"px' "+
// 		    "width='"+digitwidth+"px' "+
// 		    "style=\"position:fixed;"+
// 		    "top:"+(me.style.top)+";"+
// 		    "left:"+(parseFloat(me.style.left, 10)+digitwidth*i)+"px;"+
// 		    "\">";
// 		document.getElementById("uberdiv").innerHTML+=digit_imgstring;
// 	    }
// 	    }}
	
// 	// //hide choice initially: revealed when obsbudget goes to zero.
// 	// var cbs = document.getElementsByClassName("choicebutton");
// 	// for (var i = 0; i < cbs.length; i++) {
// 	//     cbs[i].style.display = "none";
	// 	// }

		if(phase == "phase1" || phase == "phase2"){
		    trials[trialindex].obsbudget = 6 //That's me! Avoiding 'this'. All info available in phase 1 and phase 2.
		    click_feature(trials[trialindex].idstring+"prob1")
		    click_feature(trials[trialindex].idstring+"prob2")
		    click_feature(trials[trialindex].idstring+"prob3")
		    click_feature(trials[trialindex].idstring+"pay1")
		    click_feature(trials[trialindex].idstring+"pay2")
		    click_feature(trials[trialindex].idstring+"pay3")
		}//end if phase 1 or 2
    }//end drawme
}//end maketrial

// function doclick(){

//     var featureid = trials[trialindex].idstring+"prob1"
    
//     document.getElementById("infodiv").innerHTML= get_current_info_message();
	
//     var me = document.getElementById(featureid);
    
//     me.parentNode.removeChild(me);
    
//     var mynumber = ""+feature_lookup[featureid];

//     for(var i=0;i<mynumber.length; i++){
// 	var mychar = mynumber.charAt(i) == "." ? "pt" : mynumber.charAt(i);
// 	var digit_imgstring = "<img class='trial' src='digits/"+mychar+".png' "+
// 	    "height='"+digitheight+"px' "+
// 	    "width='"+digitwidth+"px' "+
// 	    "style=\"position:fixed;"+
// 	    "top:"+(me.style.top)+";"+
// 	    "left:"+(parseFloat(me.style.left, 10)+digitwidth*i)+"px;"+
// 	    "\">";
// 	document.getElementById("uberdiv").innerHTML+=digit_imgstring;
//     }
    
//     // console.log("boom:"+trials[trialindex].idstring+"_prob1");
//     // click_feature(trials[trialindex].idstring+"_prob1")
// }


//helper fns
function get_current_info_message(){
    if(phase =="phase3"){
	return "<p>You have "+trials[trialindex].obsbudget+" observation"+(trials[trialindex].obsbudget!=1 ? "s" : "")+" left this trial</p>"+
	    "<p>Total score so far: "+(parseFloat(scorecounter.toPrecision(3)))+"</p>";
    }
    else{
	return "<p>Total score so far: "+(parseFloat(scorecounter.toPrecision(3)))+"</p>";
    }
}

function click_feature(featureid){
    //document.getElementById(featureid).style.display = "none";
    trials[trialindex].observations.push(featureid);
    trials[trialindex].obstime.push(Date.now());
    console.log(featureid)
    
    var whoami = featureid.split("_")[1] //oh god so ugly! Oh well.
    console.log(whoami)

    if(!feature_live)return;
    
    if(trials[trialindex].obsbudget==0){
	alert("You're out of observations.\nPlease choose an option to continue.")
	return;
    }

    trials[trialindex].obsbudget--;

    if(trials[trialindex].obsbudget==0){
	choice_live = true;
	var cbs = document.getElementsByClassName("choicebutton");
	for (var i = 0; i < cbs.length; i++) {
	    cbs[i].style.display = "block";
	} 
    }
    
    document.getElementById("infodiv").innerHTML= get_current_info_message();
	
    var me = document.getElementById(featureid);
    me.parentNode.removeChild(me);
    
    var mynumber = ""+feature_lookup[featureid];

    for(var i=0;i<mynumber.length; i++){
	var mychar = mynumber.charAt(i) == "." ? "pt" : mynumber.charAt(i);
	var digit_imgstring = "<img class='trial' src='digits/"+mychar+".png' "+
	    "height='"+digitheight+"px' "+
	    "width='"+digitwidth+"px' "+
	    "style=\"position:fixed;"+
	    "top:"+(me.style.top)+";"+
	    "left:"+(parseFloat(me.style.left, 10)+digitwidth*i)+"px;"+
	    "\">";
	document.getElementById("uberdiv").innerHTML+=digit_imgstring;
    }
}

function click_choice(choiceid){
    //dragons
    if(trials[trialindex].obsbudget>0){
	alert("You still have observations left. Please use all your observations before making a choice.");
	return;
    }
    if(!choice_live)return;
    feature_live = false;
    choice_live = false;
    var id_split = choiceid.split("::");

    var myprob = feature_lookup[id_split[0]];
    var mypay =  feature_lookup[id_split[1]];
    var myoption = id_split[0].split("_")[1].charAt(id_split[0].split("_")[1].length-1);


    
    trials[trialindex].score_before_choice = scorecounter;
    trials[trialindex].choice_time = Date.now();
    
    if(Math.random() < myprob){
	scorecounter+=parseFloat(mypay);
	trials[trialindex].payout_received = true;
	
	// document.getElementById("infodiv").innerHTML = "<p>Payout! Score increased by "+mypay+"</p><button onclick='nextTrial()'>Next</button>";
	// var info_width = document.getElementById('infodiv').offsetWidth; //there has GOT to be a better way to stay centered?
	// var info_height = document.getElementById('infodiv').offsetHeight;
	// document.getElementById("infodiv").style.top = (window.innerHeight/2-info_height/2-10)+"px";
	// document.getElementById("infodiv").style.left = (window.innerWidth/2-info_width/2)+"px";

		document.getElementById("uberdiv").innerHTML = "<p class='feedbackpara'>Payout! Score increased by "+mypay+"<br/><button onclick='nextTrial()'>Next</button></p>";
	var info_width = document.getElementById('uberdiv').offsetWidth; //there has GOT to be a better way to stay centered?
	var info_height = document.getElementById('uberdiv').offsetHeight;
	document.getElementById("uberdiv").style.top = (window.innerHeight/2-info_height/2-10)+"px";
	document.getElementById("uberdiv").style.left = (window.innerWidth/2-info_width/2)+"px";
	
    }else{
	trials[trialindex].payout_received = false;
	
	// document.getElementById("infodiv").innerHTML = "<p>This gamble did not pay out</p><button onclick='nextTrial()'>Next</button>";
	// var info_width = document.getElementById('infodiv').offsetWidth;
	// var info_height = document.getElementById('infodiv').offsetHeight;
	// document.getElementById("infodiv").style.top = (window.innerHeight/2-info_height/2-10)+"px";
	// document.getElementById("infodiv").style.left = (window.innerWidth/2-info_width/2)+"px";
		document.getElementById("uberdiv").innerHTML = "<p class = 'feedbackpara' >This gamble did not pay out<br/><button onclick='nextTrial()'>Next</button></p>";
	var info_width = document.getElementById('uberdiv').offsetWidth;
	var info_height = document.getElementById('uberdiv').offsetHeight;
	document.getElementById("uberdiv").style.top = (window.innerHeight/2-info_height/2-10)+"px";
	document.getElementById("uberdiv").style.left = (window.innerWidth/2-info_width/2)+"px";
    }

    //reveal all unobserved features
    for(var optionid=1; optionid<=3;optionid++){
	for(var whichfeature = 0; whichfeature<2;whichfeature++){
	    var features = ["prob","pay"];
	    
	    var featureid = trials[trialindex].idstring+features[whichfeature]+optionid;
	    var me = document.getElementById(featureid);
	    if(me == null)continue;//bad style?
	    me.parentNode.removeChild(me);
	    
	    var mynumber = ""+feature_lookup[featureid];
	    
	    for(var i=0;i<mynumber.length; i++){
		var mychar = mynumber.charAt(i) == "." ? "pt" : mynumber.charAt(i);
		var digit_imgstring = "<img class='trial' src='digits/"+mychar+".png' "+
		    "height='"+digitheight+"px' "+
		    "width='"+digitwidth+"px' "+
		    "style=\"position:fixed;"+
		    "top:"+(me.style.top)+";"+
		    "left:"+(parseFloat(me.style.left, 10)+digitwidth*i)+"px;"+
		    "\">";
		document.getElementById("uberdiv").innerHTML+=digit_imgstring;
	    }
	}//whichfeature
    }//whichoption

    //save the response to db:
    trials[trialindex].choice = choiceid.split("_")[0]+"_"+myoption;
    trials[trialindex].score_after_choice = scorecounter;
    trials[trialindex].condition = condition;
    trials[trialindex].trialindex = trialindex;
    
    trials[trialindex].chose_prob = myprob;
    trials[trialindex].chose_pay = mypay;
    trials[trialindex].chose_expectation = myprob*mypay;
    
    trials[trialindex].expectedvalue1 = trials[trialindex].probfeatures[0]*trials[trialindex].payfeatures[0];
    trials[trialindex].expectedvalue2 = trials[trialindex].probfeatures[1]*trials[trialindex].payfeatures[1];
    trials[trialindex].expectedvalue3 = trials[trialindex].probfeatures[2]*trials[trialindex].payfeatures[2];
    
    //information state (sorted as in R strategy search)
    $.post("/response",{myresponse:JSON.stringify(trials[trialindex])},
	   function(success){
	       console.log(success);//probably 'success', might be an error
	       //Note potential error not handled at all. Hah.
	   }
	  );
    
    
}

function nextTrial(){ //assumes all DOM elements associated with a trial have class 'trial'
    // var paras = document.getElementsByClassName('trial');
    // while(paras[0]){
    // 	paras[0].parentNode.removeChild(paras[0]);
    // }
    document.getElementById("abs_holder_div").innerHTML = "";

    if(trials[trialindex].probfeatures!=null){ //ie if you're on a real trial not a splash screen.
    var trialvals = [trials[trialindex].payfeatures[0]*trials[trialindex].probfeatures[0],
				     trials[trialindex].payfeatures[1]*trials[trialindex].probfeatures[1],
				     trials[trialindex].payfeatures[2]*trials[trialindex].probfeatures[2]]
    
    superbest = superbest + Math.max(trialvals[0],trialvals[1],trialvals[2]); //super best only ever harvests expected value. Ok?

    rnd_guess = rnd_guess + shuffle(trialvals)[0]; //rnd also in expected value. Whatever, didn't feel like sim gambles.

//    console.log("evals: "+superbest + ":"+rnd_guess+":"+scorecounter);
    }
    
    trialindex++;
    choice_live = false; //toggle responsiveness of these buttons.
    feature_live = true;

    if(trialindex>=trials.length){
	localStorage.setItem("ppntscore",scorecounter);
	localStorage.setItem("bestscore",superbest);
	localStorage.setItem("rndscore",rnd_guess);

	$.post("/finish",function(data){window.location.replace(data)});
	return;
    }else{
	trials[trialindex].drawMe();
    }
}

function button_string(id, myclass, img, imghover, imgclick, clickfn, top, left, height, width){
    var viewportwidth = window.innerWidth; //used to center element. Viewport size might change! You'll get the one that was current at call time.
    var viewportheight = window.innerHeight;
    
    var drawstring = "<img class = '"+myclass+"' id='"+id+"' src='"+img+"' height=\""+height+"\" width=\""+width+"\""+
	"onmouseenter=\"this.src='"+imghover+"'\""+
	"onmouseleave=\"this.src='"+img+"'\""+
	"onmousedown=\"this.src='"+imgclick+"'\""+
	"onmouseup=\"this.src='"+imghover+"'\""+
	"onclick=\""+clickfn+"('"+id+"')\""+
	"style=\"position:fixed;"+
	"top:"+(viewportheight/2+top-height/2)+"px;"+
	"left:"+(viewportwidth/2+left-width/2)+"px;"+
	"\">";
        return drawstring;
}

function option_string(probid, payid, top, left, buttonbelow){
    var viewportwidth = window.innerWidth; //used to center element. Viewport size might change! You'll get the one that was current at call time.
    var viewportheight = window.innerHeight;
    
    var my_button_img;
    var my_highlight_img;
    var mypulled_img;
    
    if(phase == "phase1" || phase == "phase2"){
	my_button_img = (buttonbelow ? "buttons/choosebutton_withcaptionabove.png" : "buttons/choosebutton_withcaption.png");
	my_highlight_img = (buttonbelow ? "buttons/choosebutton_withcaptionabove_highlight.png" : "buttons/choosebutton_withcaption_highlight.png");
	my_pulled_img = (buttonbelow ? "buttons/choosebutton_withcaptionabove_pulled.png" : "buttons/choosebutton_withcaption_pulled.png");
    }else{
	my_button_img = "buttons/choosebutton.png"
	my_highlight_img = "buttons/choosebutton_hilight.png"
	my_pulled_img = "buttons/choosebutton_pulled.png"
    }
    //    var mychoosebutton = button_string(probid+"::"+payid,"trial choicebutton","buttons/choosebutton.png","buttons/choosebutton_hilight.png","buttons/choosebutton_pulled.png","click_choice",
        var mychoosebutton = button_string(probid+"::"+payid,"trial choicebutton",my_button_img,my_highlight_img,my_pulled_img,"click_choice",
				       (buttonbelow ? top+buttonheight*.6 : top-buttonheight*.9),
				       left+buttonwidth*.1,
				       buttonheight*.8,
				       buttonwidth*3);
    
    
    var drawstring = ""+
	mychoosebutton +
	button_string(probid, "trial featurebutton", "buttons/dice_noshadow.png","buttons/dice_shadow.png","buttons/dice_highlight.png","click_feature",top,left-buttonwidth/1.2,buttonheight,buttonwidth)+
	button_string(payid, "trial featurebutton", "buttons/payout_noshadow.png","buttons/payout_shadow.png","buttons/payout_highlight.png","click_feature",top,left+buttonwidth/1.2,buttonheight,buttonwidth);

    return drawstring;
}

//MAIN
var condition = localStorage.getItem("condition");
var n_trials = 35;

var cond1_trialpool = shuffle([
new makeTrial("trial0_",5,0.723,0.414,0.466,22.9,23.8,11.6),
new makeTrial("trial1_",2,0.339,0.656,0.668,17.4,24.1,15.8),
new makeTrial("trial2_",3,0.505,0.232,0.335,17.4,18.6,16.5),
new makeTrial("trial3_",5,0.737,0.752,0.582,25.2,19.9,14.5),
new makeTrial("trial4_",4,0.305,0.233,0.189,24.2,18.2,16.7),
new makeTrial("trial5_",2,0.158,0.186,0.453,15.9,14.5,17.5),
new makeTrial("trial6_",4,0.468,0.72,0.836,26.8,13.4,21.3),
new makeTrial("trial7_",5,0.696,0.697,0.309,24.9,26,25.8),
new makeTrial("trial8_",5,0.59,0.559,0.322,12.5,24.6,23.4),
new makeTrial("trial9_",3,0.46,0.829,0.726,23.3,23.1,16.4),
new makeTrial("trial10_",6,0.753,0.705,0.713,11.7,28.8,28),
new makeTrial("trial11_",4,0.655,0.241,0.543,16.4,20.3,22.9),
new makeTrial("trial12_",1,0.674,0.723,0.728,17.3,22.4,15.4),
new makeTrial("trial13_",4,0.808,0.408,0.588,22,16.1,16.3),
new makeTrial("trial14_",2,0.223,0.432,0.415,20.6,21.9,18.2),
new makeTrial("trial15_",2,0.731,0.466,0.35,12.9,16.3,23.5),
new makeTrial("trial16_",3,0.551,0.691,0.256,18.6,22.7,29.8),
new makeTrial("trial17_",4,0.515,0.273,0.522,21.3,23,17.9),
new makeTrial("trial18_",2,0.78,0.163,0.57,22.1,23.3,21),
new makeTrial("trial19_",6,0.562,0.333,0.349,19.5,21.4,17.8),
new makeTrial("trial20_",4,0.494,0.494,0.786,23.1,22.9,23.7),
new makeTrial("trial21_",3,0.559,0.421,0.694,27.2,15,21.3),
new makeTrial("trial22_",4,0.773,0.723,0.206,23.6,12,17.3),
new makeTrial("trial23_",3,0.787,0.805,0.272,11.2,15.4,24.7),
new makeTrial("trial24_",5,0.2,0.802,0.543,18.2,26.1,23),
new makeTrial("trial25_",4,0.269,0.554,0.771,19.7,29,22.1),
new makeTrial("trial26_",2,0.509,0.658,0.707,20.4,17.1,14.4),
new makeTrial("trial27_",6,0.439,0.766,0.242,18.7,29.2,24.5),
new makeTrial("trial28_",4,0.231,0.25,0.277,18.7,19.7,15.7),
new makeTrial("trial29_",4,0.599,0.345,0.287,21.5,22.2,17.8),
new makeTrial("trial30_",3,0.771,0.682,0.795,14.5,12.7,18),
new makeTrial("trial31_",4,0.448,0.515,0.841,15.5,17.9,15.1),
new makeTrial("trial32_",3,0.262,0.335,0.52,17,13.1,19.4),
new makeTrial("trial33_",2,0.452,0.819,0.159,27.1,20.1,18.3),
new makeTrial("trial34_",1,0.3,0.582,0.837,14.1,15.3,22.7),
new makeTrial("trial35_",3,0.29,0.783,0.66,28.7,16,24.9),
new makeTrial("trial36_",4,0.283,0.487,0.236,25,24.2,16.9),
new makeTrial("trial37_",4,0.657,0.707,0.676,18.6,22.9,29.7),
new makeTrial("trial38_",6,0.401,0.731,0.783,16.8,17.4,23.3),
new makeTrial("trial39_",3,0.805,0.777,0.731,29.9,23.4,15.3),
new makeTrial("trial40_",1,0.65,0.219,0.66,13,15.3,24.8),
new makeTrial("trial41_",6,0.717,0.41,0.193,20.8,23.8,15.1),
new makeTrial("trial42_",4,0.756,0.235,0.44,15.6,21.3,22.3),
new makeTrial("trial43_",2,0.337,0.345,0.763,23.1,23.3,25.3),
new makeTrial("trial44_",5,0.446,0.156,0.771,14.7,15.9,24.1),
new makeTrial("trial45_",4,0.301,0.279,0.759,17.2,26.3,12.7),
new makeTrial("trial46_",5,0.539,0.715,0.275,17.5,15.8,24.8),
new makeTrial("trial47_",5,0.264,0.741,0.283,18.2,10.6,20.5),
new makeTrial("trial48_",1,0.457,0.807,0.844,20.4,22.3,16),
new makeTrial("trial49_",2,0.772,0.58,0.828,24.1,28.7,18.5),
new makeTrial("trial50_",5,0.652,0.509,0.483,25.4,24.4,21.4),
new makeTrial("trial51_",6,0.656,0.588,0.176,23.3,21.4,22),
new makeTrial("trial52_",2,0.209,0.459,0.824,16.1,23,19.4),
new makeTrial("trial53_",4,0.709,0.821,0.211,19.3,20.9,19.1),
new makeTrial("trial54_",6,0.403,0.257,0.599,29.9,23.5,20.8),
new makeTrial("trial55_",1,0.838,0.83,0.678,17.9,23.7,18.5),
new makeTrial("trial56_",2,0.319,0.829,0.46,25.6,11.9,25.8),
new makeTrial("trial57_",3,0.738,0.518,0.185,16.1,26.5,16.1),
new makeTrial("trial58_",1,0.688,0.575,0.59,25.7,20,17),
new makeTrial("trial59_",6,0.553,0.255,0.208,15.5,22.1,27.7),
new makeTrial("trial60_",2,0.427,0.543,0.787,20.7,23.1,24.3),
new makeTrial("trial61_",5,0.33,0.565,0.194,22.6,24.6,23.3),
new makeTrial("trial62_",3,0.665,0.312,0.567,23.2,16,14.3),
new makeTrial("trial63_",2,0.672,0.68,0.711,17.2,10.8,20),
new makeTrial("trial64_",3,0.477,0.53,0.691,24.6,27.4,18),
new makeTrial("trial65_",4,0.565,0.764,0.556,17.2,17.4,21.8),
new makeTrial("trial66_",3,0.195,0.761,0.255,15.9,11.1,28.1),
new makeTrial("trial67_",3,0.714,0.84,0.331,19.5,25.1,18.9),
new makeTrial("trial68_",1,0.26,0.82,0.281,16.2,23.6,19.7),
new makeTrial("trial69_",6,0.154,0.673,0.827,24.2,23.6,25),
new makeTrial("trial70_",6,0.167,0.723,0.298,23.7,19.9,16.1),
new makeTrial("trial71_",5,0.531,0.199,0.202,15.6,23.6,16.1),
new makeTrial("trial72_",5,0.246,0.264,0.184,16.5,28.4,16.6),
new makeTrial("trial73_",2,0.238,0.576,0.561,19.9,16.5,21.7),
new makeTrial("trial74_",3,0.163,0.753,0.676,27.7,21,15.3),
new makeTrial("trial75_",2,0.309,0.575,0.476,15.2,26.9,16.4),
new makeTrial("trial76_",4,0.222,0.591,0.569,22.3,23.3,27.8),
new makeTrial("trial77_",4,0.682,0.289,0.282,25.3,13.3,23.3),
new makeTrial("trial78_",2,0.314,0.478,0.584,11.4,21.5,18.8),
new makeTrial("trial79_",6,0.738,0.184,0.559,10.7,24.7,12.5),
new makeTrial("trial80_",4,0.203,0.289,0.709,18.4,18.1,29.2),
new makeTrial("trial81_",4,0.197,0.162,0.162,13.2,10.6,19.8),
new makeTrial("trial82_",4,0.284,0.158,0.586,23.2,13.9,18.3),
new makeTrial("trial83_",1,0.173,0.834,0.309,18.2,10.1,18.8),
new makeTrial("trial84_",4,0.226,0.425,0.239,19.4,13.5,17.8),
new makeTrial("trial85_",1,0.201,0.797,0.316,19.6,23.8,10.6),
new makeTrial("trial86_",2,0.238,0.417,0.169,21.1,21.1,17.3),
new makeTrial("trial87_",2,0.19,0.279,0.252,22.8,18.8,29),
new makeTrial("trial88_",1,0.515,0.573,0.69,20.6,18,15.4),
new makeTrial("trial89_",1,0.843,0.408,0.657,19.1,17.9,16.1),
new makeTrial("trial90_",2,0.694,0.269,0.748,23.7,18.2,18.5),
new makeTrial("trial91_",6,0.771,0.723,0.206,15.7,15.6,20),
new makeTrial("trial92_",2,0.703,0.68,0.238,15.7,21.1,22.2),
new makeTrial("trial93_",4,0.243,0.248,0.69,24.1,19.5,27.3),
new makeTrial("trial94_",6,0.723,0.512,0.34,27,26.2,16.5),
new makeTrial("trial95_",6,0.683,0.334,0.836,27,12.1,27.4),
new makeTrial("trial96_",4,0.246,0.427,0.177,24.1,22.4,20.4),
new makeTrial("trial97_",5,0.154,0.219,0.481,14.3,19.4,23.8),
new makeTrial("trial98_",5,0.529,0.299,0.734,16.4,11.1,25.5),
new makeTrial("trial99_",1,0.494,0.733,0.205,11.8,20.1,20.9),
new makeTrial("trial100_",2,0.789,0.201,0.478,24.9,20.4,17.3),
new makeTrial("trial101_",5,0.788,0.821,0.297,27.2,24.2,19.3),
new makeTrial("trial102_",4,0.573,0.476,0.578,17.9,24.3,21.1),
new makeTrial("trial103_",6,0.252,0.156,0.261,23.4,23.8,15.9),
new makeTrial("trial104_",3,0.661,0.732,0.154,20.1,17.6,15.2),
new makeTrial("trial105_",1,0.772,0.503,0.551,23.4,21.4,16.3),
new makeTrial("trial106_",5,0.513,0.33,0.787,18.8,15,21.6),
new makeTrial("trial107_",1,0.589,0.196,0.316,24.5,20,24.6),
new makeTrial("trial108_",2,0.301,0.337,0.529,15.6,26,16.3),
new makeTrial("trial109_",3,0.185,0.571,0.334,24.7,20.9,17.4),
new makeTrial("trial110_",4,0.445,0.713,0.759,24.7,24.8,10.1),
new makeTrial("trial111_",2,0.781,0.521,0.283,19.7,23.1,22.8),
new makeTrial("trial112_",2,0.272,0.188,0.817,20.9,15.9,16.8),
new makeTrial("trial113_",2,0.401,0.535,0.293,16.6,21.9,17.2),
new makeTrial("trial114_",4,0.324,0.195,0.168,16.6,23.4,25.3),
new makeTrial("trial115_",3,0.233,0.519,0.812,19,16.2,22.1),
new makeTrial("trial116_",2,0.299,0.57,0.221,19.4,15.9,17.8),
new makeTrial("trial117_",3,0.493,0.806,0.69,16.6,15.7,17.9),
new makeTrial("trial118_",4,0.79,0.745,0.512,28.9,18.4,22.9),
new makeTrial("trial119_",5,0.311,0.271,0.526,23.9,22.9,14),
new makeTrial("trial120_",1,0.752,0.6,0.249,17.6,17.9,16),
new makeTrial("trial121_",3,0.331,0.598,0.701,17,19.2,17.9),
new makeTrial("trial122_",3,0.759,0.428,0.404,14.6,23.8,18.8),
new makeTrial("trial123_",1,0.833,0.198,0.539,19.7,17.1,21.8),
new makeTrial("trial124_",2,0.469,0.535,0.306,18.2,20.4,24.9),
new makeTrial("trial125_",2,0.828,0.33,0.496,23.7,23.9,20.2),
new makeTrial("trial126_",6,0.539,0.489,0.468,17,24.3,25.1),
new makeTrial("trial127_",4,0.564,0.156,0.155,10.2,10.9,18.5),
new makeTrial("trial128_",3,0.201,0.562,0.713,24.2,14.7,24.7),
new makeTrial("trial129_",5,0.775,0.745,0.295,20.5,23.9,20.5),
new makeTrial("trial130_",1,0.517,0.175,0.471,24.9,29.1,15.5),
new makeTrial("trial131_",6,0.835,0.837,0.68,16.1,16.9,19.6),
new makeTrial("trial132_",4,0.836,0.212,0.796,21.3,24.6,24.9),
new makeTrial("trial133_",3,0.789,0.541,0.712,17.3,16.9,15.6),
new makeTrial("trial134_",2,0.805,0.653,0.444,23.5,10.3,22.6),
new makeTrial("trial135_",5,0.681,0.707,0.402,18.1,15.3,18.1),
new makeTrial("trial136_",1,0.454,0.813,0.669,15.4,29.1,20.9),
new makeTrial("trial137_",1,0.411,0.298,0.404,16.9,24.3,29.1),
new makeTrial("trial138_",1,0.436,0.71,0.809,24.9,25.7,25.4),
new makeTrial("trial139_",1,0.694,0.566,0.177,24.5,23.1,18.3),
new makeTrial("trial140_",4,0.811,0.786,0.342,22.1,24.4,24.1),
new makeTrial("trial141_",6,0.522,0.807,0.46,21.1,19.9,24.8),
new makeTrial("trial142_",3,0.814,0.484,0.429,22.4,19.9,27.8),
new makeTrial("trial143_",2,0.534,0.472,0.817,16.2,25.3,21.7),
new makeTrial("trial144_",2,0.495,0.291,0.437,24,23.2,12),
new makeTrial("trial145_",3,0.675,0.542,0.346,27.4,15.8,18.1),
new makeTrial("trial146_",2,0.481,0.507,0.338,17.6,19.9,10.2),
new makeTrial("trial147_",3,0.462,0.698,0.322,11.4,19.7,26.2),
new makeTrial("trial148_",3,0.286,0.7,0.297,23.6,25.7,22.3),
new makeTrial("trial149_",4,0.823,0.263,0.699,21.4,10.5,22.1),
new makeTrial("trial150_",2,0.197,0.494,0.299,27.9,17.8,26.7),
new makeTrial("trial151_",5,0.488,0.336,0.437,20.9,25.1,28),
new makeTrial("trial152_",3,0.749,0.32,0.229,17.7,18.6,17.2),
new makeTrial("trial153_",4,0.715,0.651,0.274,23.8,21.5,20.5),
new makeTrial("trial154_",1,0.408,0.684,0.504,15.4,25.7,16.2),
new makeTrial("trial155_",6,0.5,0.734,0.846,21.9,20.8,16.7),
new makeTrial("trial156_",5,0.811,0.332,0.764,17,20.7,28.1),
new makeTrial("trial157_",5,0.65,0.508,0.653,23.4,15.2,27.6),
new makeTrial("trial158_",2,0.234,0.511,0.22,27,16.3,15.7),
new makeTrial("trial159_",3,0.313,0.794,0.81,20.9,21.2,21.8),
new makeTrial("trial160_",1,0.151,0.599,0.728,24.4,29.2,23.7),
new makeTrial("trial161_",3,0.164,0.74,0.526,27.6,28.4,24.4),
new makeTrial("trial162_",5,0.322,0.479,0.214,17,16.3,13.8),
new makeTrial("trial163_",6,0.739,0.21,0.264,13.5,22.6,25.6),
new makeTrial("trial164_",3,0.827,0.535,0.759,20.1,21.6,21.8),
new makeTrial("trial165_",5,0.795,0.464,0.583,19.7,13.4,23),
new makeTrial("trial166_",6,0.523,0.788,0.668,12.5,23.1,18.5),
new makeTrial("trial167_",3,0.656,0.205,0.825,18.5,19.9,21.5),
new makeTrial("trial168_",5,0.72,0.203,0.741,16.5,26.4,18.9),
new makeTrial("trial169_",4,0.438,0.485,0.318,29.2,22.4,17.3),
new makeTrial("trial170_",2,0.779,0.766,0.696,25.5,17.2,27.3),
new makeTrial("trial171_",6,0.474,0.175,0.284,22.7,15.2,18.6),
new makeTrial("trial172_",2,0.204,0.423,0.204,14.6,21.1,15.3),
new makeTrial("trial173_",2,0.742,0.164,0.278,28.4,10.7,22.9),
new makeTrial("trial174_",6,0.256,0.5,0.19,19.1,28.2,16.1),
new makeTrial("trial175_",2,0.827,0.687,0.771,17.5,18,19),
new makeTrial("trial176_",5,0.439,0.505,0.67,25.4,25,24.1),
new makeTrial("trial177_",4,0.48,0.748,0.253,15,13.1,22.9),
new makeTrial("trial178_",5,0.81,0.342,0.752,26.1,21.3,13.9),
new makeTrial("trial179_",1,0.759,0.409,0.511,16.6,10.6,16),
new makeTrial("trial180_",5,0.786,0.288,0.181,15.9,23.9,19),
new makeTrial("trial181_",4,0.55,0.701,0.701,21.2,17,21.1),
new makeTrial("trial182_",2,0.766,0.189,0.293,17.2,23.9,24.1),
new makeTrial("trial183_",3,0.689,0.843,0.197,19.8,29.7,23.6),
new makeTrial("trial184_",1,0.317,0.593,0.42,18.7,20.5,25.7),
new makeTrial("trial185_",4,0.541,0.213,0.22,19.4,20.8,20.8),
new makeTrial("trial186_",6,0.221,0.317,0.19,16.4,17.1,17.2),
new makeTrial("trial187_",5,0.697,0.154,0.245,17.3,15.8,27.8),
new makeTrial("trial188_",3,0.474,0.713,0.196,15.8,21.6,14.5),
new makeTrial("trial189_",2,0.682,0.508,0.222,24,24.5,25.1),
new makeTrial("trial190_",5,0.186,0.483,0.467,24,17.6,15.6),
new makeTrial("trial191_",1,0.751,0.762,0.192,26.4,20.8,25.3),
new makeTrial("trial192_",1,0.582,0.664,0.676,28.6,21.6,18),
new makeTrial("trial193_",3,0.673,0.719,0.223,24.8,15.3,26.6),
new makeTrial("trial194_",2,0.349,0.778,0.808,10.3,17,21.8),
new makeTrial("trial195_",1,0.59,0.278,0.786,22.5,19.2,11.4),
new makeTrial("trial196_",3,0.326,0.744,0.295,11.7,23.9,17.3),
new makeTrial("trial197_",5,0.161,0.697,0.164,22.6,19.6,15.8),
new makeTrial("trial198_",6,0.7,0.46,0.671,14.6,20.1,27.7),
new makeTrial("trial199_",1,0.232,0.234,0.817,12,18.4,24.6),
new makeTrial("trial200_",6,0.708,0.151,0.7,29.7,14.8,20.3),
new makeTrial("trial201_",6,0.16,0.293,0.234,16.6,24.7,18.8),
new makeTrial("trial202_",4,0.526,0.548,0.524,16.9,22.2,21.3),
new makeTrial("trial203_",6,0.666,0.41,0.591,10.5,18.5,20.7),
new makeTrial("trial204_",2,0.723,0.32,0.537,20,24.1,10.3),
new makeTrial("trial205_",3,0.72,0.582,0.179,15.7,18.1,15.6),
new makeTrial("trial206_",1,0.515,0.671,0.251,27.1,21.7,27.7),
new makeTrial("trial207_",6,0.542,0.462,0.576,13.1,18.4,24.6),
new makeTrial("trial208_",6,0.552,0.557,0.757,22.6,17.6,24.1),
new makeTrial("trial209_",2,0.462,0.198,0.151,13.9,13.7,24.5),
new makeTrial("trial210_",6,0.733,0.659,0.455,13.6,23.8,18.2),
new makeTrial("trial211_",1,0.694,0.564,0.688,27.9,21.5,16.5),
new makeTrial("trial212_",4,0.582,0.812,0.843,15.2,19.3,18.1),
new makeTrial("trial213_",2,0.486,0.555,0.716,27.4,16.3,20.9),
new makeTrial("trial214_",6,0.428,0.664,0.767,12.6,24.8,13.4),
new makeTrial("trial215_",3,0.491,0.832,0.842,28.5,16.3,12.6),
new makeTrial("trial216_",1,0.778,0.508,0.589,18.6,16.4,15.9),
new makeTrial("trial217_",5,0.51,0.527,0.791,15.5,12.1,24.5),
new makeTrial("trial218_",2,0.772,0.809,0.721,16.4,19,10.8),
new makeTrial("trial219_",3,0.428,0.344,0.481,22.6,19.7,14),
new makeTrial("trial220_",2,0.157,0.59,0.532,19.5,20.9,21.4),
new makeTrial("trial221_",6,0.711,0.454,0.237,17.8,23.6,19.6),
new makeTrial("trial222_",2,0.222,0.494,0.75,17.4,22.4,18.9),
new makeTrial("trial223_",2,0.493,0.834,0.528,18.3,21,18.1),
new makeTrial("trial224_",5,0.344,0.672,0.462,17.2,18.6,23.3),
new makeTrial("trial225_",4,0.45,0.724,0.459,18.9,19.9,24.7),
new makeTrial("trial226_",6,0.241,0.708,0.169,14.3,20.2,19.8),
new makeTrial("trial227_",3,0.69,0.757,0.226,17.8,18.8,28.1),
new makeTrial("trial228_",3,0.315,0.475,0.561,16.5,13.8,19.9),
new makeTrial("trial229_",4,0.438,0.841,0.828,25.3,24.2,25.8),
new makeTrial("trial230_",2,0.566,0.271,0.429,24.5,13.3,19.2),
new makeTrial("trial231_",3,0.481,0.728,0.712,23.1,19,19.3),
new makeTrial("trial232_",6,0.738,0.672,0.691,22.1,16.9,12.1),
new makeTrial("trial233_",5,0.192,0.482,0.227,20.9,10.1,19.8),
new makeTrial("trial234_",3,0.743,0.168,0.331,18,18.7,28.2),
new makeTrial("trial235_",6,0.719,0.459,0.32,21.3,16.7,22.4),
new makeTrial("trial236_",1,0.525,0.52,0.532,21.6,16.3,17.9),
new makeTrial("trial237_",4,0.451,0.402,0.541,24.9,12.4,21.8),
new makeTrial("trial238_",4,0.462,0.576,0.553,16.4,18.2,18.9),
new makeTrial("trial239_",4,0.216,0.286,0.308,18.8,19.5,16.6),
new makeTrial("trial240_",6,0.419,0.811,0.52,16.5,22.6,22),
new makeTrial("trial241_",4,0.554,0.173,0.269,11.4,16.5,28.1),
new makeTrial("trial242_",6,0.681,0.691,0.241,24.4,18.1,27.2),
new makeTrial("trial243_",1,0.576,0.833,0.462,19.7,24.6,19.9),
new makeTrial("trial244_",2,0.433,0.182,0.238,21.3,22.2,22.7),
new makeTrial("trial245_",5,0.652,0.421,0.241,22.9,18.1,19.9),
new makeTrial("trial246_",1,0.215,0.532,0.723,19.2,23.6,18.8),
new makeTrial("trial247_",1,0.801,0.23,0.292,18.1,26.8,26),
new makeTrial("trial248_",5,0.773,0.689,0.668,25.9,29.6,15.3),
new makeTrial("trial249_",2,0.274,0.323,0.572,29.9,27.8,19.2),
new makeTrial("trial250_",6,0.257,0.176,0.705,18.7,24.5,28.7),
new makeTrial("trial251_",4,0.524,0.419,0.264,29.1,18.7,22.1),
new makeTrial("trial252_",2,0.537,0.748,0.805,16.5,28,20),
new makeTrial("trial253_",3,0.439,0.556,0.784,16.4,16.2,19.1),
new makeTrial("trial254_",6,0.472,0.273,0.596,28.8,23.8,21.2),
new makeTrial("trial255_",3,0.341,0.593,0.212,15.9,17.1,15.5),
new makeTrial("trial256_",1,0.55,0.79,0.183,18.5,25.1,20.8),
new makeTrial("trial257_",6,0.838,0.473,0.209,24.5,17.8,19.2),
new makeTrial("trial258_",1,0.527,0.548,0.332,18.6,14.8,23),
new makeTrial("trial259_",1,0.458,0.843,0.303,23.2,19.3,16.2),
new makeTrial("trial260_",1,0.496,0.776,0.787,16.4,11.7,10.9),
new makeTrial("trial261_",6,0.409,0.658,0.443,16.1,13.5,28.7),
new makeTrial("trial262_",3,0.655,0.58,0.716,16.5,14.1,14.7),
new makeTrial("trial263_",3,0.292,0.427,0.58,10.3,10.5,19.7),
new makeTrial("trial264_",2,0.651,0.598,0.791,16.2,16.9,15.7),
new makeTrial("trial265_",4,0.694,0.817,0.587,20.3,21.7,27.5),
new makeTrial("trial266_",3,0.318,0.431,0.294,19,16.8,20.7),
new makeTrial("trial267_",1,0.345,0.339,0.495,15.1,15.3,14.7),
new makeTrial("trial268_",1,0.462,0.805,0.521,22.7,23.3,23.5),
new makeTrial("trial269_",3,0.726,0.247,0.414,16.1,19.5,22.3),
new makeTrial("trial270_",4,0.667,0.556,0.413,22.2,26.6,27.6),
new makeTrial("trial271_",5,0.809,0.418,0.674,20.6,27.9,30),
new makeTrial("trial272_",3,0.55,0.407,0.808,23.9,23.2,10.2),
new makeTrial("trial273_",5,0.76,0.711,0.183,20.3,19.2,25.5),
new makeTrial("trial274_",2,0.413,0.286,0.422,23.5,19.4,15.8),
new makeTrial("trial275_",2,0.71,0.825,0.831,16.5,22.6,12.9),
new makeTrial("trial276_",6,0.165,0.177,0.554,10.8,15.7,19.2),
new makeTrial("trial277_",5,0.528,0.155,0.466,24,24.9,12.1),
new makeTrial("trial278_",4,0.411,0.308,0.696,23.6,11.7,10.6),
new makeTrial("trial279_",2,0.553,0.29,0.248,19,22.9,17.9),
new makeTrial("trial280_",1,0.288,0.174,0.314,17.4,15,26.3),
new makeTrial("trial281_",3,0.731,0.462,0.666,20.2,18.4,10.1),
new makeTrial("trial282_",3,0.406,0.223,0.27,22,23.4,10.5),
new makeTrial("trial283_",5,0.165,0.579,0.847,14.5,22.7,10.4),
new makeTrial("trial284_",4,0.513,0.306,0.529,22.1,22.7,21.2),
new makeTrial("trial285_",2,0.688,0.757,0.333,18.7,28.6,24.8),
new makeTrial("trial286_",2,0.509,0.826,0.26,20.2,17.3,20.2),
new makeTrial("trial287_",3,0.551,0.838,0.318,12,19.3,25.1),
new makeTrial("trial288_",6,0.243,0.738,0.278,20,17.3,24.5),
new makeTrial("trial289_",1,0.813,0.577,0.28,25.3,27.9,13.9),
new makeTrial("trial290_",3,0.708,0.795,0.256,21.4,24.1,18.9),
new makeTrial("trial291_",4,0.481,0.722,0.281,18.8,21.4,16.3),
new makeTrial("trial292_",2,0.592,0.841,0.257,20.4,24.8,19),
new makeTrial("trial293_",5,0.549,0.775,0.587,24.7,18.6,21.9),
new makeTrial("trial294_",2,0.666,0.199,0.202,15.4,20.3,24.2),
new makeTrial("trial295_",1,0.215,0.544,0.793,22.2,16.5,16.2),
new makeTrial("trial296_",5,0.31,0.83,0.654,18.3,12.2,23.4),
new makeTrial("trial297_",1,0.666,0.828,0.483,17.5,21.4,21.6),
new makeTrial("trial298_",1,0.205,0.403,0.461,21.1,27.5,16.7),
new makeTrial("trial299_",3,0.73,0.227,0.687,13.5,10.2,21),
new makeTrial("trial300_",2,0.246,0.744,0.271,21.7,21.9,17),
new makeTrial("trial301_",2,0.174,0.718,0.509,15.1,30,19.4),
new makeTrial("trial302_",4,0.329,0.73,0.331,17.1,19.4,11.5),
new makeTrial("trial303_",5,0.499,0.234,0.218,10.3,22.5,10.3),
new makeTrial("trial304_",5,0.502,0.236,0.523,22.4,23.8,13.3),
new makeTrial("trial305_",1,0.343,0.445,0.211,25.6,13,17.2),
new makeTrial("trial306_",2,0.253,0.182,0.405,18.8,16.4,21.5),
new makeTrial("trial307_",4,0.244,0.824,0.575,13.4,17.4,21.7),
new makeTrial("trial308_",1,0.23,0.518,0.439,25.9,19.3,21.9),
new makeTrial("trial309_",6,0.402,0.518,0.204,22.1,11.3,13.3),
new makeTrial("trial310_",4,0.78,0.788,0.198,18,19.4,18.3),
new makeTrial("trial311_",3,0.411,0.423,0.722,27.2,16.2,23.4),
new makeTrial("trial312_",3,0.547,0.673,0.16,16.6,16.5,12.9),
new makeTrial("trial313_",3,0.595,0.336,0.158,19.1,28.9,19.8),
new makeTrial("trial314_",4,0.403,0.533,0.81,21.4,16.7,24.7),
new makeTrial("trial315_",6,0.185,0.228,0.291,16.4,16,18.3),
new makeTrial("trial316_",2,0.554,0.46,0.669,18.6,23.5,19.2),
new makeTrial("trial317_",3,0.232,0.494,0.241,19.1,14.2,17),
new makeTrial("trial318_",3,0.439,0.501,0.489,21,11.6,19),
new makeTrial("trial319_",6,0.205,0.241,0.53,16.5,21.2,19.6),
new makeTrial("trial320_",3,0.719,0.765,0.44,24.7,18.6,22),
new makeTrial("trial321_",4,0.814,0.244,0.57,16.3,22.1,12.7),
new makeTrial("trial322_",4,0.653,0.333,0.191,27.2,21.6,26.7),
new makeTrial("trial323_",5,0.761,0.709,0.193,18.4,24.1,27.1),
new makeTrial("trial324_",6,0.178,0.418,0.701,21.6,19.4,17.3),
new makeTrial("trial325_",2,0.52,0.504,0.169,21.2,19.2,23.2),
new makeTrial("trial326_",4,0.578,0.344,0.498,15.2,18.1,18.3),
new makeTrial("trial327_",6,0.811,0.741,0.279,21.9,21.8,20),
new makeTrial("trial328_",1,0.283,0.19,0.244,28.4,14.5,19.8),
new makeTrial("trial329_",5,0.332,0.801,0.681,24.8,22.9,16.4),
new makeTrial("trial330_",5,0.173,0.821,0.508,19.3,23.5,18.5),
new makeTrial("trial331_",5,0.468,0.481,0.689,19.5,17.7,10.3),
new makeTrial("trial332_",4,0.534,0.568,0.3,11.7,11.7,27.8),
new makeTrial("trial333_",4,0.413,0.564,0.706,18.6,18.5,26.4),
new makeTrial("trial334_",3,0.431,0.838,0.436,23.5,15.6,14.5),
new makeTrial("trial335_",1,0.544,0.152,0.218,19.1,24.6,19.7),
new makeTrial("trial336_",1,0.284,0.587,0.485,19.7,17.6,28.3),
new makeTrial("trial337_",2,0.747,0.344,0.228,21.2,10.3,24.2),
new makeTrial("trial338_",4,0.227,0.539,0.668,24.6,29.9,29.2),
new makeTrial("trial339_",2,0.156,0.537,0.81,28.9,18,23.3),
new makeTrial("trial340_",1,0.717,0.213,0.26,18,12.3,24.6),
new makeTrial("trial341_",2,0.271,0.249,0.793,24,19.5,13.3),
new makeTrial("trial342_",3,0.293,0.314,0.33,11.4,29.7,15.4),
new makeTrial("trial343_",2,0.662,0.407,0.423,14.3,10.7,25.1),
new makeTrial("trial344_",4,0.254,0.167,0.582,18.2,23.9,13.3),
new makeTrial("trial345_",3,0.524,0.152,0.842,28,19.5,24.4),
new makeTrial("trial346_",6,0.475,0.216,0.719,19.3,11.6,18.7),
new makeTrial("trial347_",6,0.207,0.827,0.177,24.3,19.9,17.6),
new makeTrial("trial348_",6,0.329,0.534,0.845,23.8,20.2,22.9),
new makeTrial("trial349_",6,0.556,0.558,0.191,26.1,17.2,28.3),
new makeTrial("trial350_",4,0.323,0.257,0.414,19.7,22.6,24),
new makeTrial("trial351_",4,0.829,0.471,0.462,22.7,22.3,22),
new makeTrial("trial352_",4,0.431,0.435,0.222,17.9,20.7,10.1),
new makeTrial("trial353_",6,0.683,0.434,0.734,25.9,25.5,15.5),
new makeTrial("trial354_",6,0.251,0.418,0.28,22.1,23.2,13),
new makeTrial("trial355_",5,0.837,0.599,0.421,19.5,20.9,23.5),
new makeTrial("trial356_",5,0.339,0.598,0.407,25.4,12.6,26.5),
new makeTrial("trial357_",1,0.53,0.238,0.271,24.4,20.3,20.1),
new makeTrial("trial358_",3,0.578,0.773,0.587,27,14.2,20.5),
new makeTrial("trial359_",1,0.274,0.413,0.754,14.4,20.3,15.8),
new makeTrial("trial360_",6,0.19,0.664,0.178,28,28.1,19.7),
new makeTrial("trial361_",4,0.327,0.482,0.228,23.2,29.4,15.4),
new makeTrial("trial362_",3,0.345,0.302,0.251,13,25.8,17.3),
new makeTrial("trial363_",1,0.735,0.522,0.534,10,24.7,19.7),
new makeTrial("trial364_",1,0.233,0.572,0.481,24.9,19,10.1),
new makeTrial("trial365_",6,0.665,0.335,0.155,20.5,23.3,15.1),
new makeTrial("trial366_",5,0.211,0.816,0.171,13,20.6,27.6),
new makeTrial("trial367_",5,0.309,0.245,0.721,29.1,26.7,23.4),
new makeTrial("trial368_",6,0.732,0.776,0.512,20.9,19.4,13.9),
new makeTrial("trial369_",3,0.541,0.174,0.498,24,20,12.2),
new makeTrial("trial370_",2,0.798,0.452,0.441,23,18.9,20.8),
new makeTrial("trial371_",4,0.432,0.15,0.226,19.8,23.7,15.1),
new makeTrial("trial372_",5,0.741,0.584,0.798,21.2,19.4,23.6),
new makeTrial("trial373_",4,0.687,0.783,0.509,19.6,21.8,20.2),
new makeTrial("trial374_",2,0.556,0.421,0.232,12.6,22.4,21.2),
new makeTrial("trial375_",5,0.544,0.156,0.779,16.9,23.1,18.6),
new makeTrial("trial376_",4,0.507,0.493,0.531,21.8,13.2,18.9),
new makeTrial("trial377_",6,0.757,0.182,0.439,22.9,12.3,28.8),
new makeTrial("trial378_",5,0.404,0.55,0.153,21.1,17.6,10.5),
new makeTrial("trial379_",4,0.721,0.267,0.539,21,17,28.2),
new makeTrial("trial380_",2,0.599,0.699,0.457,17.8,23.2,18.3),
new makeTrial("trial381_",1,0.402,0.698,0.3,28.3,10.5,18.2),
new makeTrial("trial382_",3,0.277,0.49,0.308,16.6,27.5,26.8),
new makeTrial("trial383_",3,0.472,0.16,0.509,22.1,23.7,27.8),
new makeTrial("trial384_",2,0.514,0.785,0.437,18.7,22,19.4),
new makeTrial("trial385_",1,0.842,0.58,0.545,26.1,18.9,17.6),
new makeTrial("trial386_",1,0.537,0.592,0.472,15.9,15.1,23.1),
new makeTrial("trial387_",2,0.427,0.591,0.731,21.8,24,21),
new makeTrial("trial388_",6,0.258,0.276,0.684,17,21.9,19.8),
new makeTrial("trial389_",4,0.456,0.573,0.791,20.9,23.7,17.3),
new makeTrial("trial390_",5,0.721,0.725,0.262,23.9,21.8,18.5),
new makeTrial("trial391_",2,0.257,0.313,0.255,22.9,16.1,19.9),
new makeTrial("trial392_",1,0.828,0.312,0.717,22.5,22.1,13.2),
new makeTrial("trial393_",6,0.326,0.206,0.198,24.5,12.9,17.4),
new makeTrial("trial394_",3,0.425,0.808,0.521,24.8,15.5,23.9),
new makeTrial("trial395_",2,0.652,0.427,0.239,12.5,21.1,21.3),
new makeTrial("trial396_",2,0.78,0.158,0.295,12.2,16.9,27.7),
new makeTrial("trial397_",1,0.251,0.723,0.569,12.1,21.4,20.9),
new makeTrial("trial398_",5,0.413,0.768,0.466,24,10.2,23.2),
new makeTrial("trial399_",3,0.761,0.656,0.411,19.2,20.1,21.1),
new makeTrial("trial400_",6,0.19,0.263,0.729,17.5,22.5,17.4),
new makeTrial("trial401_",3,0.675,0.508,0.688,22,20.5,22.9),
new makeTrial("trial402_",4,0.67,0.583,0.578,16.6,28.3,26.8),
new makeTrial("trial403_",6,0.681,0.298,0.165,11.4,15.8,18.7),
new makeTrial("trial404_",6,0.744,0.509,0.593,26.2,26.1,21.3),
new makeTrial("trial405_",2,0.513,0.453,0.793,11.3,24.7,14.7),
new makeTrial("trial406_",2,0.219,0.833,0.164,28.4,13.1,18.3),
new makeTrial("trial407_",3,0.321,0.487,0.653,26.1,19.3,24.2),
new makeTrial("trial408_",4,0.53,0.183,0.595,22.5,29.1,26.3),
new makeTrial("trial409_",4,0.339,0.477,0.174,21.6,16.6,20),
new makeTrial("trial410_",3,0.157,0.807,0.665,23.1,19.6,21.2),
new makeTrial("trial411_",1,0.457,0.799,0.5,24.3,10.5,21.3),
new makeTrial("trial412_",2,0.681,0.159,0.721,11.8,19.5,24.4),
new makeTrial("trial413_",4,0.672,0.816,0.787,15.2,18.3,22.1),
new makeTrial("trial414_",5,0.518,0.402,0.711,19,10.4,15.4),
new makeTrial("trial415_",4,0.726,0.5,0.718,16.8,20.3,24.8),
new makeTrial("trial416_",6,0.78,0.755,0.744,30,26.6,27.4),
new makeTrial("trial417_",6,0.223,0.654,0.73,19.4,27,13.4),
new makeTrial("trial418_",1,0.184,0.759,0.582,21.6,26.6,14.6),
new makeTrial("trial419_",4,0.742,0.494,0.465,17,16.6,27.3),
new makeTrial("trial420_",5,0.554,0.24,0.175,26.4,15.2,15),
new makeTrial("trial421_",2,0.439,0.268,0.159,14.2,20.1,23.8),
new makeTrial("trial422_",5,0.158,0.533,0.419,17.4,18.3,18.6),
new makeTrial("trial423_",2,0.316,0.472,0.201,16.4,21.6,13.7),
new makeTrial("trial424_",3,0.238,0.54,0.185,15.3,24.6,20.6),
new makeTrial("trial425_",5,0.568,0.338,0.658,16.5,14.6,15.7),
new makeTrial("trial426_",4,0.169,0.781,0.509,11.3,24.3,18.5),
new makeTrial("trial427_",3,0.779,0.839,0.346,22,28,29.5),
new makeTrial("trial428_",4,0.749,0.655,0.329,10.9,20.2,19.2),
new makeTrial("trial429_",5,0.461,0.188,0.808,24.9,25.5,24.9),
new makeTrial("trial430_",4,0.785,0.241,0.303,24.3,23.5,11.3),
new makeTrial("trial431_",5,0.183,0.738,0.246,17.2,19.9,18.7),
new makeTrial("trial432_",4,0.503,0.785,0.582,10.5,14.8,10.6),
new makeTrial("trial433_",3,0.26,0.442,0.792,18.3,21.9,16.1),
new makeTrial("trial434_",3,0.468,0.678,0.754,18.5,16.5,21),
new makeTrial("trial435_",2,0.551,0.735,0.481,12,24.1,24.3),
new makeTrial("trial436_",6,0.758,0.671,0.442,24.4,18.2,27.7),
new makeTrial("trial437_",4,0.296,0.494,0.543,17.6,27,23.7),
new makeTrial("trial438_",1,0.745,0.283,0.338,16.1,24.2,21.7),
new makeTrial("trial439_",6,0.414,0.154,0.801,20.9,18.6,19.9),
new makeTrial("trial440_",6,0.791,0.591,0.737,23.7,17.3,21.1),
new makeTrial("trial441_",2,0.729,0.328,0.763,25.2,24.6,21.8),
new makeTrial("trial442_",5,0.758,0.332,0.223,17.6,19.9,17),
new makeTrial("trial443_",5,0.85,0.651,0.202,19.5,14.9,11.2),
new makeTrial("trial444_",3,0.172,0.514,0.499,26.1,20.4,20.8),
new makeTrial("trial445_",6,0.775,0.348,0.319,16.2,17.9,21.8),
new makeTrial("trial446_",4,0.178,0.789,0.702,26.5,18,15.1),
new makeTrial("trial447_",6,0.157,0.553,0.743,26.4,16.2,15.4),
new makeTrial("trial448_",4,0.685,0.587,0.329,10.3,24.2,20.2),
new makeTrial("trial449_",3,0.702,0.569,0.538,14.7,21.9,24.4),
new makeTrial("trial450_",2,0.689,0.817,0.171,17,16.7,13.6),
new makeTrial("trial451_",4,0.749,0.523,0.3,15.9,22.6,22.5),
new makeTrial("trial452_",2,0.206,0.402,0.297,21,12.1,20.7),
new makeTrial("trial453_",5,0.435,0.42,0.438,18.9,28.9,21.3),
new makeTrial("trial454_",4,0.707,0.746,0.713,22.4,11.6,11.9),
new makeTrial("trial455_",6,0.324,0.822,0.297,14.9,17,20.7),
new makeTrial("trial456_",3,0.339,0.763,0.458,21.6,20.6,18.3),
new makeTrial("trial457_",6,0.804,0.766,0.692,16.5,23.7,14),
new makeTrial("trial458_",4,0.563,0.442,0.548,19.3,16.7,20.2),
new makeTrial("trial459_",3,0.76,0.328,0.471,16.5,19.3,20),
new makeTrial("trial460_",1,0.452,0.848,0.57,13.8,15.8,21.6),
new makeTrial("trial461_",4,0.562,0.473,0.268,16.5,12.6,11.4),
new makeTrial("trial462_",5,0.73,0.667,0.314,19.1,21.3,11.2),
new makeTrial("trial463_",4,0.197,0.294,0.413,29.2,18.5,24.3),
new makeTrial("trial464_",2,0.179,0.28,0.75,21.6,14.9,16.5),
new makeTrial("trial465_",4,0.275,0.331,0.185,29,20.6,12.4),
new makeTrial("trial466_",3,0.807,0.414,0.187,20.3,16.3,17.7),
new makeTrial("trial467_",4,0.248,0.267,0.164,23.1,15.3,15.6),
new makeTrial("trial468_",2,0.44,0.19,0.543,10.8,26.4,25.9),
new makeTrial("trial469_",2,0.173,0.446,0.165,22.9,23.8,24.9),
new makeTrial("trial470_",6,0.207,0.848,0.199,22.9,15.7,19.5),
new makeTrial("trial471_",1,0.528,0.188,0.253,15.8,16.1,26.4),
new makeTrial("trial472_",5,0.493,0.244,0.75,27.7,22.7,17.4),
new makeTrial("trial473_",6,0.439,0.708,0.198,20,24.8,22.6),
new makeTrial("trial474_",3,0.514,0.284,0.218,17.8,16.9,15.4),
new makeTrial("trial475_",6,0.497,0.489,0.529,17.2,28.2,23.8),
new makeTrial("trial476_",3,0.45,0.238,0.297,12.2,18.9,13.9),
new makeTrial("trial477_",6,0.693,0.205,0.845,14.5,17.1,10.3),
new makeTrial("trial478_",5,0.742,0.23,0.83,18,17.2,15.1),
new makeTrial("trial479_",1,0.551,0.203,0.706,30,16.9,28.1),
new makeTrial("trial480_",5,0.537,0.522,0.781,24.9,11.9,22.1),
new makeTrial("trial481_",2,0.209,0.199,0.593,24.6,11,17.6),
new makeTrial("trial482_",5,0.504,0.549,0.229,16.1,17.5,15.1),
new makeTrial("trial483_",3,0.257,0.439,0.74,23.4,15.3,23.8),
new makeTrial("trial484_",6,0.183,0.564,0.323,24,17.3,27.4),
new makeTrial("trial485_",6,0.231,0.408,0.747,21.2,16.1,20.6),
new makeTrial("trial486_",3,0.716,0.74,0.592,24.9,17.7,24),
new makeTrial("trial487_",4,0.421,0.285,0.298,19.4,18.4,20),
new makeTrial("trial488_",2,0.663,0.529,0.681,25.5,19.3,22.9),
new makeTrial("trial489_",4,0.834,0.653,0.288,20.9,20.7,20.3),
new makeTrial("trial490_",3,0.458,0.742,0.566,18.4,21.5,29.3),
new makeTrial("trial491_",2,0.439,0.502,0.436,19.5,17.3,20.3),
new makeTrial("trial492_",4,0.848,0.792,0.207,19.6,23.3,16.4),
new makeTrial("trial493_",2,0.276,0.54,0.206,27.8,17.3,13.6),
new makeTrial("trial494_",5,0.469,0.714,0.56,22.1,22.4,11.7),
new makeTrial("trial495_",6,0.429,0.195,0.247,20.1,14.2,19.8),
new makeTrial("trial496_",3,0.574,0.202,0.523,22.7,24.9,17.5),
new makeTrial("trial497_",2,0.239,0.516,0.219,20.1,18.1,11.6),
new makeTrial("trial498_",5,0.326,0.286,0.7,23.3,12.6,26.1),
new makeTrial("trial499_",6,0.514,0.7,0.322,16.7,22.5,22.7),
new makeTrial("trial500_",2,0.68,0.293,0.836,18.6,24.5,15.3),
new makeTrial("trial501_",1,0.19,0.824,0.198,24.5,22,11.7),
new makeTrial("trial502_",6,0.301,0.326,0.275,23.9,15.8,18),
new makeTrial("trial503_",2,0.278,0.836,0.55,24,27.4,12.4),
new makeTrial("trial504_",4,0.684,0.335,0.745,19.7,22.3,23.7),
new makeTrial("trial505_",2,0.167,0.514,0.229,18.1,24.8,20.7),
new makeTrial("trial506_",1,0.812,0.495,0.317,22.3,20.7,14.8),
new makeTrial("trial507_",2,0.527,0.412,0.448,27.1,17,16.9),
new makeTrial("trial508_",2,0.457,0.821,0.683,14.5,27.9,18.1),
new makeTrial("trial509_",5,0.258,0.691,0.678,22.3,20.1,18),
new makeTrial("trial510_",2,0.518,0.242,0.725,22,13,29.4),
new makeTrial("trial511_",5,0.312,0.587,0.273,13,29.6,15),
new makeTrial("trial512_",4,0.425,0.168,0.821,15.6,19.1,14.2),
new makeTrial("trial513_",5,0.301,0.84,0.507,13.4,22,18.7),
new makeTrial("trial514_",5,0.233,0.747,0.792,18.5,18.2,18.5),
new makeTrial("trial515_",5,0.255,0.331,0.754,13.8,27.4,15.5),
new makeTrial("trial516_",2,0.489,0.726,0.321,18.2,26.9,16.2),
new makeTrial("trial517_",6,0.316,0.224,0.249,16.6,12.7,19.3),
new makeTrial("trial518_",6,0.251,0.76,0.705,20.8,24.7,23.1),
new makeTrial("trial519_",4,0.677,0.466,0.418,21.3,10.4,11),
new makeTrial("trial520_",4,0.553,0.665,0.217,27.3,21.1,10.2),
new makeTrial("trial521_",6,0.501,0.661,0.44,25.4,17,22.4),
new makeTrial("trial522_",5,0.435,0.847,0.564,14.4,22.4,19.1),
new makeTrial("trial523_",5,0.81,0.18,0.2,20.2,20.3,20.8),
new makeTrial("trial524_",2,0.462,0.209,0.151,29.7,17.4,19.3),
new makeTrial("trial525_",5,0.836,0.53,0.335,29.3,25,19.7),
new makeTrial("trial526_",4,0.688,0.293,0.476,16.2,22.1,24.8),
new makeTrial("trial527_",2,0.691,0.269,0.762,29.2,20.7,24),
new makeTrial("trial528_",2,0.826,0.748,0.245,16,18.3,24.5),
new makeTrial("trial529_",6,0.73,0.448,0.186,23.9,11.7,19.1),
new makeTrial("trial530_",5,0.534,0.721,0.263,10.5,19.1,10.5),
new makeTrial("trial531_",2,0.427,0.206,0.744,20.2,16.5,27.7),
new makeTrial("trial532_",5,0.264,0.716,0.308,15.5,17.7,14.7),
new makeTrial("trial533_",3,0.827,0.437,0.449,28.6,23.6,17.6),
new makeTrial("trial534_",6,0.443,0.59,0.172,24.3,21.5,21),
new makeTrial("trial535_",1,0.333,0.699,0.152,17.3,24.9,18.7),
new makeTrial("trial536_",4,0.209,0.572,0.467,21.2,15.1,21.8),
new makeTrial("trial537_",3,0.725,0.788,0.276,11.5,10.4,18.8),
new makeTrial("trial538_",6,0.588,0.28,0.523,18.4,16.1,19.4),
new makeTrial("trial539_",4,0.503,0.708,0.7,16.4,21.4,22.2),
new makeTrial("trial540_",5,0.15,0.413,0.747,13.6,18.4,17.6),
new makeTrial("trial541_",6,0.234,0.317,0.763,22.1,17.9,24.5),
new makeTrial("trial542_",1,0.152,0.306,0.313,19.8,19.7,15.5),
new makeTrial("trial543_",6,0.814,0.708,0.799,18.2,19.5,24.2),
new makeTrial("trial544_",3,0.697,0.318,0.277,23.8,15.7,24.8),
new makeTrial("trial545_",5,0.802,0.819,0.406,19.4,18.3,23.3),
new makeTrial("trial546_",6,0.348,0.67,0.167,23.4,19.9,19),
new makeTrial("trial547_",2,0.469,0.175,0.418,15.2,16.8,27.9),
new makeTrial("trial548_",1,0.191,0.445,0.427,20.3,23.7,19.9),
new makeTrial("trial549_",4,0.283,0.513,0.506,27.5,24.9,22.7),
new makeTrial("trial550_",2,0.406,0.561,0.749,29.8,20.3,26.7),
new makeTrial("trial551_",3,0.155,0.838,0.776,29.3,24.8,23.4),
new makeTrial("trial552_",6,0.819,0.416,0.348,20.4,21.9,13.3),
new makeTrial("trial553_",4,0.761,0.722,0.29,17.8,26.6,20.3),
new makeTrial("trial554_",3,0.215,0.505,0.247,17.5,18.7,17.4),
new makeTrial("trial555_",2,0.298,0.341,0.426,27.6,18.6,20.9),
new makeTrial("trial556_",5,0.429,0.405,0.172,21.9,17.9,14.5),
new makeTrial("trial557_",5,0.261,0.741,0.168,28.1,17.8,16.6),
new makeTrial("trial558_",6,0.327,0.735,0.787,28.4,22.3,15.8),
new makeTrial("trial559_",5,0.504,0.287,0.699,17.9,21.9,22.7),
new makeTrial("trial560_",5,0.262,0.248,0.27,22.5,23.5,24.6),
new makeTrial("trial561_",1,0.788,0.786,0.201,17.8,18.8,27.8),
new makeTrial("trial562_",2,0.42,0.201,0.751,17.7,24.6,23.3),
new makeTrial("trial563_",6,0.531,0.8,0.247,22.6,14.5,24.5),
new makeTrial("trial564_",4,0.805,0.714,0.292,19.2,29.7,15.8),
new makeTrial("trial565_",2,0.663,0.841,0.205,18.2,12.9,11.1),
new makeTrial("trial566_",5,0.845,0.318,0.798,13.5,23.3,10),
new makeTrial("trial567_",4,0.688,0.152,0.437,14.5,20.9,24.4),
new makeTrial("trial568_",6,0.454,0.213,0.5,15.8,21.6,15.5),
new makeTrial("trial569_",5,0.342,0.678,0.292,20.7,10.1,19.9),
new makeTrial("trial570_",1,0.173,0.579,0.767,17.4,25.3,11.9),
new makeTrial("trial571_",5,0.483,0.233,0.239,20.6,15.1,20.5),
new makeTrial("trial572_",4,0.436,0.585,0.328,23.9,18.1,29.7),
new makeTrial("trial573_",5,0.52,0.588,0.438,15,24.4,23.9),
new makeTrial("trial574_",6,0.433,0.684,0.841,17,18.7,18.3),
new makeTrial("trial575_",5,0.769,0.679,0.524,20.4,21.6,17.2),
new makeTrial("trial576_",1,0.416,0.694,0.714,16.1,16,18),
new makeTrial("trial577_",4,0.447,0.674,0.662,23.1,18.5,22.5),
new makeTrial("trial578_",4,0.207,0.407,0.681,17.9,22.5,20),
new makeTrial("trial579_",1,0.722,0.222,0.232,17.3,23.4,18.7),
new makeTrial("trial580_",3,0.303,0.584,0.428,23.6,22.9,14.5),
new makeTrial("trial581_",2,0.483,0.535,0.329,19.6,17.4,15.9),
new makeTrial("trial582_",4,0.24,0.316,0.525,28.6,23.4,23.5),
new makeTrial("trial583_",2,0.254,0.83,0.344,20.9,19.5,26.1),
new makeTrial("trial584_",2,0.205,0.493,0.253,13.5,21.8,17.6),
new makeTrial("trial585_",4,0.77,0.253,0.546,23.6,11,17.6),
new makeTrial("trial586_",5,0.776,0.717,0.479,21.2,19.9,15.1),
new makeTrial("trial587_",5,0.195,0.663,0.164,28.8,14,18.5),
new makeTrial("trial588_",2,0.162,0.198,0.41,27,22.3,21.3),
new makeTrial("trial589_",1,0.756,0.816,0.831,23.7,20.1,15.9),
new makeTrial("trial590_",1,0.807,0.725,0.751,15.9,24.3,24.7),
new makeTrial("trial591_",2,0.3,0.68,0.668,26,28.4,18.4),
new makeTrial("trial592_",3,0.818,0.434,0.829,19.5,28.3,17.3),
new makeTrial("trial593_",6,0.8,0.2,0.577,23.9,10.9,21.6),
new makeTrial("trial594_",3,0.324,0.773,0.222,29.2,23.1,22.5),
new makeTrial("trial595_",1,0.51,0.822,0.558,17.9,29.7,17.6),
new makeTrial("trial596_",5,0.801,0.584,0.799,16.1,24.8,28.7),
new makeTrial("trial597_",6,0.183,0.656,0.206,11,24.4,17.2),
new makeTrial("trial598_",5,0.831,0.456,0.575,19.8,22.3,15.8),
new makeTrial("trial599_",6,0.492,0.84,0.32,14.7,18.5,24),
new makeTrial("trial600_",3,0.228,0.17,0.187,16.2,23.3,24.9),
new makeTrial("trial601_",2,0.715,0.344,0.706,24.4,12.3,24.6),
new makeTrial("trial602_",1,0.567,0.658,0.445,22.4,29.7,15),
new makeTrial("trial603_",3,0.402,0.596,0.581,17,21.8,17),
new makeTrial("trial604_",1,0.669,0.553,0.458,18.6,21.2,20.5),
new makeTrial("trial605_",2,0.526,0.471,0.216,18.8,24.5,24.1),
new makeTrial("trial606_",5,0.718,0.814,0.666,20.8,22.5,23.5),
new makeTrial("trial607_",6,0.419,0.441,0.597,12.3,29.1,17.8),
new makeTrial("trial608_",5,0.71,0.552,0.655,17.3,13.6,15.9),
new makeTrial("trial609_",1,0.72,0.552,0.84,26.7,22.1,22.8),
new makeTrial("trial610_",6,0.835,0.441,0.206,21.6,22,13.6),
new makeTrial("trial611_",3,0.299,0.461,0.756,19.3,19.6,14.9),
new makeTrial("trial612_",6,0.76,0.504,0.714,21.4,16,25.9),
new makeTrial("trial613_",6,0.29,0.437,0.256,14.3,18.2,21.3),
new makeTrial("trial614_",4,0.798,0.514,0.744,17.5,17.8,27.5),
new makeTrial("trial615_",4,0.206,0.769,0.715,22.8,21.9,17.2),
new makeTrial("trial616_",6,0.348,0.847,0.162,16.2,10.3,24.9),
new makeTrial("trial617_",6,0.257,0.427,0.533,15.2,12.5,24.9),
new makeTrial("trial618_",2,0.17,0.652,0.259,18.6,22.2,22.3),
new makeTrial("trial619_",1,0.803,0.34,0.85,18.5,20.7,21.9),
new makeTrial("trial620_",6,0.734,0.702,0.469,19.4,19.7,21.2),
new makeTrial("trial621_",3,0.287,0.77,0.286,19.1,24.6,15.5),
new makeTrial("trial622_",4,0.513,0.778,0.838,15.6,23.7,21.9),
new makeTrial("trial623_",2,0.443,0.553,0.402,28.9,23.8,16.6),
new makeTrial("trial624_",1,0.265,0.542,0.828,15,16.3,17.5),
new makeTrial("trial625_",5,0.66,0.328,0.478,13.6,16.9,25.6),
new makeTrial("trial626_",2,0.76,0.491,0.289,17.5,24.2,19.6),
new makeTrial("trial627_",2,0.258,0.807,0.788,21.9,21.6,18.3),
new makeTrial("trial628_",2,0.32,0.467,0.835,25.8,18.2,24.1),
new makeTrial("trial629_",4,0.336,0.785,0.483,21.6,19.1,18.3),
new makeTrial("trial630_",5,0.437,0.801,0.299,22.7,30,20.5),
new makeTrial("trial631_",5,0.757,0.336,0.706,21.8,19.8,29.5),
new makeTrial("trial632_",2,0.453,0.236,0.217,20.2,19.9,16.8),
new makeTrial("trial633_",5,0.48,0.696,0.419,19.1,17.5,15.4),
new makeTrial("trial634_",6,0.182,0.439,0.18,25.9,26,26.1),
new makeTrial("trial635_",3,0.819,0.51,0.782,18.1,23.1,23.4),
new makeTrial("trial636_",1,0.833,0.327,0.242,21.2,22.8,18.1),
new makeTrial("trial637_",5,0.58,0.267,0.271,18.3,19.5,21),
new makeTrial("trial638_",3,0.456,0.718,0.324,13.2,21.4,13.5),
new makeTrial("trial639_",5,0.453,0.566,0.529,21.3,18.2,17.9),
new makeTrial("trial640_",4,0.569,0.411,0.514,22.2,24.1,26.4),
new makeTrial("trial641_",5,0.568,0.728,0.303,10.7,11.4,15.1),
new makeTrial("trial642_",6,0.545,0.553,0.313,21.3,29.1,18.6),
new makeTrial("trial643_",2,0.463,0.407,0.32,24,19.3,19.2),
new makeTrial("trial644_",4,0.454,0.282,0.401,18.2,15.2,19.1),
new makeTrial("trial645_",5,0.157,0.256,0.172,25.5,20.1,15),
new makeTrial("trial646_",4,0.444,0.424,0.341,21.7,23.3,19.4),
new makeTrial("trial647_",3,0.783,0.744,0.558,20.7,23.5,12.3),
new makeTrial("trial648_",6,0.839,0.439,0.819,12.6,22.1,21.2),
new makeTrial("trial649_",6,0.717,0.263,0.658,27.7,20.6,15.7),
new makeTrial("trial650_",3,0.567,0.573,0.832,16.8,22,24.9),
new makeTrial("trial651_",5,0.661,0.49,0.672,18.8,15.2,20.5),
new makeTrial("trial652_",2,0.311,0.196,0.726,14.5,19.7,23.6),
new makeTrial("trial653_",3,0.521,0.324,0.209,24.9,19.2,23.2),
new makeTrial("trial654_",5,0.716,0.55,0.419,18.1,24.1,14.7),
new makeTrial("trial655_",2,0.22,0.654,0.697,16.7,15.1,20.7),
new makeTrial("trial656_",2,0.441,0.718,0.185,15.7,16,27.7),
new makeTrial("trial657_",6,0.519,0.566,0.409,17.1,24.8,25.2),
new makeTrial("trial658_",4,0.187,0.696,0.823,25.9,21.5,23.7),
new makeTrial("trial659_",4,0.246,0.832,0.582,23.1,19.5,23.4),
new makeTrial("trial660_",6,0.432,0.514,0.683,19.6,15.1,23.8),
new makeTrial("trial661_",1,0.3,0.234,0.462,18.6,15.6,14.8),
new makeTrial("trial662_",6,0.328,0.786,0.824,22.8,20.5,20.3),
new makeTrial("trial663_",1,0.221,0.519,0.192,17.6,22.8,16.2),
new makeTrial("trial664_",5,0.521,0.589,0.755,15.4,19.2,18.2),
new makeTrial("trial665_",4,0.571,0.262,0.676,19.6,26.4,20.7),
new makeTrial("trial666_",6,0.697,0.286,0.822,18.9,20.5,21.9),
new makeTrial("trial667_",1,0.533,0.499,0.848,23.1,24.1,20.1),
new makeTrial("trial668_",6,0.272,0.579,0.311,15.3,27.5,16.8),
new makeTrial("trial669_",1,0.514,0.321,0.491,25.1,23.8,21.9),
new makeTrial("trial670_",3,0.516,0.658,0.811,13.6,24,18.9),
new makeTrial("trial671_",5,0.458,0.778,0.259,18,17.1,17.5),
new makeTrial("trial672_",1,0.165,0.685,0.558,19.5,21.8,23.2),
new makeTrial("trial673_",2,0.338,0.428,0.503,15.6,24.5,22.3),
new makeTrial("trial674_",4,0.771,0.77,0.743,22.4,11.9,20),
new makeTrial("trial675_",3,0.499,0.697,0.202,12.3,24.4,12.1),
new makeTrial("trial676_",4,0.305,0.502,0.692,13.3,21.7,14.8),
new makeTrial("trial677_",2,0.302,0.42,0.226,15.6,20.4,16),
new makeTrial("trial678_",1,0.716,0.157,0.814,11.3,26.1,19.8),
new makeTrial("trial679_",4,0.305,0.754,0.661,23.5,14.4,15.1),
new makeTrial("trial680_",2,0.472,0.764,0.755,22.2,20.4,18.8),
new makeTrial("trial681_",4,0.211,0.516,0.348,23.3,11.8,17.4),
new makeTrial("trial682_",5,0.714,0.537,0.433,15.5,26.9,15.7),
new makeTrial("trial683_",3,0.263,0.578,0.597,23,16.8,23.6),
new makeTrial("trial684_",1,0.192,0.177,0.486,13.5,23,16.8),
new makeTrial("trial685_",2,0.662,0.778,0.748,21.5,18.6,16.3),
new makeTrial("trial686_",5,0.163,0.425,0.731,19.5,21.4,22.7),
new makeTrial("trial687_",6,0.806,0.549,0.229,15.8,24.6,21.4),
new makeTrial("trial688_",4,0.459,0.726,0.209,23,15.2,25),
new makeTrial("trial689_",2,0.301,0.164,0.483,17.8,28.6,22.3),
new makeTrial("trial690_",1,0.544,0.777,0.334,18.8,21.2,21.2),
new makeTrial("trial691_",3,0.187,0.287,0.81,19.9,29.2,23.3),
new makeTrial("trial692_",5,0.31,0.307,0.787,16.7,15.7,22.9),
new makeTrial("trial693_",5,0.223,0.674,0.78,10.5,25.5,27),
new makeTrial("trial694_",3,0.157,0.33,0.737,23.8,20,18.2),
new makeTrial("trial695_",4,0.583,0.212,0.806,20.5,22.3,13.7),
new makeTrial("trial696_",4,0.334,0.161,0.526,20.6,17.7,23.3),
new makeTrial("trial697_",2,0.816,0.193,0.291,20,23.5,21.9),
new makeTrial("trial698_",4,0.58,0.299,0.797,25,16.2,20.9),
new makeTrial("trial699_",6,0.577,0.155,0.714,14.7,16.6,23.9),
new makeTrial("trial700_",4,0.758,0.551,0.589,28.9,17,10.8),
new makeTrial("trial701_",6,0.267,0.345,0.259,24.2,27.6,27.7),
new makeTrial("trial702_",3,0.707,0.69,0.183,17.4,22.7,10.5),
new makeTrial("trial703_",5,0.696,0.816,0.769,28.9,12.9,24.4),
new makeTrial("trial704_",2,0.292,0.512,0.292,20,13.6,12.2),
new makeTrial("trial705_",6,0.591,0.54,0.842,22.9,12.7,17.9),
new makeTrial("trial706_",4,0.727,0.748,0.758,16.4,12.4,21),
new makeTrial("trial707_",5,0.747,0.487,0.841,24.8,26.4,22.8),
new makeTrial("trial708_",5,0.342,0.448,0.214,23.9,24.4,19),
new makeTrial("trial709_",4,0.554,0.534,0.821,20.7,15.2,16),
new makeTrial("trial710_",1,0.784,0.201,0.416,14.2,18.5,24.5),
new makeTrial("trial711_",6,0.471,0.15,0.307,25.2,21.3,29.2),
new makeTrial("trial712_",6,0.213,0.544,0.449,10.6,17.1,22.2),
new makeTrial("trial713_",4,0.421,0.678,0.804,21.2,29.5,17.3),
new makeTrial("trial714_",5,0.838,0.574,0.31,21,13.5,29.3),
new makeTrial("trial715_",5,0.685,0.22,0.672,26.5,18.2,12.7),
new makeTrial("trial716_",4,0.523,0.757,0.789,18.2,17.5,10.4),
new makeTrial("trial717_",3,0.711,0.467,0.81,24.1,22.3,16),
new makeTrial("trial718_",6,0.484,0.172,0.721,20.2,20.9,16.6),
new makeTrial("trial719_",4,0.156,0.803,0.706,10.4,11.1,10.5),
new makeTrial("trial720_",1,0.836,0.418,0.548,23,11.9,19.5),
new makeTrial("trial721_",1,0.685,0.404,0.211,16.5,22,20.7),
new makeTrial("trial722_",1,0.527,0.683,0.653,23.9,15.9,24.8),
new makeTrial("trial723_",2,0.456,0.575,0.23,19.5,22.7,21.3),
new makeTrial("trial724_",6,0.683,0.661,0.659,24.9,20,11),
new makeTrial("trial725_",3,0.535,0.673,0.479,18.5,12.7,22),
new makeTrial("trial726_",6,0.465,0.177,0.501,10.5,24.4,22),
new makeTrial("trial727_",5,0.457,0.707,0.409,23.7,14.9,24.9),
new makeTrial("trial728_",3,0.74,0.215,0.449,18.9,16.2,10.3),
new makeTrial("trial729_",2,0.807,0.411,0.758,22.8,22.8,24.5),
new makeTrial("trial730_",2,0.664,0.461,0.315,25.9,21.9,16.3),
new makeTrial("trial731_",3,0.836,0.599,0.527,23.3,15.1,17.4),
new makeTrial("trial732_",1,0.56,0.788,0.654,15.7,17.6,23.7),
new makeTrial("trial733_",1,0.158,0.817,0.437,29.8,22.2,19.4),
new makeTrial("trial734_",1,0.571,0.54,0.7,27.5,19.2,18.2),
new makeTrial("trial735_",3,0.239,0.667,0.581,11.2,17,16.1),
new makeTrial("trial736_",5,0.694,0.446,0.827,24.8,22.3,16.5),
new makeTrial("trial737_",1,0.556,0.199,0.476,23.2,15.6,22.4),
new makeTrial("trial738_",6,0.405,0.231,0.584,19.9,17.9,20.9),
new makeTrial("trial739_",1,0.59,0.451,0.707,21.5,21.5,17),
new makeTrial("trial740_",3,0.232,0.243,0.547,25.4,22.6,17.5),
new makeTrial("trial741_",1,0.544,0.319,0.209,27.4,15.5,23.8),
new makeTrial("trial742_",6,0.662,0.816,0.327,19.1,15.2,15),
new makeTrial("trial743_",3,0.266,0.421,0.588,19.7,12.3,16.7),
new makeTrial("trial744_",5,0.514,0.29,0.468,25.4,22.4,20.5),
new makeTrial("trial745_",1,0.727,0.532,0.839,20.3,14.9,15),
new makeTrial("trial746_",2,0.698,0.17,0.435,26.8,15.2,18.9),
new makeTrial("trial747_",2,0.708,0.264,0.704,15.9,25.8,22.1),
new makeTrial("trial748_",2,0.769,0.429,0.65,14.9,29.7,19.5),
new makeTrial("trial749_",4,0.449,0.428,0.435,19,23,19.3),
new makeTrial("trial750_",4,0.768,0.286,0.188,19.3,26.9,13.5),
new makeTrial("trial751_",4,0.744,0.808,0.418,20.3,20.1,16.7),
new makeTrial("trial752_",6,0.824,0.536,0.538,18.8,19.4,24.6),
new makeTrial("trial753_",4,0.71,0.318,0.503,28.6,27.1,19.6),
new makeTrial("trial754_",5,0.171,0.53,0.769,27.7,22.4,17.1),
new makeTrial("trial755_",4,0.746,0.571,0.204,28.9,29.2,24.2),
new makeTrial("trial756_",5,0.205,0.313,0.247,21.4,24.8,22.8),
new makeTrial("trial757_",6,0.335,0.187,0.77,21.8,18.4,12.8),
new makeTrial("trial758_",1,0.845,0.337,0.323,17.6,18.7,23.6),
new makeTrial("trial759_",5,0.694,0.28,0.404,23.8,21.5,14.5),
new makeTrial("trial760_",1,0.561,0.267,0.581,26.1,20,21.9),
new makeTrial("trial761_",5,0.31,0.701,0.551,22.4,21.1,18.7),
new makeTrial("trial762_",1,0.588,0.249,0.293,23.4,17.2,27.7),
new makeTrial("trial763_",6,0.53,0.673,0.777,18.1,16.9,22.5),
new makeTrial("trial764_",6,0.585,0.71,0.306,15.8,19.1,20.2),
new makeTrial("trial765_",1,0.533,0.666,0.822,17.8,24.7,17.8),
new makeTrial("trial766_",2,0.543,0.817,0.557,14.7,16.4,20.3),
new makeTrial("trial767_",3,0.2,0.739,0.762,28.2,24.6,19.1),
new makeTrial("trial768_",1,0.422,0.313,0.172,15,21.1,11.1),
new makeTrial("trial769_",1,0.342,0.811,0.26,23.1,16.4,13),
new makeTrial("trial770_",2,0.187,0.445,0.539,21,22.9,21.4),
new makeTrial("trial771_",3,0.184,0.206,0.496,25.5,18.1,17.4),
new makeTrial("trial772_",2,0.55,0.209,0.666,22.6,21,21.8),
new makeTrial("trial773_",5,0.814,0.232,0.242,15.9,13.3,20.1),
new makeTrial("trial774_",2,0.505,0.776,0.668,10.7,13.3,22.7),
new makeTrial("trial775_",5,0.708,0.699,0.672,15.3,15.4,22),
new makeTrial("trial776_",2,0.233,0.271,0.677,25.3,24,15.6),
new makeTrial("trial777_",4,0.59,0.844,0.56,22.8,19.6,15.9),
new makeTrial("trial778_",3,0.724,0.491,0.425,29.7,24.9,19.6),
new makeTrial("trial779_",2,0.523,0.2,0.663,21.5,26.1,11.9),
new makeTrial("trial780_",3,0.426,0.426,0.412,22.6,18.3,14.9),
new makeTrial("trial781_",2,0.296,0.46,0.407,24.5,11.4,14.6),
new makeTrial("trial782_",5,0.225,0.496,0.567,26.9,24.6,20.6),
new makeTrial("trial783_",5,0.231,0.534,0.555,16.3,15.5,27.9),
new makeTrial("trial784_",5,0.274,0.673,0.489,11.8,16.8,21.8),
new makeTrial("trial785_",3,0.792,0.311,0.765,26.1,24.4,24.1),
new makeTrial("trial786_",5,0.189,0.349,0.476,25.3,19.6,16.3),
new makeTrial("trial787_",6,0.558,0.308,0.589,16.4,19.9,24),
new makeTrial("trial788_",4,0.817,0.72,0.843,12.8,19.7,23.5),
new makeTrial("trial789_",1,0.181,0.758,0.686,23.1,15.2,16.1),
new makeTrial("trial790_",2,0.217,0.312,0.507,12.9,22.7,13.9),
new makeTrial("trial791_",1,0.188,0.734,0.427,29.6,23.4,17.3),
new makeTrial("trial792_",2,0.746,0.664,0.822,22,20.6,21.8),
new makeTrial("trial793_",5,0.453,0.506,0.709,25.7,18.7,23),
new makeTrial("trial794_",2,0.185,0.796,0.766,27.9,19.5,21.6),
new makeTrial("trial795_",1,0.713,0.17,0.213,15.1,12.7,22.7),
new makeTrial("trial796_",1,0.776,0.488,0.505,21.8,17.5,22.4),
new makeTrial("trial797_",5,0.401,0.308,0.555,23.3,20.9,17.5),
new makeTrial("trial798_",5,0.169,0.701,0.156,17,16.2,21),
new makeTrial("trial799_",5,0.225,0.805,0.532,22.5,15.3,23.6),
new makeTrial("trial800_",4,0.457,0.34,0.818,14.5,16.4,19.8),
new makeTrial("trial801_",1,0.488,0.182,0.447,18.5,10.5,15.4),
new makeTrial("trial802_",3,0.738,0.309,0.671,25.5,20.5,20.2),
new makeTrial("trial803_",6,0.176,0.325,0.239,21.6,13.8,16.4),
new makeTrial("trial804_",5,0.656,0.425,0.339,23.7,19.8,24),
new makeTrial("trial805_",5,0.176,0.587,0.583,23.8,13.9,22.1),
new makeTrial("trial806_",5,0.785,0.217,0.194,26.2,17.1,13),
new makeTrial("trial807_",5,0.248,0.566,0.193,18.3,22.9,17.3),
new makeTrial("trial808_",3,0.567,0.263,0.457,16,27.7,17.7),
new makeTrial("trial809_",5,0.517,0.513,0.804,23,18,20.3),
new makeTrial("trial810_",1,0.761,0.693,0.823,23.2,20.4,18.3),
new makeTrial("trial811_",3,0.808,0.659,0.48,15.5,21.5,23.4),
new makeTrial("trial812_",5,0.496,0.519,0.56,17.4,29.1,24.4),
new makeTrial("trial813_",5,0.766,0.698,0.758,29.8,15.3,22.5),
new makeTrial("trial814_",5,0.495,0.579,0.656,22.7,24.6,26.3),
new makeTrial("trial815_",5,0.327,0.84,0.472,20.4,13.2,15.3),
new makeTrial("trial816_",2,0.231,0.72,0.71,24.7,26.4,18.3),
new makeTrial("trial817_",5,0.342,0.16,0.287,18.7,15,14.4),
new makeTrial("trial818_",3,0.226,0.683,0.575,15.1,20.4,18),
new makeTrial("trial819_",6,0.423,0.153,0.791,19.4,19.5,21.7),
new makeTrial("trial820_",6,0.287,0.667,0.276,22.2,24.8,18.6),
new makeTrial("trial821_",4,0.478,0.815,0.713,20.4,23.2,10.3),
new makeTrial("trial822_",4,0.15,0.822,0.739,23.1,19.8,25.2),
new makeTrial("trial823_",5,0.208,0.266,0.259,17,16,19.8),
new makeTrial("trial824_",2,0.247,0.253,0.219,13,21.3,22.9),
new makeTrial("trial825_",4,0.677,0.738,0.559,17.6,20.6,15.1),
new makeTrial("trial826_",2,0.794,0.465,0.338,23,22.6,15.9),
new makeTrial("trial827_",5,0.224,0.274,0.414,20.4,13.1,29.7),
new makeTrial("trial828_",1,0.276,0.312,0.691,24.8,18.4,24.5),
new makeTrial("trial829_",2,0.573,0.691,0.152,17.6,19.5,16.1),
new makeTrial("trial830_",4,0.346,0.727,0.443,18.7,25,15.4),
new makeTrial("trial831_",5,0.506,0.523,0.246,24.5,17.9,27),
new makeTrial("trial832_",3,0.278,0.172,0.559,22.3,24.4,18),
new makeTrial("trial833_",5,0.433,0.771,0.676,13.2,22.2,22.5),
new makeTrial("trial834_",3,0.832,0.783,0.779,12.6,25.5,17.1),
new makeTrial("trial835_",2,0.196,0.842,0.322,21.4,19.8,10.5),
new makeTrial("trial836_",1,0.162,0.282,0.752,24.1,22.7,22.2),
new makeTrial("trial837_",3,0.503,0.559,0.836,24.7,20.4,23.9),
new makeTrial("trial838_",1,0.192,0.348,0.56,19.5,18,24),
new makeTrial("trial839_",6,0.205,0.849,0.457,10.4,22,22),
new makeTrial("trial840_",5,0.728,0.435,0.4,26.6,18.3,19.5),
new makeTrial("trial841_",5,0.708,0.48,0.18,20.5,16.6,15.3),
new makeTrial("trial842_",1,0.799,0.26,0.409,24.9,21.3,23.8),
new makeTrial("trial843_",3,0.731,0.596,0.813,15.8,20.7,15.1),
new makeTrial("trial844_",4,0.447,0.652,0.56,21.7,16,24.2),
new makeTrial("trial845_",1,0.189,0.562,0.735,24.2,21.3,16.7),
new makeTrial("trial846_",3,0.283,0.489,0.509,24.5,22.1,15.5),
new makeTrial("trial847_",6,0.723,0.776,0.45,18.4,23.8,20.6),
new makeTrial("trial848_",4,0.751,0.726,0.502,22.8,26,24.3),
new makeTrial("trial849_",6,0.232,0.181,0.555,28.7,13.4,21.2),
new makeTrial("trial850_",6,0.825,0.803,0.191,20.8,15.9,24.8),
new makeTrial("trial851_",4,0.821,0.225,0.255,23.2,10.7,26.1),
new makeTrial("trial852_",4,0.519,0.67,0.206,29,24,17.2),
new makeTrial("trial853_",4,0.794,0.266,0.531,18.4,18.3,21.4),
new makeTrial("trial854_",4,0.327,0.193,0.263,14.4,24.4,24.6),
new makeTrial("trial855_",3,0.294,0.518,0.546,12.4,16.1,24.8),
new makeTrial("trial856_",2,0.484,0.481,0.804,11.6,28.5,12.3),
new makeTrial("trial857_",1,0.41,0.599,0.151,28.3,17.6,23.8),
new makeTrial("trial858_",2,0.795,0.216,0.485,16.3,23.1,15.7),
new makeTrial("trial859_",4,0.848,0.299,0.545,17.9,17.6,19.6),
new makeTrial("trial860_",4,0.837,0.796,0.329,23.2,18,17.1),
new makeTrial("trial861_",3,0.779,0.496,0.511,22.1,22,21.6),
new makeTrial("trial862_",4,0.459,0.74,0.407,25.5,21.5,24.4),
new makeTrial("trial863_",1,0.589,0.239,0.559,22.5,23.5,22.1),
new makeTrial("trial864_",2,0.573,0.476,0.46,23.8,24.9,19),
new makeTrial("trial865_",2,0.511,0.799,0.443,21.5,20.2,23.7),
new makeTrial("trial866_",4,0.248,0.766,0.49,17.8,20,24.9),
new makeTrial("trial867_",5,0.177,0.501,0.242,24.4,24.7,23.6),
new makeTrial("trial868_",1,0.787,0.469,0.153,18.9,20.2,21.5),
new makeTrial("trial869_",2,0.542,0.484,0.501,16.9,14.8,23.5),
new makeTrial("trial870_",2,0.19,0.522,0.677,17.2,28.1,13.6),
new makeTrial("trial871_",6,0.329,0.317,0.745,19.4,15.6,23.5),
new makeTrial("trial872_",4,0.225,0.231,0.525,10.6,18.3,28),
new makeTrial("trial873_",2,0.305,0.575,0.315,13.7,25.2,26.3),
new makeTrial("trial874_",2,0.281,0.222,0.331,29,25.7,22.8),
new makeTrial("trial875_",3,0.508,0.314,0.311,10.7,26.9,13.3),
new makeTrial("trial876_",1,0.318,0.25,0.515,14.7,15.3,18.4),
new makeTrial("trial877_",3,0.301,0.558,0.253,15.4,26.1,18.7),
new makeTrial("trial878_",6,0.413,0.847,0.183,16.1,19.4,22.9),
new makeTrial("trial879_",3,0.404,0.438,0.241,17.4,17.8,13.4),
new makeTrial("trial880_",1,0.411,0.746,0.182,21.2,10.6,18.1),
new makeTrial("trial881_",6,0.562,0.307,0.466,13.6,25.5,23.6),
new makeTrial("trial882_",6,0.736,0.289,0.254,19.9,23.2,22.6),
new makeTrial("trial883_",2,0.452,0.514,0.2,25.7,20.3,21.7),
new makeTrial("trial884_",6,0.78,0.846,0.727,27.9,20.3,20.1),
new makeTrial("trial885_",5,0.706,0.185,0.848,24.5,23.8,20.4),
new makeTrial("trial886_",2,0.472,0.689,0.598,23.9,22.9,12.1),
new makeTrial("trial887_",1,0.511,0.471,0.43,11.7,20.4,22.7),
new makeTrial("trial888_",3,0.576,0.153,0.585,15.2,27.4,15.4),
new makeTrial("trial889_",6,0.326,0.493,0.533,23.6,27.6,13.8),
new makeTrial("trial890_",1,0.805,0.732,0.442,19.6,20.1,16.3),
new makeTrial("trial891_",2,0.755,0.554,0.168,21.8,14.3,25.5),
new makeTrial("trial892_",1,0.274,0.293,0.423,24,29.3,21.7),
new makeTrial("trial893_",3,0.739,0.236,0.759,15.8,26.2,21.9),
new makeTrial("trial894_",4,0.551,0.704,0.494,16.9,15.6,29.7),
new makeTrial("trial895_",1,0.181,0.283,0.496,17.6,19,20.8),
new makeTrial("trial896_",4,0.493,0.73,0.414,22.3,18.2,29.9),
new makeTrial("trial897_",3,0.173,0.35,0.836,20,15.1,16.5),
new makeTrial("trial898_",2,0.681,0.523,0.76,12.2,17.8,27),
new makeTrial("trial899_",5,0.836,0.251,0.251,24.7,15.1,22.9),
new makeTrial("trial900_",1,0.188,0.549,0.547,14.9,12,22.2),
new makeTrial("trial901_",1,0.789,0.82,0.256,21.9,17.2,28.7),
new makeTrial("trial902_",4,0.565,0.459,0.749,23.5,29.3,10.1),
new makeTrial("trial903_",6,0.824,0.46,0.416,18,19.1,22.4),
new makeTrial("trial904_",4,0.816,0.421,0.201,13.9,18.8,21.5),
new makeTrial("trial905_",1,0.683,0.813,0.315,27.7,18.3,13.5),
new makeTrial("trial906_",6,0.545,0.228,0.74,19.9,18.6,19.7),
new makeTrial("trial907_",3,0.451,0.413,0.243,23.9,18.7,22.2),
new makeTrial("trial908_",3,0.775,0.217,0.226,12,11.6,22.8),
new makeTrial("trial909_",2,0.348,0.275,0.693,25.4,10.6,19.3),
new makeTrial("trial910_",3,0.467,0.755,0.156,15.3,11.9,16.4),
new makeTrial("trial911_",2,0.717,0.241,0.757,22.2,12.1,16),
new makeTrial("trial912_",3,0.512,0.152,0.758,12.4,29.7,27.9),
new makeTrial("trial913_",2,0.406,0.83,0.481,23.9,25.9,16.6),
new makeTrial("trial914_",3,0.571,0.575,0.754,20.4,22,20.3),
new makeTrial("trial915_",4,0.32,0.775,0.575,26.1,22.1,17.8),
new makeTrial("trial916_",5,0.348,0.508,0.591,21.4,27,15.5),
new makeTrial("trial917_",6,0.583,0.782,0.416,19.8,17.2,15),
new makeTrial("trial918_",4,0.817,0.529,0.182,22.1,21.5,24.2),
new makeTrial("trial919_",3,0.809,0.695,0.223,27.7,20.9,11.2),
new makeTrial("trial920_",1,0.182,0.33,0.775,23.1,22,14.9),
new makeTrial("trial921_",3,0.259,0.462,0.328,27.5,20.5,26.9),
new makeTrial("trial922_",6,0.767,0.431,0.402,21.2,24.3,24.8),
new makeTrial("trial923_",4,0.164,0.205,0.651,28.6,19,28.6),
new makeTrial("trial924_",3,0.514,0.489,0.523,20.8,12.3,24.2),
new makeTrial("trial925_",2,0.838,0.153,0.471,13.1,22.7,17.5),
new makeTrial("trial926_",4,0.767,0.466,0.429,21.1,16.6,17.2),
new makeTrial("trial927_",6,0.765,0.727,0.552,15.7,15.6,17.7),
new makeTrial("trial928_",4,0.18,0.846,0.597,20.4,17.5,22.1),
new makeTrial("trial929_",6,0.652,0.221,0.674,21.4,24.2,21.9),
new makeTrial("trial930_",4,0.694,0.524,0.281,15.6,16.9,21.2),
new makeTrial("trial931_",6,0.774,0.504,0.438,21.7,20.3,21.8),
new makeTrial("trial932_",5,0.228,0.251,0.228,11.6,17.1,16.5),
new makeTrial("trial933_",3,0.453,0.84,0.229,29.7,19.5,19.5),
new makeTrial("trial934_",1,0.164,0.277,0.741,21.7,23.7,22.1),
new makeTrial("trial935_",6,0.728,0.592,0.503,28.6,19.5,23.5),
new makeTrial("trial936_",2,0.455,0.823,0.699,28.5,15.1,27.4),
new makeTrial("trial937_",4,0.471,0.3,0.667,20.6,17.9,17.1),
new makeTrial("trial938_",4,0.784,0.326,0.179,23.9,19.2,21.8),
new makeTrial("trial939_",4,0.591,0.802,0.731,22,24.2,20.2),
new makeTrial("trial940_",1,0.762,0.521,0.401,15.3,21.5,28.7),
new makeTrial("trial941_",4,0.417,0.821,0.2,19.3,12.9,20.3),
new makeTrial("trial942_",6,0.829,0.506,0.593,17,26,17.4),
new makeTrial("trial943_",4,0.282,0.665,0.23,22.7,17.6,24.2),
new makeTrial("trial944_",1,0.844,0.781,0.276,10.7,25.4,19.2),
new makeTrial("trial945_",1,0.668,0.478,0.546,12.5,23.4,22.1),
new makeTrial("trial946_",2,0.704,0.406,0.47,18.5,22.4,23.6),
new makeTrial("trial947_",4,0.544,0.165,0.264,20.1,10.5,21.1),
new makeTrial("trial948_",1,0.472,0.191,0.818,22.5,25.6,22.1),
new makeTrial("trial949_",6,0.731,0.222,0.406,18.7,27.6,14.5),
new makeTrial("trial950_",6,0.226,0.574,0.548,26,22.4,27.3),
new makeTrial("trial951_",5,0.807,0.415,0.784,22.3,16.3,23.6),
new makeTrial("trial952_",2,0.815,0.185,0.326,20.9,10.3,16.8),
new makeTrial("trial953_",4,0.54,0.245,0.769,29.5,21.4,16.1),
new makeTrial("trial954_",5,0.344,0.724,0.821,16.8,13,22.8),
new makeTrial("trial955_",6,0.567,0.661,0.155,22.8,20.4,10.2),
new makeTrial("trial956_",2,0.509,0.669,0.827,16.4,29.5,18.1),
new makeTrial("trial957_",6,0.847,0.402,0.774,20.2,16,16.1),
new makeTrial("trial958_",5,0.223,0.668,0.6,19.7,22.7,21),
new makeTrial("trial959_",3,0.548,0.521,0.841,12.8,12.1,23.8),
new makeTrial("trial960_",3,0.682,0.692,0.801,24.4,18.6,22.9),
new makeTrial("trial961_",5,0.161,0.537,0.261,11.7,14.5,20.1),
new makeTrial("trial962_",3,0.313,0.421,0.44,15.5,15.8,23),
new makeTrial("trial963_",6,0.659,0.462,0.757,16.5,13.5,22.5),
new makeTrial("trial964_",5,0.554,0.726,0.173,10.8,26.1,17.2),
new makeTrial("trial965_",2,0.723,0.325,0.741,28,16.3,17.1),
new makeTrial("trial966_",4,0.447,0.499,0.411,19.8,21.3,13.3),
new makeTrial("trial967_",6,0.717,0.77,0.73,25.9,22.5,20.6),
new makeTrial("trial968_",3,0.424,0.586,0.835,19,19.7,23),
new makeTrial("trial969_",4,0.848,0.743,0.743,23.6,23.5,23.7),
new makeTrial("trial970_",3,0.179,0.319,0.295,28,23.8,18.1),
new makeTrial("trial971_",5,0.227,0.684,0.196,16.9,23.9,17.4),
new makeTrial("trial972_",2,0.203,0.664,0.429,20.4,24.2,17.4),
new makeTrial("trial973_",3,0.732,0.168,0.567,18.9,26.1,15.5),
new makeTrial("trial974_",1,0.688,0.689,0.494,21.3,23.4,21),
new makeTrial("trial975_",2,0.815,0.304,0.832,20.4,24.4,19.2),
new makeTrial("trial976_",5,0.576,0.423,0.219,21.1,10.3,24.3),
new makeTrial("trial977_",1,0.741,0.453,0.513,21,12.5,13.5),
new makeTrial("trial978_",1,0.27,0.337,0.495,26.1,22.9,14.2),
new makeTrial("trial979_",3,0.34,0.208,0.688,20,15.9,20),
new makeTrial("trial980_",5,0.267,0.504,0.275,29.8,24.8,23),
new makeTrial("trial981_",2,0.836,0.224,0.716,15.8,18.6,18.7),
new makeTrial("trial982_",1,0.808,0.312,0.255,20.6,15,13.4),
new makeTrial("trial983_",5,0.776,0.785,0.8,17,15,10.7),
new makeTrial("trial984_",5,0.225,0.47,0.162,23.6,24.7,19.5),
new makeTrial("trial985_",4,0.409,0.202,0.849,24.5,26.5,18.1),
new makeTrial("trial986_",1,0.176,0.155,0.574,15.9,15.6,19.9),
new makeTrial("trial987_",3,0.243,0.342,0.44,21.8,14,16.5),
new makeTrial("trial988_",2,0.336,0.718,0.181,23.3,18.2,18.5),
new makeTrial("trial989_",5,0.834,0.726,0.576,15.7,22.4,24.1),
new makeTrial("trial990_",2,0.538,0.784,0.285,17.4,11.4,15.1),
new makeTrial("trial991_",6,0.54,0.203,0.568,26.3,24.8,15.9),
new makeTrial("trial992_",2,0.721,0.175,0.485,15.2,15.7,26.6),
new makeTrial("trial993_",2,0.736,0.202,0.595,21.5,10.8,17),
new makeTrial("trial994_",4,0.704,0.848,0.589,19.5,24.9,14.9),
new makeTrial("trial995_",3,0.478,0.326,0.22,22.1,18.4,27.7),
new makeTrial("trial996_",4,0.159,0.792,0.582,23.7,19.4,26.2),
new makeTrial("trial997_",6,0.555,0.197,0.805,19.9,15.9,24.8),
new makeTrial("trial998_",6,0.691,0.684,0.433,19.4,17.5,20.9),
new makeTrial("trial999_",5,0.246,0.283,0.479,16.6,16,29.5)
]);

var cond2_trialpool = shuffle([
new makeTrial("trial0_",5,0.873,0.414,0.466,7.95,8.82,1.57),
new makeTrial("trial1_",2,0.189,0.406,0.418,7.38,94.1,5.75),
new makeTrial("trial2_",3,0.505,0.482,0.585,7.44,8.63,46.5),
new makeTrial("trial3_",5,0.887,0.502,0.582,95.2,94.9,4.5),
new makeTrial("trial4_",4,0.155,0.0833,0.0389,94.2,48.2,46.7),
new makeTrial("trial5_",2,0.0084,0.0355,0.453,5.88,4.53,47.5),
new makeTrial("trial6_",4,0.468,0.47,0.986,96.8,3.4,91.3),
new makeTrial("trial7_",5,0.846,0.447,0.559,99.9,96,95.8),
new makeTrial("trial8_",5,0.59,0.559,0.572,2.54,94.6,8.41),
new makeTrial("trial9_",3,0.46,0.579,0.876,53.3,93.1,6.4),
new makeTrial("trial10_",6,0.903,0.455,0.863,1.69,98.8,98),
new makeTrial("trial11_",4,0.805,0.0909,0.543,6.4,50.3,52.9),
new makeTrial("trial12_",1,0.824,0.873,0.878,2.32,97.4,45.4),
new makeTrial("trial13_",4,0.958,0.408,0.588,92,91.1,6.35),
new makeTrial("trial14_",2,0.0729,0.432,0.415,50.6,51.9,93.2),
new makeTrial("trial15_",2,0.881,0.466,0.2,2.88,46.3,53.5),
new makeTrial("trial16_",3,0.551,0.441,0.106,48.6,52.7,99.8),
new makeTrial("trial17_",4,0.515,0.523,0.522,91.3,98,47.9),
new makeTrial("trial18_",2,0.53,0.413,0.57,52.1,8.34,96),
new makeTrial("trial19_",6,0.562,0.183,0.199,9.45,96.4,2.8),
new makeTrial("trial20_",4,0.494,0.494,0.936,93.1,92.9,98.7),
new makeTrial("trial21_",3,0.559,0.421,0.844,97.2,5.04,51.3),
new makeTrial("trial22_",4,0.523,0.473,0.456,53.6,1.95,7.28),
new makeTrial("trial23_",3,0.537,0.555,0.522,1.23,45.4,94.7),
new makeTrial("trial24_",5,0.0499,0.952,0.543,48.2,96.1,93),
new makeTrial("trial25_",4,0.519,0.554,0.521,4.71,99,52.1),
new makeTrial("trial26_",2,0.509,0.808,0.457,90.4,7.13,4.36),
new makeTrial("trial27_",6,0.439,0.916,0.492,48.7,99.2,54.5),
new makeTrial("trial28_",4,0.481,0.1,0.527,8.68,49.7,45.7),
new makeTrial("trial29_",4,0.599,0.195,0.537,91.5,52.2,2.81),
new makeTrial("trial30_",3,0.921,0.832,0.945,4.54,2.65,93),
new makeTrial("trial31_",4,0.448,0.515,0.591,90.5,7.92,45.1),
new makeTrial("trial32_",3,0.112,0.185,0.52,6.97,3.07,4.36),
new makeTrial("trial33_",2,0.452,0.569,0.409,97.1,50.1,48.3),
new makeTrial("trial34_",1,0.15,0.582,0.987,4.09,45.3,52.7),
new makeTrial("trial35_",3,0.54,0.933,0.41,98.7,46,54.9),
new makeTrial("trial36_",4,0.133,0.487,0.0858,55,54.2,6.86),
new makeTrial("trial37_",4,0.807,0.857,0.426,8.63,52.9,99.7),
new makeTrial("trial38_",6,0.401,0.881,0.933,46.8,47.4,93.3),
new makeTrial("trial39_",3,0.955,0.527,0.481,99.9,93.4,5.31),
new makeTrial("trial40_",1,0.4,0.0691,0.41,2.96,45.3,94.8),
new makeTrial("trial41_",6,0.467,0.41,0.0427,90.8,93.8,5.13),
new makeTrial("trial42_",4,0.506,0.485,0.44,5.63,91.3,52.3),
new makeTrial("trial43_",2,0.187,0.195,0.513,53.1,53.3,95.3),
new makeTrial("trial44_",5,0.446,0.406,0.921,4.68,45.9,94.1),
new makeTrial("trial45_",4,0.151,0.129,0.909,92.2,96.3,2.66),
new makeTrial("trial46_",5,0.539,0.465,0.525,47.5,45.8,54.8),
new makeTrial("trial47_",5,0.514,0.491,0.533,48.2,0.616,50.5),
new makeTrial("trial48_",1,0.457,0.957,0.594,95.4,52.3,6.02),
new makeTrial("trial49_",2,0.922,0.58,0.578,9.07,98.7,8.49),
new makeTrial("trial50_",5,0.802,0.509,0.483,95.4,99.4,51.4),
new makeTrial("trial51_",6,0.806,0.588,0.426,93.3,51.4,52),
new makeTrial("trial52_",2,0.459,0.459,0.574,46.1,53,49.4),
new makeTrial("trial53_",4,0.859,0.571,0.0611,9.26,50.9,49.1),
new makeTrial("trial54_",6,0.403,0.107,0.599,99.9,93.5,50.8),
new makeTrial("trial55_",1,0.588,0.98,0.428,2.94,8.7,48.5),
new makeTrial("trial56_",2,0.169,0.579,0.46,95.6,1.86,95.8),
new makeTrial("trial57_",3,0.488,0.518,0.0353,1.13,96.5,46.1),
new makeTrial("trial58_",1,0.438,0.575,0.59,95.7,50,6.97),
new makeTrial("trial59_",6,0.553,0.505,0.0581,5.47,92.1,97.7),
new makeTrial("trial60_",2,0.427,0.543,0.937,90.7,53.1,54.3),
new makeTrial("trial61_",5,0.18,0.565,0.0443,97.6,54.6,93.3),
new makeTrial("trial62_",3,0.815,0.162,0.567,53.2,46,4.3),
new makeTrial("trial63_",2,0.422,0.83,0.861,47.2,0.818,50),
new makeTrial("trial64_",3,0.477,0.53,0.841,94.6,97.4,8.01),
new makeTrial("trial65_",4,0.565,0.514,0.556,47.2,47.4,91.8),
new makeTrial("trial66_",3,0.0455,0.511,0.505,5.89,1.15,98.1),
new makeTrial("trial67_",3,0.864,0.99,0.581,49.5,95.1,8.86),
new makeTrial("trial68_",1,0.51,0.57,0.531,6.22,8.59,94.7),
new makeTrial("trial69_",6,0.404,0.423,0.577,99.2,53.6,100),
new makeTrial("trial70_",6,0.0169,0.873,0.548,53.7,49.9,6.14),
new makeTrial("trial71_",5,0.531,0.449,0.0516,0.618,98.6,91.1),
new makeTrial("trial72_",5,0.0965,0.514,0.434,1.53,98.4,46.6),
new makeTrial("trial73_",2,0.0883,0.576,0.561,4.9,91.5,51.7),
new makeTrial("trial74_",3,0.413,0.903,0.426,97.7,6,5.32),
new makeTrial("trial75_",2,0.559,0.575,0.476,45.2,96.9,46.4),
new makeTrial("trial76_",4,0.472,0.591,0.569,97.3,53.3,97.8),
new makeTrial("trial77_",4,0.832,0.539,0.532,95.3,3.31,8.28),
new makeTrial("trial78_",2,0.564,0.478,0.584,1.45,51.5,8.75),
new makeTrial("trial79_",6,0.888,0.434,0.559,0.71,99.7,2.51),
new makeTrial("trial80_",4,0.0533,0.539,0.859,93.4,48.1,99.2),
new makeTrial("trial81_",4,0.047,0.0118,0.0122,3.23,0.593,9.85),
new makeTrial("trial82_",4,0.134,0.00843,0.586,8.19,3.92,48.3),
new makeTrial("trial83_",1,0.0232,0.984,0.559,48.2,0.0728,48.8),
new makeTrial("trial84_",4,0.0762,0.425,0.489,49.4,3.48,47.8),
new makeTrial("trial85_",1,0.0505,0.947,0.566,49.6,53.8,0.558),
new makeTrial("trial86_",2,0.0881,0.417,0.0189,51.1,6.14,47.3),
new makeTrial("trial87_",2,0.0398,0.529,0.102,97.8,48.8,99),
new makeTrial("trial88_",1,0.515,0.573,0.84,50.6,48,5.37),
new makeTrial("trial89_",1,0.993,0.408,0.807,49.1,47.9,46.1),
new makeTrial("trial90_",2,0.844,0.519,0.898,8.67,93.2,48.5),
new makeTrial("trial91_",6,0.521,0.873,0.456,90.7,90.6,90),
new makeTrial("trial92_",2,0.853,0.43,0.488,5.66,51.1,52.2),
new makeTrial("trial93_",4,0.0931,0.498,0.44,94.1,49.5,97.3),
new makeTrial("trial94_",6,0.873,0.512,0.59,97,96.2,46.5),
new makeTrial("trial95_",6,0.833,0.584,0.986,97,2.06,97.4),
new makeTrial("trial96_",4,0.0964,0.427,0.0272,54.1,52.4,5.37),
new makeTrial("trial97_",5,0.0036,0.0686,0.481,4.28,9.38,93.8),
new makeTrial("trial98_",5,0.529,0.149,0.884,46.4,1.1,95.5),
new makeTrial("trial99_",1,0.494,0.883,0.0552,1.77,95.1,90.9),
new makeTrial("trial100_",2,0.939,0.451,0.478,54.9,90.4,2.33),
new makeTrial("trial101_",5,0.938,0.971,0.547,97.2,54.2,49.3),
new makeTrial("trial102_",4,0.573,0.476,0.578,47.9,94.3,51.1),
new makeTrial("trial103_",6,0.102,0.406,0.511,93.4,98.8,45.9),
new makeTrial("trial104_",3,0.811,0.482,0.404,90.1,47.6,90.2),
new makeTrial("trial105_",1,0.522,0.503,0.551,53.4,96.4,91.3),
new makeTrial("trial106_",5,0.513,0.18,0.937,48.8,4.95,91.6),
new makeTrial("trial107_",1,0.589,0.0456,0.166,54.5,90,94.6),
new makeTrial("trial108_",2,0.551,0.587,0.529,5.62,96,91.3),
new makeTrial("trial109_",3,0.0349,0.571,0.184,54.7,50.9,7.41),
new makeTrial("trial110_",4,0.445,0.863,0.909,94.7,99.8,0.0559),
new makeTrial("trial111_",2,0.931,0.521,0.133,4.68,53.1,52.8),
new makeTrial("trial112_",2,0.122,0.438,0.567,90.9,45.9,1.79),
new makeTrial("trial113_",2,0.401,0.535,0.143,1.62,51.9,47.2),
new makeTrial("trial114_",4,0.174,0.445,0.418,46.6,53.4,95.3),
new makeTrial("trial115_",3,0.0831,0.519,0.962,49,46.2,92.1),
new makeTrial("trial116_",2,0.549,0.57,0.0707,94.4,45.9,92.8),
new makeTrial("trial117_",3,0.493,0.956,0.84,1.64,45.7,2.87),
new makeTrial("trial118_",4,0.94,0.895,0.512,98.9,8.45,97.9),
new makeTrial("trial119_",5,0.561,0.521,0.526,53.9,97.9,4.01),
new makeTrial("trial120_",1,0.502,0.6,0.0986,47.6,7.88,0.958),
new makeTrial("trial121_",3,0.581,0.598,0.851,47,49.2,47.9),
new makeTrial("trial122_",3,0.509,0.428,0.404,4.56,8.84,93.8),
new makeTrial("trial123_",1,0.983,0.0482,0.539,9.7,7.09,51.8),
new makeTrial("trial124_",2,0.469,0.535,0.556,93.2,50.4,9.91),
new makeTrial("trial125_",2,0.578,0.18,0.496,93.7,8.85,50.2),
new makeTrial("trial126_",6,0.539,0.489,0.468,47,94.3,95.1),
new makeTrial("trial127_",4,0.564,0.00646,0.405,0.182,0.89,48.5),
new makeTrial("trial128_",3,0.0507,0.562,0.463,9.22,4.67,54.7),
new makeTrial("trial129_",5,0.525,0.895,0.545,90.5,98.9,50.5),
new makeTrial("trial130_",1,0.517,0.025,0.471,99.9,99.1,90.5),
new makeTrial("trial131_",6,0.985,0.587,0.83,6.11,46.9,49.6),
new makeTrial("trial132_",4,0.586,0.0621,0.546,51.3,54.6,94.9),
new makeTrial("trial133_",3,0.539,0.541,0.862,47.3,46.9,45.6),
new makeTrial("trial134_",2,0.555,0.403,0.444,53.5,0.321,7.6),
new makeTrial("trial135_",5,0.831,0.857,0.402,8.1,45.3,8.07),
new makeTrial("trial136_",1,0.454,0.963,0.819,5.42,99.1,95.9),
new makeTrial("trial137_",1,0.411,0.548,0.404,46.9,54.3,99.1),
new makeTrial("trial138_",1,0.436,0.86,0.559,54.9,95.7,95.4),
new makeTrial("trial139_",1,0.444,0.566,0.0267,54.5,53.1,8.34),
new makeTrial("trial140_",4,0.561,0.936,0.192,52.1,94.4,99.1),
new makeTrial("trial141_",6,0.522,0.957,0.46,91.1,9.93,99.8),
new makeTrial("trial142_",3,0.564,0.484,0.429,52.4,94.9,97.8),
new makeTrial("trial143_",2,0.534,0.472,0.967,46.2,95.3,91.7),
new makeTrial("trial144_",2,0.495,0.141,0.437,94,53.2,2.01),
new makeTrial("trial145_",3,0.825,0.542,0.196,97.4,45.8,3.13),
new makeTrial("trial146_",2,0.481,0.507,0.188,47.6,4.88,0.222),
new makeTrial("trial147_",3,0.462,0.848,0.172,1.45,9.69,96.2),
new makeTrial("trial148_",3,0.136,0.85,0.147,53.6,95.7,97.3),
new makeTrial("trial149_",4,0.973,0.113,0.449,51.4,0.527,92.1),
new makeTrial("trial150_",2,0.447,0.494,0.549,97.9,7.77,96.7),
new makeTrial("trial151_",5,0.488,0.186,0.437,50.9,95.1,98),
new makeTrial("trial152_",3,0.899,0.17,0.479,7.66,48.6,7.24),
new makeTrial("trial153_",4,0.865,0.401,0.524,53.8,51.5,50.5),
new makeTrial("trial154_",1,0.408,0.834,0.504,5.36,95.7,46.2),
new makeTrial("trial155_",6,0.5,0.884,0.596,96.9,90.8,46.7),
new makeTrial("trial156_",5,0.961,0.182,0.514,2.03,95.7,98.1),
new makeTrial("trial157_",5,0.4,0.508,0.403,53.4,45.2,97.6),
new makeTrial("trial158_",2,0.484,0.511,0.47,97,6.29,0.676),
new makeTrial("trial159_",3,0.163,0.944,0.56,50.9,91.2,6.81),
new makeTrial("trial160_",1,0.0,0.599,0.878,54.4,99.2,98.7),
new makeTrial("trial161_",3,0.0139,0.89,0.526,97.6,98.4,99.4),
new makeTrial("trial162_",5,0.172,0.479,0.0641,92,46.3,3.78),
new makeTrial("trial163_",6,0.889,0.46,0.114,3.46,52.6,95.6),
new makeTrial("trial164_",3,0.977,0.535,0.509,50.1,51.6,51.8),
new makeTrial("trial165_",5,0.545,0.464,0.583,49.7,3.4,93),
new makeTrial("trial166_",6,0.523,0.938,0.818,2.46,98.1,48.5),
new makeTrial("trial167_",3,0.806,0.455,0.575,8.52,9.91,6.51),
new makeTrial("trial168_",5,0.47,0.453,0.491,46.5,96.4,48.9),
new makeTrial("trial169_",4,0.438,0.485,0.168,99.2,92.4,7.3),
new makeTrial("trial170_",2,0.929,0.516,0.846,95.5,7.19,97.3),
new makeTrial("trial171_",6,0.474,0.425,0.134,7.66,45.2,48.6),
new makeTrial("trial172_",2,0.454,0.423,0.0541,4.58,91.1,45.3),
new makeTrial("trial173_",2,0.892,0.0142,0.528,98.4,0.674,52.9),
new makeTrial("trial174_",6,0.506,0.5,0.04,49.1,98.2,46.1),
new makeTrial("trial175_",2,0.977,0.837,0.521,47.5,8.02,49),
new makeTrial("trial176_",5,0.439,0.505,0.42,95.4,9.98,54.1),
new makeTrial("trial177_",4,0.48,0.498,0.503,45,3.12,52.9),
new makeTrial("trial178_",5,0.56,0.592,0.902,96.1,91.3,3.93),
new makeTrial("trial179_",1,0.909,0.409,0.511,46.6,0.623,91),
new makeTrial("trial180_",5,0.536,0.138,0.0308,45.9,98.9,49),
new makeTrial("trial181_",4,0.55,0.851,0.451,96.2,47,91.1),
new makeTrial("trial182_",2,0.916,0.0391,0.543,47.2,8.89,94.1),
new makeTrial("trial183_",3,0.839,0.993,0.047,94.8,99.7,53.6),
new makeTrial("trial184_",1,0.167,0.593,0.42,48.7,5.54,95.7),
new makeTrial("trial185_",4,0.541,0.0627,0.0695,9.39,50.8,90.8),
new makeTrial("trial186_",6,0.0712,0.167,0.0398,91.4,7.11,47.2),
new makeTrial("trial187_",5,0.447,0.404,0.495,7.34,45.8,97.8),
new makeTrial("trial188_",3,0.474,0.463,0.446,90.8,51.6,4.51),
new makeTrial("trial189_",2,0.432,0.508,0.472,54,9.5,95.1),
new makeTrial("trial190_",5,0.0357,0.483,0.467,99,47.6,90.6),
new makeTrial("trial191_",1,0.901,0.512,0.442,96.4,50.8,95.3),
new makeTrial("trial192_",1,0.582,0.414,0.826,98.6,91.6,93),
new makeTrial("trial193_",3,0.423,0.869,0.473,99.8,0.315,96.6),
new makeTrial("trial194_",2,0.199,0.528,0.958,0.251,47,51.8),
new makeTrial("trial195_",1,0.59,0.528,0.536,92.5,9.24,1.37),
new makeTrial("trial196_",3,0.576,0.894,0.145,1.73,53.9,7.3),
new makeTrial("trial197_",5,0.411,0.847,0.0138,92.6,49.6,45.8),
new makeTrial("trial198_",6,0.45,0.46,0.821,4.58,5.1,97.7),
new makeTrial("trial199_",1,0.0819,0.484,0.967,1.98,8.39,54.6),
new makeTrial("trial200_",6,0.858,0.0,0.85,99.7,4.83,95.3),
new makeTrial("trial201_",6,0.41,0.143,0.484,46.6,54.7,48.8),
new makeTrial("trial202_",4,0.526,0.548,0.524,91.9,52.2,96.3),
new makeTrial("trial203_",6,0.816,0.41,0.591,0.493,48.5,90.7),
new makeTrial("trial204_",2,0.873,0.17,0.537,95,94.1,0.31),
new makeTrial("trial205_",3,0.87,0.582,0.429,90.7,3.11,90.6),
new makeTrial("trial206_",1,0.515,0.821,0.501,97.1,51.7,97.7),
new makeTrial("trial207_",6,0.542,0.462,0.576,3.08,48.4,54.6),
new makeTrial("trial208_",6,0.552,0.557,0.907,92.6,47.6,99.1),
new makeTrial("trial209_",2,0.462,0.448,0.00132,3.86,3.66,54.5),
new makeTrial("trial210_",6,0.883,0.809,0.455,3.61,93.8,8.23),
new makeTrial("trial211_",1,0.844,0.564,0.838,97.9,51.5,46.5),
new makeTrial("trial212_",4,0.582,0.962,0.593,90.2,9.27,8.08),
new makeTrial("trial213_",2,0.486,0.555,0.866,97.4,46.3,50.9),
new makeTrial("trial214_",6,0.428,0.414,0.517,2.56,54.8,3.39),
new makeTrial("trial215_",3,0.491,0.982,0.992,98.5,6.29,2.56),
new makeTrial("trial216_",1,0.528,0.508,0.589,8.62,46.4,45.9),
new makeTrial("trial217_",5,0.51,0.527,0.541,5.49,2.11,9.49),
new makeTrial("trial218_",2,0.922,0.559,0.471,46.4,8.97,0.771),
new makeTrial("trial219_",3,0.428,0.594,0.481,92.6,49.7,3.98),
new makeTrial("trial220_",2,0.00689,0.59,0.532,49.5,90.9,91.4),
new makeTrial("trial221_",6,0.861,0.454,0.0867,7.76,93.6,9.61),
new makeTrial("trial222_",2,0.072,0.494,0.9,7.38,52.4,48.9),
new makeTrial("trial223_",2,0.493,0.584,0.528,3.33,91,8.14),
new makeTrial("trial224_",5,0.194,0.822,0.462,47.2,8.65,53.3),
new makeTrial("trial225_",4,0.45,0.874,0.459,48.9,49.9,99.7),
new makeTrial("trial226_",6,0.0908,0.858,0.0191,4.26,90.2,9.76),
new makeTrial("trial227_",3,0.84,0.907,0.0757,47.8,48.8,98.1),
new makeTrial("trial228_",3,0.165,0.475,0.561,46.5,3.84,49.9),
new makeTrial("trial229_",4,0.438,0.991,0.978,95.3,94.2,95.8),
new makeTrial("trial230_",2,0.566,0.121,0.429,54.5,3.28,49.2),
new makeTrial("trial231_",3,0.481,0.478,0.462,8.1,94,9.33),
new makeTrial("trial232_",6,0.888,0.822,0.841,92.1,6.87,2.06),
new makeTrial("trial233_",5,0.0424,0.482,0.477,90.9,0.112,94.8),
new makeTrial("trial234_",3,0.493,0.418,0.181,48,8.69,98.2),
new makeTrial("trial235_",6,0.469,0.459,0.17,96.3,1.71,92.4),
new makeTrial("trial236_",1,0.525,0.52,0.532,96.6,91.3,47.9),
new makeTrial("trial237_",4,0.451,0.402,0.541,54.9,2.42,91.8),
new makeTrial("trial238_",4,0.462,0.576,0.553,46.4,8.24,48.9),
new makeTrial("trial239_",4,0.066,0.136,0.158,48.8,9.5,6.59),
new makeTrial("trial240_",6,0.419,0.961,0.52,46.5,52.6,92),
new makeTrial("trial241_",4,0.554,0.0235,0.119,1.36,46.5,98.1),
new makeTrial("trial242_",6,0.831,0.841,0.491,99.4,8.08,97.2),
new makeTrial("trial243_",1,0.576,0.983,0.462,9.72,54.6,9.95),
new makeTrial("trial244_",2,0.433,0.432,0.0876,96.3,52.2,92.7),
new makeTrial("trial245_",5,0.802,0.421,0.091,52.9,8.13,9.95),
new makeTrial("trial246_",1,0.465,0.532,0.873,9.22,8.63,3.81),
new makeTrial("trial247_",1,0.551,0.0796,0.142,3.1,96.8,96),
new makeTrial("trial248_",5,0.523,0.839,0.818,95.9,99.6,45.3),
new makeTrial("trial249_",2,0.124,0.173,0.572,99.9,97.8,49.2),
new makeTrial("trial250_",6,0.507,0.426,0.855,8.69,54.5,98.7),
new makeTrial("trial251_",4,0.524,0.419,0.114,99.1,48.7,97.1),
new makeTrial("trial252_",2,0.537,0.898,0.555,6.46,98,9.99),
new makeTrial("trial253_",3,0.439,0.556,0.534,91.4,6.18,49.1),
new makeTrial("trial254_",6,0.472,0.523,0.596,98.8,93.8,96.2),
new makeTrial("trial255_",3,0.191,0.593,0.462,0.94,47.1,5.53),
new makeTrial("trial256_",1,0.55,0.54,0.0327,48.5,95.1,50.8),
new makeTrial("trial257_",6,0.588,0.473,0.459,54.5,7.82,9.18),
new makeTrial("trial258_",1,0.527,0.548,0.582,3.65,4.84,8.01),
new makeTrial("trial259_",1,0.458,0.993,0.553,93.2,49.3,91.2),
new makeTrial("trial260_",1,0.496,0.926,0.537,6.36,1.67,0.927),
new makeTrial("trial261_",6,0.409,0.408,0.443,91.1,3.46,98.7),
new makeTrial("trial262_",3,0.805,0.58,0.466,6.52,4.11,4.7),
new makeTrial("trial263_",3,0.142,0.427,0.58,0.312,0.49,49.7),
new makeTrial("trial264_",2,0.401,0.598,0.941,46.2,46.9,5.74),
new makeTrial("trial265_",4,0.844,0.967,0.587,5.32,51.7,97.5),
new makeTrial("trial266_",3,0.568,0.431,0.544,49,46.8,90.7),
new makeTrial("trial267_",1,0.195,0.189,0.495,45.1,5.35,4.68),
new makeTrial("trial268_",1,0.462,0.955,0.521,92.7,53.3,93.5),
new makeTrial("trial269_",3,0.876,0.497,0.414,46.1,9.53,92.3),
new makeTrial("trial270_",4,0.417,0.556,0.413,92.2,96.6,97.6),
new makeTrial("trial271_",5,0.959,0.418,0.824,5.61,97.9,100),
new makeTrial("trial272_",3,0.55,0.407,0.558,53.9,53.2,0.167),
new makeTrial("trial273_",5,0.91,0.461,0.0329,95.3,9.24,95.5),
new makeTrial("trial274_",2,0.413,0.536,0.422,93.5,9.4,5.76),
new makeTrial("trial275_",2,0.46,0.975,0.581,6.49,52.6,2.94),
new makeTrial("trial276_",6,0.415,0.0272,0.554,0.797,5.68,49.2),
new makeTrial("trial277_",5,0.528,0.00482,0.466,99,94.9,2.08),
new makeTrial("trial278_",4,0.411,0.158,0.446,53.6,1.73,0.638),
new makeTrial("trial279_",2,0.553,0.14,0.498,49,52.9,47.9),
new makeTrial("trial280_",1,0.538,0.424,0.164,7.41,5.05,96.3),
new makeTrial("trial281_",3,0.481,0.462,0.416,50.2,8.42,0.0715),
new makeTrial("trial282_",3,0.406,0.473,0.12,52,53.4,0.509),
new makeTrial("trial283_",5,0.0146,0.579,0.597,4.51,52.7,0.352),
new makeTrial("trial284_",4,0.513,0.156,0.529,52.1,97.7,91.2),
new makeTrial("trial285_",2,0.838,0.907,0.183,48.7,98.6,54.8),
new makeTrial("trial286_",2,0.509,0.976,0.51,95.2,47.3,5.17),
new makeTrial("trial287_",3,0.551,0.988,0.568,2.03,49.3,95.1),
new makeTrial("trial288_",6,0.493,0.488,0.128,50,7.29,54.5),
new makeTrial("trial289_",1,0.963,0.577,0.13,95.3,97.9,3.9),
new makeTrial("trial290_",3,0.458,0.945,0.106,51.4,94.1,8.85),
new makeTrial("trial291_",4,0.481,0.872,0.131,48.8,96.4,6.28),
new makeTrial("trial292_",2,0.592,0.591,0.507,90.4,54.8,49),
new makeTrial("trial293_",5,0.549,0.525,0.587,54.7,48.6,91.9),
new makeTrial("trial294_",2,0.816,0.049,0.0521,45.4,90.3,54.2),
new makeTrial("trial295_",1,0.0653,0.544,0.543,92.2,6.45,46.2),
new makeTrial("trial296_",5,0.56,0.58,0.404,48.3,2.2,53.4),
new makeTrial("trial297_",1,0.816,0.578,0.483,7.48,91.4,51.6),
new makeTrial("trial298_",1,0.0548,0.403,0.461,91.1,97.5,1.72),
new makeTrial("trial299_",3,0.48,0.477,0.437,3.47,0.235,91),
new makeTrial("trial300_",2,0.496,0.894,0.121,51.7,96.9,6.98),
new makeTrial("trial301_",2,0.0238,0.468,0.509,5.08,100,49.4),
new makeTrial("trial302_",4,0.579,0.88,0.581,47.1,49.4,1.53),
new makeTrial("trial303_",5,0.499,0.484,0.0678,0.283,52.5,0.256),
new makeTrial("trial304_",5,0.502,0.0864,0.523,7.41,53.8,3.28),
new makeTrial("trial305_",1,0.193,0.445,0.461,95.6,3.01,47.2),
new makeTrial("trial306_",2,0.103,0.432,0.405,8.79,46.4,51.5),
new makeTrial("trial307_",4,0.0937,0.974,0.575,3.39,47.4,51.7),
new makeTrial("trial308_",1,0.48,0.518,0.439,95.9,49.3,51.9),
new makeTrial("trial309_",6,0.402,0.518,0.0545,52.1,1.3,3.26),
new makeTrial("trial310_",4,0.53,0.538,0.448,3,4.42,48.3),
new makeTrial("trial311_",3,0.411,0.423,0.472,97.2,6.2,53.4),
new makeTrial("trial312_",3,0.547,0.823,0.41,91.6,46.5,2.9),
new makeTrial("trial313_",3,0.595,0.586,0.408,94.1,98.9,94.8),
new makeTrial("trial314_",4,0.403,0.533,0.96,91.4,46.7,54.7),
new makeTrial("trial315_",6,0.0348,0.078,0.141,46.4,46,48.3),
new makeTrial("trial316_",2,0.554,0.46,0.819,48.6,53.5,9.2),
new makeTrial("trial317_",3,0.0818,0.494,0.491,9.06,4.21,1.98),
new makeTrial("trial318_",3,0.439,0.501,0.489,91,1.62,49),
new makeTrial("trial319_",6,0.0555,0.0909,0.53,6.54,51.2,49.6),
new makeTrial("trial320_",3,0.869,0.915,0.44,99.7,48.6,52),
new makeTrial("trial321_",4,0.964,0.0944,0.57,46.3,7.12,2.7),
new makeTrial("trial322_",4,0.803,0.183,0.0406,97.2,51.6,96.7),
new makeTrial("trial323_",5,0.511,0.859,0.0425,48.4,54.1,97.1),
new makeTrial("trial324_",6,0.428,0.418,0.451,51.6,49.4,47.3),
new makeTrial("trial325_",2,0.52,0.504,0.419,51.2,49.2,93.2),
new makeTrial("trial326_",4,0.578,0.194,0.498,5.16,8.11,48.3),
new makeTrial("trial327_",6,0.961,0.891,0.129,91.9,51.8,90),
new makeTrial("trial328_",1,0.533,0.0401,0.0939,98.4,4.49,49.8),
new makeTrial("trial329_",5,0.182,0.551,0.831,54.8,92.9,6.45),
new makeTrial("trial330_",5,0.0232,0.571,0.508,49.3,93.5,48.5),
new makeTrial("trial331_",5,0.468,0.481,0.839,49.5,7.69,0.343),
new makeTrial("trial332_",4,0.534,0.568,0.15,1.7,1.66,97.8),
new makeTrial("trial333_",4,0.413,0.564,0.456,3.62,93.5,96.4),
new makeTrial("trial334_",3,0.431,0.988,0.436,53.5,45.6,4.53),
new makeTrial("trial335_",1,0.544,0.0019,0.0685,4.09,54.6,49.7),
new makeTrial("trial336_",1,0.134,0.587,0.485,4.68,47.6,98.3),
new makeTrial("trial337_",2,0.897,0.194,0.0784,51.2,0.252,94.2),
new makeTrial("trial338_",4,0.0769,0.539,0.818,9.61,99.9,99.2),
new makeTrial("trial339_",2,0.406,0.537,0.56,98.9,7.97,93.3),
new makeTrial("trial340_",1,0.467,0.463,0.51,48,2.3,99.6),
new makeTrial("trial341_",2,0.121,0.0993,0.543,54,9.51,3.27),
new makeTrial("trial342_",3,0.543,0.164,0.18,1.38,99.7,45.4),
new makeTrial("trial343_",2,0.812,0.407,0.423,4.28,0.697,95.1),
new makeTrial("trial344_",4,0.504,0.0168,0.582,8.2,93.9,3.31),
new makeTrial("trial345_",3,0.524,0.00154,0.592,98,49.5,94.4),
new makeTrial("trial346_",6,0.475,0.466,0.869,9.29,1.55,3.65),
new makeTrial("trial347_",6,0.457,0.977,0.0266,54.3,49.9,2.61),
new makeTrial("trial348_",6,0.179,0.534,0.595,8.85,50.2,97.9),
new makeTrial("trial349_",6,0.556,0.558,0.0412,96.1,47.2,98.3),
new makeTrial("trial350_",4,0.573,0.507,0.414,49.7,52.6,54),
new makeTrial("trial351_",4,0.579,0.471,0.462,52.7,7.33,52),
new makeTrial("trial352_",4,0.431,0.435,0.0721,47.9,50.7,0.137),
new makeTrial("trial353_",6,0.833,0.434,0.884,95.9,95.5,5.5),
new makeTrial("trial354_",6,0.101,0.418,0.13,97.1,93.2,3.04),
new makeTrial("trial355_",5,0.987,0.599,0.421,49.5,5.93,53.5),
new makeTrial("trial356_",5,0.589,0.598,0.407,95.4,2.56,96.5),
new makeTrial("trial357_",1,0.53,0.488,0.521,9.38,50.3,50.1),
new makeTrial("trial358_",3,0.578,0.923,0.587,97,4.2,90.5),
new makeTrial("trial359_",1,0.124,0.413,0.504,4.44,50.3,45.8),
new makeTrial("trial360_",6,0.0401,0.814,0.428,98,98.1,49.7),
new makeTrial("trial361_",4,0.577,0.482,0.0781,93.2,99.4,90.4),
new makeTrial("trial362_",3,0.595,0.152,0.101,3.03,95.8,47.3),
new makeTrial("trial363_",1,0.885,0.522,0.534,0.00753,94.7,9.68),
new makeTrial("trial364_",1,0.083,0.572,0.481,94.9,49,0.143),
new makeTrial("trial365_",6,0.815,0.185,0.405,5.47,53.3,5.12),
new makeTrial("trial366_",5,0.0614,0.566,0.421,2.97,50.6,97.6),
new makeTrial("trial367_",5,0.559,0.495,0.471,99.1,96.7,53.4),
new makeTrial("trial368_",6,0.482,0.526,0.512,95.9,94.4,3.9),
new makeTrial("trial369_",3,0.541,0.424,0.498,94,95,2.19),
new makeTrial("trial370_",2,0.948,0.452,0.441,93,48.9,50.8),
new makeTrial("trial371_",4,0.432,4.32e-05,0.076,49.8,93.7,0.125),
new makeTrial("trial372_",5,0.891,0.584,0.548,51.2,49.4,93.6),
new makeTrial("trial373_",4,0.837,0.933,0.509,9.58,91.8,50.2),
new makeTrial("trial374_",2,0.556,0.421,0.0822,2.6,52.4,51.2),
new makeTrial("trial375_",5,0.544,0.00599,0.929,46.9,8.13,8.56),
new makeTrial("trial376_",4,0.507,0.493,0.531,96.8,3.18,48.9),
new makeTrial("trial377_",6,0.507,0.0317,0.439,52.9,2.29,98.8),
new makeTrial("trial378_",5,0.404,0.55,0.00337,51.1,7.62,0.49),
new makeTrial("trial379_",4,0.871,0.117,0.539,5.96,47,98.2),
new makeTrial("trial380_",2,0.599,0.449,0.457,7.8,93.2,3.31),
new makeTrial("trial381_",1,0.402,0.448,0.15,98.3,0.502,48.2),
new makeTrial("trial382_",3,0.127,0.49,0.158,6.62,97.5,96.8),
new makeTrial("trial383_",3,0.472,0.41,0.509,52.1,93.7,97.8),
new makeTrial("trial384_",2,0.514,0.535,0.437,8.7,52,9.43),
new makeTrial("trial385_",1,0.992,0.58,0.545,96.1,48.9,2.57),
new makeTrial("trial386_",1,0.537,0.592,0.472,90.9,45.1,93.1),
new makeTrial("trial387_",2,0.427,0.591,0.881,51.8,54,91),
new makeTrial("trial388_",6,0.108,0.126,0.434,47,51.9,49.8),
new makeTrial("trial389_",4,0.456,0.573,0.941,50.9,53.7,7.27),
new makeTrial("trial390_",5,0.871,0.475,0.112,98.9,91.8,8.46),
new makeTrial("trial391_",2,0.507,0.163,0.105,52.9,6.09,49.9),
new makeTrial("trial392_",1,0.978,0.162,0.867,52.5,52.1,3.21),
new makeTrial("trial393_",6,0.176,0.456,0.0484,54.5,2.85,47.4),
new makeTrial("trial394_",3,0.425,0.958,0.521,94.8,45.5,93.9),
new makeTrial("trial395_",2,0.802,0.427,0.489,2.53,51.1,91.3),
new makeTrial("trial396_",2,0.53,0.408,0.145,2.15,91.9,97.7),
new makeTrial("trial397_",1,0.501,0.473,0.569,2.13,6.35,50.9),
new makeTrial("trial398_",5,0.413,0.918,0.466,94,0.19,93.2),
new makeTrial("trial399_",3,0.911,0.406,0.411,49.2,5.06,51.1),
new makeTrial("trial400_",6,0.44,0.513,0.879,7.47,92.5,92.4),
new makeTrial("trial401_",3,0.825,0.508,0.838,6.95,90.5,92.9),
new makeTrial("trial402_",4,0.82,0.583,0.578,6.64,98.3,96.8),
new makeTrial("trial403_",6,0.431,0.548,0.0153,1.42,45.8,48.7),
new makeTrial("trial404_",6,0.894,0.509,0.593,96.2,96.1,51.3),
new makeTrial("trial405_",2,0.513,0.453,0.943,1.25,94.7,4.7),
new makeTrial("trial406_",2,0.0691,0.983,0.0142,98.4,3.15,3.28),
new makeTrial("trial407_",3,0.171,0.487,0.403,96.1,4.3,9.2),
new makeTrial("trial408_",4,0.53,0.0335,0.595,52.5,99.1,96.3),
new makeTrial("trial409_",4,0.189,0.477,0.0236,91.6,46.6,50),
new makeTrial("trial410_",3,0.00729,0.957,0.815,53.1,49.6,51.2),
new makeTrial("trial411_",1,0.457,0.949,0.5,54.3,0.466,91.3),
new makeTrial("trial412_",2,0.831,0.00936,0.471,1.76,9.51,99.4),
new makeTrial("trial413_",4,0.822,0.566,0.937,5.23,8.33,52.1),
new makeTrial("trial414_",5,0.518,0.402,0.461,9.03,0.383,5.39),
new makeTrial("trial415_",4,0.476,0.5,0.868,6.82,90.3,54.8),
new makeTrial("trial416_",6,0.93,0.905,0.894,100,96.6,97.4),
new makeTrial("trial417_",6,0.0725,0.804,0.48,49.4,97,3.36),
new makeTrial("trial418_",1,0.0338,0.509,0.582,6.62,96.6,4.56),
new makeTrial("trial419_",4,0.892,0.494,0.465,47,91.6,97.3),
new makeTrial("trial420_",5,0.554,0.0903,0.425,96.4,45.2,4.98),
new makeTrial("trial421_",2,0.439,0.118,0.00914,4.19,5.07,98.8),
new makeTrial("trial422_",5,0.00793,0.533,0.419,7.36,8.28,48.6),
new makeTrial("trial423_",2,0.566,0.472,0.451,6.42,51.6,3.74),
new makeTrial("trial424_",3,0.0877,0.54,0.0351,45.3,54.6,50.6),
new makeTrial("trial425_",5,0.568,0.188,0.808,6.46,4.62,0.747),
new makeTrial("trial426_",4,0.0188,0.931,0.509,1.31,99.3,48.5),
new makeTrial("trial427_",3,0.529,0.989,0.196,97,98,99.5),
new makeTrial("trial428_",4,0.899,0.805,0.179,0.895,90.2,9.25),
new makeTrial("trial429_",5,0.461,0.0376,0.558,99.9,95.5,94.9),
new makeTrial("trial430_",4,0.535,0.0913,0.153,94.3,53.5,1.3),
new makeTrial("trial431_",5,0.433,0.488,0.0959,92.2,9.92,48.7),
new makeTrial("trial432_",4,0.503,0.935,0.582,0.525,4.82,0.558),
new makeTrial("trial433_",3,0.11,0.442,0.942,3.33,96.9,91.1),
new makeTrial("trial434_",3,0.468,0.828,0.904,8.53,46.5,96),
new makeTrial("trial435_",2,0.551,0.485,0.481,2.01,94.1,94.3),
new makeTrial("trial436_",6,0.908,0.821,0.442,99.4,8.17,97.7),
new makeTrial("trial437_",4,0.146,0.494,0.543,92.6,97,53.7),
new makeTrial("trial438_",1,0.495,0.533,0.188,46.1,94.2,51.7),
new makeTrial("trial439_",6,0.414,0.404,0.951,50.9,3.56,49.9),
new makeTrial("trial440_",6,0.941,0.591,0.887,93.7,47.3,51.1),
new makeTrial("trial441_",2,0.879,0.578,0.513,95.2,94.6,51.8),
new makeTrial("trial442_",5,0.908,0.182,0.473,7.62,4.94,7.02),
new makeTrial("trial443_",5,1,0.801,0.0524,9.53,4.88,1.19),
new makeTrial("trial444_",3,0.022,0.514,0.499,96.1,95.4,90.8),
new makeTrial("trial445_",6,0.525,0.198,0.169,6.24,7.92,91.8),
new makeTrial("trial446_",4,0.428,0.939,0.452,96.5,8.04,45.1),
new makeTrial("trial447_",6,0.407,0.553,0.493,96.4,6.16,5.43),
new makeTrial("trial448_",4,0.435,0.587,0.179,0.332,94.2,90.2),
new makeTrial("trial449_",3,0.852,0.569,0.538,4.7,91.9,94.4),
new makeTrial("trial450_",2,0.839,0.567,0.421,7,46.7,3.62),
new makeTrial("trial451_",4,0.499,0.523,0.15,45.9,7.57,92.5),
new makeTrial("trial452_",2,0.0559,0.402,0.147,51,2.06,90.7),
new makeTrial("trial453_",5,0.435,0.42,0.438,48.9,98.9,91.3),
new makeTrial("trial454_",4,0.457,0.896,0.863,7.43,1.58,1.89),
new makeTrial("trial455_",6,0.574,0.972,0.147,4.94,7.05,90.7),
new makeTrial("trial456_",3,0.189,0.513,0.458,51.6,5.62,48.3),
new makeTrial("trial457_",6,0.954,0.516,0.442,91.5,98.7,3.99),
new makeTrial("trial458_",4,0.563,0.442,0.548,49.3,91.7,90.2),
new makeTrial("trial459_",3,0.91,0.578,0.471,6.46,49.3,50),
new makeTrial("trial460_",1,0.452,0.998,0.57,3.76,0.804,51.6),
new makeTrial("trial461_",4,0.562,0.473,0.118,46.5,2.58,1.35),
new makeTrial("trial462_",5,0.88,0.417,0.564,4.13,91.3,1.16),
new makeTrial("trial463_",4,0.0474,0.144,0.413,99.2,48.5,94.3),
new makeTrial("trial464_",2,0.0285,0.13,0.5,51.6,4.88,6.48),
new makeTrial("trial465_",4,0.125,0.181,0.0353,99,95.6,2.37),
new makeTrial("trial466_",3,0.957,0.414,0.0374,50.3,6.3,92.7),
new makeTrial("trial467_",4,0.0982,0.517,0.414,53.1,90.3,45.6),
new makeTrial("trial468_",2,0.44,0.44,0.543,0.793,96.4,95.9),
new makeTrial("trial469_",2,0.0227,0.446,0.015,52.9,98.8,94.9),
new makeTrial("trial470_",6,0.0569,0.598,0.0488,52.9,5.66,49.5),
new makeTrial("trial471_",1,0.528,0.0381,0.103,45.8,1.09,96.4),
new makeTrial("trial472_",5,0.493,0.0945,0.5,97.7,7.72,2.35),
new makeTrial("trial473_",6,0.439,0.458,0.0478,50,54.8,92.6),
new makeTrial("trial474_",3,0.514,0.134,0.468,92.8,1.94,45.4),
new makeTrial("trial475_",6,0.497,0.489,0.529,47.2,98.2,93.8),
new makeTrial("trial476_",3,0.45,0.488,0.147,2.23,8.86,3.86),
new makeTrial("trial477_",6,0.443,0.0551,0.995,4.54,7.09,0.333),
new makeTrial("trial478_",5,0.492,0.0798,0.98,48,47.2,90.1),
new makeTrial("trial479_",1,0.551,0.453,0.456,100,46.9,98.1),
new makeTrial("trial480_",5,0.537,0.522,0.531,9.95,1.87,52.1),
new makeTrial("trial481_",2,0.459,0.449,0.593,54.6,1.02,92.6),
new makeTrial("trial482_",5,0.504,0.549,0.0786,6.07,92.5,45.1),
new makeTrial("trial483_",3,0.507,0.439,0.49,53.4,45.3,93.8),
new makeTrial("trial484_",6,0.433,0.564,0.173,94,47.3,97.4),
new makeTrial("trial485_",6,0.481,0.408,0.897,51.2,46.1,50.6),
new makeTrial("trial486_",3,0.866,0.49,0.592,94.9,47.7,54),
new makeTrial("trial487_",4,0.421,0.535,0.148,49.4,3.38,50),
new makeTrial("trial488_",2,0.813,0.529,0.431,95.5,49.3,92.9),
new makeTrial("trial489_",4,0.584,0.803,0.138,90.9,50.7,90.3),
new makeTrial("trial490_",3,0.458,0.892,0.566,8.39,51.5,99.3),
new makeTrial("trial491_",2,0.439,0.502,0.436,94.5,47.3,95.3),
new makeTrial("trial492_",4,0.998,0.942,0.0565,49.6,53.3,6.44),
new makeTrial("trial493_",2,0.526,0.54,0.456,97.8,47.3,3.63),
new makeTrial("trial494_",5,0.469,0.864,0.56,92.1,92.4,1.74),
new makeTrial("trial495_",6,0.429,0.445,0.097,50.1,4.18,4.75),
new makeTrial("trial496_",3,0.574,0.452,0.523,52.7,54.9,47.5),
new makeTrial("trial497_",2,0.489,0.516,0.469,50.1,3.07,1.59),
new makeTrial("trial498_",5,0.576,0.536,0.45,8.34,2.59,96.1),
new makeTrial("trial499_",6,0.514,0.85,0.572,46.7,7.47,52.7),
new makeTrial("trial500_",2,0.83,0.543,0.986,48.6,9.51,90.3),
new makeTrial("trial501_",1,0.0402,0.574,0.0484,94.5,52,1.73),
new makeTrial("trial502_",6,0.151,0.176,0.125,53.9,5.78,48),
new makeTrial("trial503_",2,0.128,0.986,0.55,94,97.4,2.42),
new makeTrial("trial504_",4,0.834,0.585,0.495,49.7,92.3,93.7),
new makeTrial("trial505_",2,0.0167,0.514,0.479,8.08,94.8,90.7),
new makeTrial("trial506_",1,0.962,0.495,0.167,52.3,90.7,4.78),
new makeTrial("trial507_",2,0.527,0.412,0.448,97.1,1.96,1.9),
new makeTrial("trial508_",2,0.457,0.971,0.433,4.47,97.9,93.1),
new makeTrial("trial509_",5,0.508,0.441,0.828,92.3,50.1,7.99),
new makeTrial("trial510_",2,0.518,0.0921,0.475,92,3.01,99.4),
new makeTrial("trial511_",5,0.162,0.587,0.523,2.95,99.6,4.98),
new makeTrial("trial512_",4,0.425,0.0182,0.971,45.6,4.12,4.22),
new makeTrial("trial513_",5,0.151,0.99,0.507,3.42,52,48.7),
new makeTrial("trial514_",5,0.483,0.897,0.542,93.5,48.2,8.53),
new makeTrial("trial515_",5,0.505,0.581,0.504,3.76,97.4,5.52),
new makeTrial("trial516_",2,0.489,0.876,0.571,48.2,96.9,91.2),
new makeTrial("trial517_",6,0.566,0.0736,0.0993,91.6,2.67,9.31),
new makeTrial("trial518_",6,0.501,0.91,0.855,50.8,9.66,93.1),
new makeTrial("trial519_",4,0.427,0.466,0.418,51.3,0.434,1),
new makeTrial("trial520_",4,0.553,0.815,0.0668,97.3,6.06,0.24),
new makeTrial("trial521_",6,0.501,0.811,0.44,95.4,47,52.4),
new makeTrial("trial522_",5,0.435,0.597,0.564,4.35,52.4,49.1),
new makeTrial("trial523_",5,0.96,0.0303,0.0503,50.2,90.3,50.8),
new makeTrial("trial524_",2,0.462,0.459,0.00133,99.7,92.4,49.3),
new makeTrial("trial525_",5,0.986,0.53,0.585,99.3,9.99,49.7),
new makeTrial("trial526_",4,0.838,0.143,0.476,1.2,52.1,94.8),
new makeTrial("trial527_",2,0.841,0.119,0.912,99.2,90.7,54),
new makeTrial("trial528_",2,0.976,0.498,0.095,46,8.31,94.5),
new makeTrial("trial529_",6,0.88,0.448,0.0362,53.9,1.65,9.07),
new makeTrial("trial530_",5,0.534,0.871,0.113,0.523,49.1,0.548),
new makeTrial("trial531_",2,0.427,0.0559,0.894,50.2,1.52,97.7),
new makeTrial("trial532_",5,0.514,0.866,0.558,90.5,47.7,4.74),
new makeTrial("trial533_",3,0.977,0.437,0.449,98.6,93.6,7.65),
new makeTrial("trial534_",6,0.443,0.59,0.0221,54.3,91.5,91),
new makeTrial("trial535_",1,0.183,0.849,0.402,7.26,99.9,8.65),
new makeTrial("trial536_",4,0.0587,0.572,0.467,51.2,5.12,51.8),
new makeTrial("trial537_",3,0.475,0.938,0.126,1.51,0.396,48.8),
new makeTrial("trial538_",6,0.588,0.53,0.523,48.4,46.1,9.43),
new makeTrial("trial539_",4,0.503,0.458,0.85,46.4,91.4,97.2),
new makeTrial("trial540_",5,0.0,0.413,0.897,3.65,93.4,92.6),
new makeTrial("trial541_",6,0.084,0.167,0.513,92.1,47.9,94.5),
new makeTrial("trial542_",1,0.00172,0.156,0.163,9.83,49.7,90.5),
new makeTrial("trial543_",6,0.564,0.858,0.549,8.22,9.51,54.2),
new makeTrial("trial544_",3,0.847,0.168,0.127,53.8,45.7,94.8),
new makeTrial("trial545_",5,0.552,0.969,0.406,49.4,8.35,8.29),
new makeTrial("trial546_",6,0.598,0.82,0.417,93.4,49.9,94),
new makeTrial("trial547_",2,0.469,0.0254,0.418,45.2,46.8,97.9),
new makeTrial("trial548_",1,0.441,0.445,0.427,5.3,93.7,94.9),
new makeTrial("trial549_",4,0.533,0.513,0.506,97.5,54.9,92.7),
new makeTrial("trial550_",2,0.406,0.561,0.899,99.8,50.3,96.7),
new makeTrial("trial551_",3,0.00508,0.588,0.526,99.3,94.8,53.4),
new makeTrial("trial552_",6,0.569,0.416,0.198,90.4,6.91,3.34),
new makeTrial("trial553_",4,0.511,0.472,0.54,47.8,96.6,90.3),
new makeTrial("trial554_",3,0.465,0.505,0.497,47.5,48.7,47.4),
new makeTrial("trial555_",2,0.548,0.191,0.426,97.6,48.6,90.9),
new makeTrial("trial556_",5,0.429,0.405,0.0215,51.9,2.91,4.47),
new makeTrial("trial557_",5,0.511,0.491,0.418,98.1,7.79,6.6),
new makeTrial("trial558_",6,0.177,0.485,0.937,98.4,52.3,90.8),
new makeTrial("trial559_",5,0.504,0.537,0.849,47.9,51.9,92.7),
new makeTrial("trial560_",5,0.112,0.498,0.52,52.5,93.5,54.6),
new makeTrial("trial561_",1,0.938,0.536,0.451,47.8,8.76,97.8),
new makeTrial("trial562_",2,0.42,0.451,0.901,7.73,94.6,53.3),
new makeTrial("trial563_",6,0.531,0.95,0.097,52.6,4.49,54.5),
new makeTrial("trial564_",4,0.555,0.864,0.142,49.2,99.7,5.81),
new makeTrial("trial565_",2,0.813,0.991,0.455,8.16,2.86,1.07),
new makeTrial("trial566_",5,0.995,0.168,0.548,3.47,53.3,0.0316),
new makeTrial("trial567_",4,0.438,0.00243,0.437,4.5,5.93,9.44),
new makeTrial("trial568_",6,0.454,0.0633,0.5,45.8,91.6,45.5),
new makeTrial("trial569_",5,0.192,0.828,0.542,5.7,0.0612,94.9),
new makeTrial("trial570_",1,0.423,0.579,0.917,47.4,95.3,1.86),
new makeTrial("trial571_",5,0.483,0.083,0.0886,95.6,45.1,50.5),
new makeTrial("trial572_",4,0.436,0.585,0.178,93.9,48.1,99.7),
new makeTrial("trial573_",5,0.52,0.588,0.438,4.99,54.4,93.9),
new makeTrial("trial574_",6,0.433,0.434,0.991,92,48.7,48.3),
new makeTrial("trial575_",5,0.919,0.429,0.524,5.45,51.6,7.2),
new makeTrial("trial576_",1,0.416,0.844,0.864,46.1,46,48),
new makeTrial("trial577_",4,0.447,0.424,0.412,98.1,3.45,7.45),
new makeTrial("trial578_",4,0.0572,0.407,0.431,47.9,92.5,50),
new makeTrial("trial579_",1,0.872,0.072,0.0819,47.3,53.4,3.74),
new makeTrial("trial580_",3,0.153,0.584,0.428,53.6,52.9,4.47),
new makeTrial("trial581_",2,0.483,0.535,0.179,49.6,47.4,45.9),
new makeTrial("trial582_",4,0.0899,0.566,0.525,98.6,93.4,93.5),
new makeTrial("trial583_",2,0.104,0.58,0.194,90.9,49.5,96.1),
new makeTrial("trial584_",2,0.455,0.493,0.103,3.49,6.75,92.6),
new makeTrial("trial585_",4,0.92,0.103,0.546,93.6,1.01,7.55),
new makeTrial("trial586_",5,0.926,0.867,0.479,51.2,9.94,45.1),
new makeTrial("trial587_",5,0.0451,0.813,0.414,98.8,3.97,48.5),
new makeTrial("trial588_",2,0.0122,0.048,0.41,97,92.3,51.3),
new makeTrial("trial589_",1,0.506,0.566,0.981,8.69,90.1,90.9),
new makeTrial("trial590_",1,0.557,0.475,0.901,5.94,99.3,54.7),
new makeTrial("trial591_",2,0.15,0.83,0.418,96,98.4,8.36),
new makeTrial("trial592_",3,0.968,0.434,0.979,9.51,98.3,47.3),
new makeTrial("trial593_",6,0.95,0.45,0.577,98.9,0.947,51.6),
new makeTrial("trial594_",3,0.174,0.523,0.0721,99.2,53.1,92.5),
new makeTrial("trial595_",1,0.51,0.972,0.558,47.9,99.7,7.62),
new makeTrial("trial596_",5,0.951,0.584,0.949,6.15,54.8,98.7),
new makeTrial("trial597_",6,0.0325,0.406,0.0564,0.993,94.4,7.17),
new makeTrial("trial598_",5,0.581,0.456,0.575,9.77,92.3,45.8),
new makeTrial("trial599_",6,0.492,0.59,0.57,4.72,48.5,54),
new makeTrial("trial600_",3,0.0777,0.02,0.0367,46.2,53.3,54.9),
new makeTrial("trial601_",2,0.865,0.194,0.456,99.4,2.33,54.6),
new makeTrial("trial602_",1,0.567,0.808,0.445,52.4,99.7,45),
new makeTrial("trial603_",3,0.402,0.596,0.581,47,91.8,47),
new makeTrial("trial604_",1,0.819,0.553,0.458,48.6,96.2,50.5),
new makeTrial("trial605_",2,0.526,0.471,0.466,8.75,9.46,54.1),
new makeTrial("trial606_",5,0.468,0.564,0.816,50.8,92.5,53.5),
new makeTrial("trial607_",6,0.419,0.441,0.597,2.35,99.1,2.8),
new makeTrial("trial608_",5,0.86,0.552,0.405,7.34,3.63,45.9),
new makeTrial("trial609_",1,0.87,0.552,0.59,96.7,52.1,52.8),
new makeTrial("trial610_",6,0.985,0.441,0.0556,51.6,7.03,3.56),
new makeTrial("trial611_",3,0.549,0.461,0.906,9.34,4.62,4.94),
new makeTrial("trial612_",6,0.51,0.504,0.464,96.4,5.97,95.9),
new makeTrial("trial613_",6,0.14,0.437,0.506,4.25,3.18,51.3),
new makeTrial("trial614_",4,0.548,0.514,0.494,47.5,2.82,97.5),
new makeTrial("trial615_",4,0.0556,0.519,0.465,92.8,6.88,47.2),
new makeTrial("trial616_",6,0.198,0.997,0.0122,6.16,0.295,94.9),
new makeTrial("trial617_",6,0.107,0.427,0.533,45.2,2.52,9.87),
new makeTrial("trial618_",2,0.0204,0.802,0.509,48.6,52.2,52.3),
new makeTrial("trial619_",1,0.953,0.59,0.6,93.5,50.7,96.9),
new makeTrial("trial620_",6,0.484,0.452,0.469,9.37,94.7,91.2),
new makeTrial("trial621_",3,0.537,0.92,0.536,49.1,94.6,45.5),
new makeTrial("trial622_",4,0.513,0.528,0.988,90.6,98.7,51.9),
new makeTrial("trial623_",2,0.443,0.553,0.402,98.9,53.8,6.58),
new makeTrial("trial624_",1,0.115,0.542,0.578,4.96,46.3,92.5),
new makeTrial("trial625_",5,0.81,0.178,0.478,3.63,6.88,95.6),
new makeTrial("trial626_",2,0.91,0.491,0.139,7.47,54.2,49.6),
new makeTrial("trial627_",2,0.108,0.957,0.538,91.9,91.6,48.3),
new makeTrial("trial628_",2,0.57,0.467,0.985,95.8,8.23,94.1),
new makeTrial("trial629_",4,0.186,0.935,0.483,96.6,49.1,3.31),
new makeTrial("trial630_",5,0.437,0.951,0.149,92.7,100,90.5),
new makeTrial("trial631_",5,0.507,0.186,0.856,96.8,49.8,99.5),
new makeTrial("trial632_",2,0.453,0.0859,0.0674,90.2,9.91,46.8),
new makeTrial("trial633_",5,0.48,0.846,0.419,9.09,7.48,45.4),
new makeTrial("trial634_",6,0.432,0.439,0.0302,95.9,96,96.1),
new makeTrial("trial635_",3,0.569,0.51,0.532,8.14,8.09,53.4),
new makeTrial("trial636_",1,0.983,0.577,0.092,51.2,97.8,93.1),
new makeTrial("trial637_",5,0.58,0.517,0.121,3.26,49.5,91),
new makeTrial("trial638_",3,0.456,0.468,0.174,3.2,91.4,3.53),
new makeTrial("trial639_",5,0.453,0.566,0.529,96.3,48.2,2.9),
new makeTrial("trial640_",4,0.569,0.411,0.514,92.2,54.1,96.4),
new makeTrial("trial641_",5,0.568,0.878,0.153,0.69,1.45,5.14),
new makeTrial("trial642_",6,0.545,0.553,0.563,51.3,99.1,3.63),
new makeTrial("trial643_",2,0.463,0.407,0.17,94,49.3,49.2),
new makeTrial("trial644_",4,0.454,0.532,0.401,48.2,5.17,4.09),
new makeTrial("trial645_",5,0.00738,0.106,0.422,95.5,50.1,5),
new makeTrial("trial646_",4,0.444,0.424,0.191,51.7,53.3,9.45),
new makeTrial("trial647_",3,0.933,0.894,0.558,50.7,8.47,2.28),
new makeTrial("trial648_",6,0.589,0.439,0.969,2.56,52.1,51.2),
new makeTrial("trial649_",6,0.867,0.113,0.408,97.7,50.6,90.7),
new makeTrial("trial650_",3,0.567,0.573,0.582,6.78,92,9.91),
new makeTrial("trial651_",5,0.811,0.49,0.422,48.8,90.2,95.5),
new makeTrial("trial652_",2,0.161,0.446,0.876,4.52,9.69,53.6),
new makeTrial("trial653_",3,0.521,0.174,0.459,94.9,49.2,53.2),
new makeTrial("trial654_",5,0.466,0.55,0.419,8.13,9.06,4.71),
new makeTrial("trial655_",2,0.47,0.804,0.847,46.7,45.1,90.7),
new makeTrial("trial656_",2,0.441,0.468,0.0352,5.67,6.05,97.7),
new makeTrial("trial657_",6,0.519,0.566,0.409,7.07,94.8,95.2),
new makeTrial("trial658_",4,0.437,0.846,0.973,95.9,51.5,53.7),
new makeTrial("trial659_",4,0.496,0.982,0.582,53.1,9.49,53.4),
new makeTrial("trial660_",6,0.432,0.514,0.433,94.6,45.1,8.82),
new makeTrial("trial661_",1,0.15,0.0842,0.462,8.64,5.56,4.84),
new makeTrial("trial662_",6,0.178,0.936,0.574,52.8,50.5,90.3),
new makeTrial("trial663_",1,0.471,0.519,0.0424,2.63,97.8,46.2),
new makeTrial("trial664_",5,0.521,0.589,0.905,90.4,49.2,48.2),
new makeTrial("trial665_",4,0.571,0.112,0.426,94.6,96.4,5.66),
new makeTrial("trial666_",6,0.847,0.536,0.572,8.94,50.5,51.9),
new makeTrial("trial667_",1,0.533,0.499,0.598,93.1,54.1,5.1),
new makeTrial("trial668_",6,0.122,0.579,0.561,45.3,97.5,46.8),
new makeTrial("trial669_",1,0.514,0.171,0.491,95.1,8.84,51.9),
new makeTrial("trial670_",3,0.516,0.408,0.961,3.65,94,48.9),
new makeTrial("trial671_",5,0.458,0.528,0.509,93,47.1,47.5),
new makeTrial("trial672_",1,0.415,0.435,0.558,49.5,91.8,93.2),
new makeTrial("trial673_",2,0.188,0.428,0.503,45.6,54.5,52.3),
new makeTrial("trial674_",4,0.921,0.52,0.893,97.4,1.85,9.97),
new makeTrial("trial675_",3,0.499,0.847,0.452,2.3,54.4,2.1),
new makeTrial("trial676_",4,0.555,0.502,0.442,3.32,91.7,4.78),
new makeTrial("trial677_",2,0.552,0.42,0.476,45.6,50.4,6.05),
new makeTrial("trial678_",1,0.466,0.407,0.564,1.3,96.1,9.78),
new makeTrial("trial679_",4,0.555,0.904,0.811,53.5,4.4,90.1),
new makeTrial("trial680_",2,0.472,0.914,0.905,52.2,5.4,8.85),
new makeTrial("trial681_",4,0.0606,0.516,0.598,93.3,1.77,7.43),
new makeTrial("trial682_",5,0.864,0.537,0.433,45.5,96.9,5.66),
new makeTrial("trial683_",3,0.113,0.578,0.597,53,46.8,53.6),
new makeTrial("trial684_",1,0.442,0.0272,0.486,3.51,53,6.81),
new makeTrial("trial685_",2,0.412,0.928,0.498,51.5,48.6,46.3),
new makeTrial("trial686_",5,0.0133,0.425,0.881,9.46,96.4,97.7),
new makeTrial("trial687_",6,0.556,0.549,0.479,0.791,54.6,51.4),
new makeTrial("trial688_",4,0.459,0.476,0.459,53,45.2,55),
new makeTrial("trial689_",2,0.551,0.0144,0.483,2.78,98.6,92.3),
new makeTrial("trial690_",1,0.544,0.927,0.184,48.8,6.19,51.2),
new makeTrial("trial691_",3,0.0367,0.537,0.96,49.9,99.2,93.3),
new makeTrial("trial692_",5,0.56,0.557,0.937,46.7,90.7,97.9),
new makeTrial("trial693_",5,0.473,0.824,0.93,0.545,95.5,97),
new makeTrial("trial694_",3,0.00723,0.58,0.887,93.8,50,8.23),
new makeTrial("trial695_",4,0.583,0.0618,0.556,90.5,92.3,3.69),
new makeTrial("trial696_",4,0.584,0.0106,0.526,90.6,47.7,53.3),
new makeTrial("trial697_",2,0.966,0.0426,0.141,50,93.5,51.9),
new makeTrial("trial698_",4,0.58,0.149,0.947,55,46.2,50.9),
new makeTrial("trial699_",6,0.577,0.00461,0.464,4.75,6.57,93.9),
new makeTrial("trial700_",4,0.908,0.551,0.589,98.9,47,0.8),
new makeTrial("trial701_",6,0.117,0.195,0.109,9.25,97.6,97.7),
new makeTrial("trial702_",3,0.457,0.44,0.433,92.4,92.7,0.496),
new makeTrial("trial703_",5,0.446,0.966,0.519,98.9,2.91,54.4),
new makeTrial("trial704_",2,0.142,0.512,0.142,50,3.57,2.19),
new makeTrial("trial705_",6,0.591,0.54,0.992,52.9,2.72,47.9),
new makeTrial("trial706_",4,0.477,0.498,0.508,46.4,2.35,51),
new makeTrial("trial707_",5,0.897,0.487,0.991,94.8,96.4,92.8),
new makeTrial("trial708_",5,0.592,0.448,0.464,53.9,54.4,8.99),
new makeTrial("trial709_",4,0.554,0.534,0.971,90.7,90.2,0.983),
new makeTrial("trial710_",1,0.534,0.0507,0.416,4.16,48.5,9.49),
new makeTrial("trial711_",6,0.471,0.4,0.157,95.2,91.3,99.2),
new makeTrial("trial712_",6,0.0629,0.544,0.449,0.642,2.06,7.18),
new makeTrial("trial713_",4,0.421,0.828,0.954,96.2,99.5,7.28),
new makeTrial("trial714_",5,0.988,0.574,0.16,91,3.5,99.3),
new makeTrial("trial715_",5,0.835,0.0704,0.422,96.5,8.19,2.73),
new makeTrial("trial716_",4,0.523,0.907,0.939,48.2,47.5,0.373),
new makeTrial("trial717_",3,0.461,0.467,0.96,9.06,52.3,6),
new makeTrial("trial718_",6,0.484,0.0221,0.871,50.2,90.9,46.6),
new makeTrial("trial719_",4,0.00606,0.953,0.856,0.415,1.06,0.471),
new makeTrial("trial720_",1,0.986,0.418,0.548,53,1.91,9.54),
new makeTrial("trial721_",1,0.435,0.404,0.0607,91.5,92,90.7),
new makeTrial("trial722_",1,0.527,0.433,0.403,53.9,45.9,9.78),
new makeTrial("trial723_",2,0.456,0.575,0.08,4.47,52.7,96.3),
new makeTrial("trial724_",6,0.833,0.811,0.809,54.9,95,1.02),
new makeTrial("trial725_",3,0.535,0.823,0.479,48.5,2.71,92),
new makeTrial("trial726_",6,0.465,0.0267,0.501,0.504,9.38,52),
new makeTrial("trial727_",5,0.457,0.457,0.409,93.7,4.94,54.9),
new makeTrial("trial728_",3,0.49,0.465,0.449,48.9,46.2,0.251),
new makeTrial("trial729_",2,0.557,0.411,0.508,52.8,92.8,54.5),
new makeTrial("trial730_",2,0.414,0.461,0.165,95.9,51.9,46.3),
new makeTrial("trial731_",3,0.986,0.599,0.527,53.3,5.15,47.4),
new makeTrial("trial732_",1,0.56,0.538,0.804,5.72,7.57,53.7),
new makeTrial("trial733_",1,0.00767,0.967,0.437,99.8,7.22,9.43),
new makeTrial("trial734_",1,0.571,0.54,0.85,97.5,9.21,48.2),
new makeTrial("trial735_",3,0.0891,0.817,0.581,1.17,1.98,46.1),
new makeTrial("trial736_",5,0.844,0.446,0.977,54.8,92.3,6.5),
new makeTrial("trial737_",1,0.556,0.449,0.476,98.2,45.6,7.39),
new makeTrial("trial738_",6,0.405,0.481,0.584,49.9,47.9,90.9),
new makeTrial("trial739_",1,0.59,0.451,0.857,51.5,6.51,7.04),
new makeTrial("trial740_",3,0.082,0.0935,0.547,95.4,92.6,7.46),
new makeTrial("trial741_",1,0.544,0.569,0.459,97.4,45.5,93.8),
new makeTrial("trial742_",6,0.412,0.966,0.177,9.09,45.2,45),
new makeTrial("trial743_",3,0.116,0.421,0.588,49.7,2.33,6.68),
new makeTrial("trial744_",5,0.514,0.14,0.468,95.4,52.4,50.5),
new makeTrial("trial745_",1,0.477,0.532,0.989,50.3,4.86,4.98),
new makeTrial("trial746_",2,0.448,0.42,0.435,96.8,45.2,8.87),
new makeTrial("trial747_",2,0.858,0.514,0.854,5.91,95.8,92.1),
new makeTrial("trial748_",2,0.519,0.429,0.8,4.94,99.7,49.5),
new makeTrial("trial749_",4,0.449,0.428,0.435,8.96,93,9.27),
new makeTrial("trial750_",4,0.918,0.536,0.0376,9.28,96.9,3.5),
new makeTrial("trial751_",4,0.894,0.558,0.418,50.3,50.1,6.74),
new makeTrial("trial752_",6,0.974,0.536,0.538,48.8,9.35,94.6),
new makeTrial("trial753_",4,0.46,0.168,0.503,98.6,97.1,49.6),
new makeTrial("trial754_",5,0.0211,0.53,0.919,97.7,52.4,47.1),
new makeTrial("trial755_",4,0.496,0.571,0.0545,98.9,99.2,54.2),
new makeTrial("trial756_",5,0.0553,0.563,0.0965,51.4,9.81,52.8),
new makeTrial("trial757_",6,0.185,0.0366,0.52,96.8,93.4,2.8),
new makeTrial("trial758_",1,0.995,0.587,0.173,2.58,3.69,93.6),
new makeTrial("trial759_",5,0.444,0.13,0.404,53.8,51.5,4.54),
new makeTrial("trial760_",1,0.561,0.517,0.581,96.1,9.96,96.9),
new makeTrial("trial761_",5,0.56,0.851,0.551,92.4,91.1,48.7),
new makeTrial("trial762_",1,0.588,0.499,0.143,53.4,47.2,97.7),
new makeTrial("trial763_",6,0.53,0.823,0.527,8.14,91.9,97.5),
new makeTrial("trial764_",6,0.585,0.46,0.156,5.81,9.06,50.2),
new makeTrial("trial765_",1,0.533,0.816,0.972,47.8,54.7,47.8),
new makeTrial("trial766_",2,0.543,0.967,0.557,4.67,46.4,50.3),
new makeTrial("trial767_",3,0.45,0.889,0.912,98.2,94.6,49.1),
new makeTrial("trial768_",1,0.422,0.563,0.022,4.96,51.1,1.05),
new makeTrial("trial769_",1,0.192,0.561,0.11,53.1,46.4,2.96),
new makeTrial("trial770_",2,0.0366,0.445,0.539,96,7.94,51.4),
new makeTrial("trial771_",3,0.434,0.0564,0.496,95.5,48.1,47.4),
new makeTrial("trial772_",2,0.55,0.0585,0.816,92.6,5.95,51.8),
new makeTrial("trial773_",5,0.964,0.0817,0.092,5.92,3.26,5.15),
new makeTrial("trial774_",2,0.505,0.926,0.818,0.68,3.28,52.7),
new makeTrial("trial775_",5,0.458,0.849,0.422,45.3,5.44,52),
new makeTrial("trial776_",2,0.0831,0.521,0.827,95.3,8.98,5.59),
new makeTrial("trial777_",4,0.59,0.994,0.56,52.8,49.6,5.91),
new makeTrial("trial778_",3,0.874,0.491,0.425,99.7,94.9,49.6),
new makeTrial("trial779_",2,0.523,0.45,0.813,91.5,96.1,1.89),
new makeTrial("trial780_",3,0.426,0.426,0.412,52.6,8.32,4.92),
new makeTrial("trial781_",2,0.146,0.46,0.407,99.5,1.44,4.59),
new makeTrial("trial782_",5,0.0751,0.496,0.567,96.9,99.6,50.6),
new makeTrial("trial783_",5,0.0809,0.534,0.555,91.3,0.458,97.9),
new makeTrial("trial784_",5,0.124,0.823,0.489,1.77,6.8,91.8),
new makeTrial("trial785_",3,0.542,0.561,0.915,96.1,94.4,94.1),
new makeTrial("trial786_",5,0.439,0.599,0.476,95.3,94.6,46.3),
new makeTrial("trial787_",6,0.558,0.558,0.589,91.4,4.9,94),
new makeTrial("trial788_",4,0.567,0.47,0.993,2.79,9.72,53.5),
new makeTrial("trial789_",1,0.431,0.508,0.836,8.1,45.2,46.1),
new makeTrial("trial790_",2,0.467,0.562,0.507,2.94,97.7,3.9),
new makeTrial("trial791_",1,0.438,0.884,0.427,99.6,53.4,7.26),
new makeTrial("trial792_",2,0.896,0.414,0.972,92,5.63,91.8),
new makeTrial("trial793_",5,0.453,0.506,0.459,95.7,8.68,53),
new makeTrial("trial794_",2,0.0355,0.546,0.916,97.9,9.47,91.6),
new makeTrial("trial795_",1,0.463,0.0201,0.063,45.1,2.74,52.7),
new makeTrial("trial796_",1,0.926,0.488,0.505,91.8,7.47,97.4),
new makeTrial("trial797_",5,0.401,0.158,0.555,93.3,50.9,7.47),
new makeTrial("trial798_",5,0.0192,0.451,0.406,92,6.17,91),
new makeTrial("trial799_",5,0.475,0.955,0.532,92.5,90.3,8.59),
new makeTrial("trial800_",4,0.457,0.19,0.568,4.49,6.44,49.8),
new makeTrial("trial801_",1,0.488,0.0318,0.447,8.53,0.53,90.4),
new makeTrial("trial802_",3,0.888,0.159,0.821,95.5,50.5,5.16),
new makeTrial("trial803_",6,0.426,0.175,0.0889,91.6,3.84,6.4),
new makeTrial("trial804_",5,0.806,0.425,0.589,53.7,9.77,54),
new makeTrial("trial805_",5,0.0259,0.587,0.583,98.8,3.91,92.1),
new makeTrial("trial806_",5,0.935,0.0668,0.0439,96.2,2.1,3.01),
new makeTrial("trial807_",5,0.0983,0.566,0.0431,8.26,52.9,7.31),
new makeTrial("trial808_",3,0.567,0.113,0.457,5.99,97.7,7.68),
new makeTrial("trial809_",5,0.517,0.513,0.554,93,93,90.3),
new makeTrial("trial810_",1,0.911,0.443,0.973,53.2,90.4,3.28),
new makeTrial("trial811_",3,0.558,0.409,0.48,90.5,91.5,53.4),
new makeTrial("trial812_",5,0.496,0.519,0.56,7.36,99.1,54.4),
new makeTrial("trial813_",5,0.516,0.848,0.908,99.8,5.3,52.5),
new makeTrial("trial814_",5,0.495,0.579,0.406,52.7,94.6,96.3),
new makeTrial("trial815_",5,0.177,0.99,0.472,5.4,3.25,45.3),
new makeTrial("trial816_",2,0.481,0.87,0.86,94.7,96.4,48.3),
new makeTrial("trial817_",5,0.192,0.0105,0.137,8.68,0.0406,4.42),
new makeTrial("trial818_",3,0.476,0.833,0.575,45.1,50.4,7.97),
new makeTrial("trial819_",6,0.423,0.00268,0.941,94.4,94.5,51.7),
new makeTrial("trial820_",6,0.137,0.817,0.126,7.15,54.8,8.57),
new makeTrial("trial821_",4,0.478,0.965,0.463,5.43,93.2,0.256),
new makeTrial("trial822_",4,0.0,0.972,0.889,93.1,49.8,95.2),
new makeTrial("trial823_",5,0.458,0.116,0.109,47,46,49.8),
new makeTrial("trial824_",2,0.0974,0.503,0.469,2.97,96.3,52.9),
new makeTrial("trial825_",4,0.827,0.888,0.559,2.56,50.6,45.1),
new makeTrial("trial826_",2,0.944,0.465,0.588,53,92.6,45.9),
new makeTrial("trial827_",5,0.474,0.524,0.414,50.4,3.05,99.7),
new makeTrial("trial828_",1,0.126,0.562,0.441,94.8,8.45,94.5),
new makeTrial("trial829_",2,0.573,0.841,0.00179,7.59,49.5,1.06),
new makeTrial("trial830_",4,0.196,0.877,0.443,8.74,55,45.4),
new makeTrial("trial831_",5,0.506,0.523,0.0962,54.5,7.93,97),
new makeTrial("trial832_",3,0.528,0.422,0.559,92.3,54.4,7.97),
new makeTrial("trial833_",5,0.433,0.921,0.426,3.23,97.2,92.5),
new makeTrial("trial834_",3,0.582,0.533,0.929,2.59,95.5,7.05),
new makeTrial("trial835_",2,0.0459,0.992,0.572,6.38,49.8,0.468),
new makeTrial("trial836_",1,0.0117,0.532,0.902,94.1,52.7,92.2),
new makeTrial("trial837_",3,0.503,0.559,0.986,9.74,90.4,93.9),
new makeTrial("trial838_",1,0.0425,0.198,0.56,9.47,2.96,54),
new makeTrial("trial839_",6,0.0546,0.599,0.457,0.447,92,52),
new makeTrial("trial840_",5,0.878,0.435,0.4,96.6,48.3,94.5),
new makeTrial("trial841_",5,0.458,0.48,0.0304,50.5,6.61,0.305),
new makeTrial("trial842_",1,0.949,0.11,0.409,54.9,6.25,53.8),
new makeTrial("trial843_",3,0.481,0.596,0.563,45.8,50.7,5.07),
new makeTrial("trial844_",4,0.447,0.802,0.56,51.7,46,54.2),
new makeTrial("trial845_",1,0.439,0.562,0.885,54.2,6.31,46.7),
new makeTrial("trial846_",3,0.533,0.489,0.509,94.5,52.1,45.5),
new makeTrial("trial847_",6,0.873,0.926,0.45,8.39,93.8,50.6),
new makeTrial("trial848_",4,0.501,0.876,0.502,92.8,96,54.3),
new makeTrial("trial849_",6,0.0822,0.431,0.555,98.7,3.37,96.2),
new makeTrial("trial850_",6,0.575,0.953,0.441,5.82,45.9,94.8),
new makeTrial("trial851_",4,0.971,0.475,0.105,53.2,0.673,96.1),
new makeTrial("trial852_",4,0.519,0.82,0.456,99,8.99,7.16),
new makeTrial("trial853_",4,0.544,0.116,0.531,48.4,8.32,51.4),
new makeTrial("trial854_",4,0.177,0.0431,0.113,4.41,94.4,94.6),
new makeTrial("trial855_",3,0.544,0.518,0.546,2.39,1.06,94.8),
new makeTrial("trial856_",2,0.484,0.481,0.954,1.61,98.5,2.34),
new makeTrial("trial857_",1,0.41,0.599,0.401,98.3,2.61,93.8),
new makeTrial("trial858_",2,0.945,0.466,0.485,46.3,93.1,5.7),
new makeTrial("trial859_",4,0.598,0.549,0.545,7.86,2.61,4.57),
new makeTrial("trial860_",4,0.987,0.546,0.179,93.2,48,47.1),
new makeTrial("trial861_",3,0.929,0.496,0.511,52.1,92,91.6),
new makeTrial("trial862_",4,0.459,0.89,0.407,95.5,51.5,54.4),
new makeTrial("trial863_",1,0.589,0.0894,0.559,52.5,93.5,97.1),
new makeTrial("trial864_",2,0.573,0.476,0.46,53.8,9.95,8.97),
new makeTrial("trial865_",2,0.511,0.549,0.443,6.52,95.2,93.7),
new makeTrial("trial866_",4,0.098,0.916,0.49,7.79,5.03,94.9),
new makeTrial("trial867_",5,0.0265,0.501,0.0916,54.4,54.7,53.6),
new makeTrial("trial868_",1,0.537,0.469,0.403,48.9,5.23,91.5),
new makeTrial("trial869_",2,0.542,0.484,0.501,91.9,4.8,93.5),
new makeTrial("trial870_",2,0.44,0.522,0.827,7.2,98.1,3.59),
new makeTrial("trial871_",6,0.179,0.167,0.495,94.4,45.6,93.5),
new makeTrial("trial872_",4,0.475,0.481,0.525,0.619,8.31,98),
new makeTrial("trial873_",2,0.555,0.575,0.565,3.74,95.2,96.3),
new makeTrial("trial874_",2,0.131,0.0722,0.181,99,95.7,52.8),
new makeTrial("trial875_",3,0.508,0.564,0.161,0.695,96.9,3.25),
new makeTrial("trial876_",1,0.168,0.1,0.515,4.67,45.3,48.4),
new makeTrial("trial877_",3,0.151,0.558,0.103,45.4,96.1,3.72),
new makeTrial("trial878_",6,0.413,0.997,0.433,46.1,49.4,52.9),
new makeTrial("trial879_",3,0.404,0.438,0.491,47.4,2.84,3.41),
new makeTrial("trial880_",1,0.411,0.896,0.432,91.2,0.583,3.12),
new makeTrial("trial881_",6,0.562,0.157,0.466,3.58,95.5,8.63),
new makeTrial("trial882_",6,0.886,0.139,0.104,4.85,53.2,7.6),
new makeTrial("trial883_",2,0.452,0.514,0.45,95.7,50.3,51.7),
new makeTrial("trial884_",6,0.93,0.996,0.477,97.9,90.3,50.1),
new makeTrial("trial885_",5,0.856,0.0347,0.998,54.5,53.8,5.38),
new makeTrial("trial886_",2,0.472,0.839,0.598,98.9,92.9,2.08),
new makeTrial("trial887_",1,0.511,0.471,0.43,1.66,50.4,52.7),
new makeTrial("trial888_",3,0.576,0.00321,0.585,90.2,97.4,5.42),
new makeTrial("trial889_",6,0.176,0.493,0.533,93.6,97.6,3.83),
new makeTrial("trial890_",1,0.555,0.882,0.442,49.6,95.1,1.29),
new makeTrial("trial891_",2,0.505,0.554,0.0177,51.8,4.34,95.5),
new makeTrial("trial892_",1,0.124,0.543,0.423,54,99.3,6.7),
new makeTrial("trial893_",3,0.889,0.486,0.509,0.815,96.2,96.9),
new makeTrial("trial894_",4,0.551,0.854,0.494,46.9,45.6,99.7),
new makeTrial("trial895_",1,0.431,0.133,0.496,7.62,8.98,50.8),
new makeTrial("trial896_",4,0.493,0.48,0.414,92.3,48.2,99.9),
new makeTrial("trial897_",3,0.0226,0.6,0.586,4.97,45.1,1.48),
new makeTrial("trial898_",2,0.431,0.523,0.91,2.16,7.81,97),
new makeTrial("trial899_",5,0.586,0.501,0.101,54.7,5.11,52.9),
new makeTrial("trial900_",1,0.438,0.549,0.547,4.87,1.95,52.2),
new makeTrial("trial901_",1,0.939,0.97,0.106,51.9,47.2,98.7),
new makeTrial("trial902_",4,0.565,0.459,0.899,53.5,99.3,0.101),
new makeTrial("trial903_",6,0.574,0.46,0.416,48,49.1,97.4),
new makeTrial("trial904_",4,0.966,0.421,0.051,3.94,48.8,51.5),
new makeTrial("trial905_",1,0.833,0.563,0.565,97.7,48.3,3.5),
new makeTrial("trial906_",6,0.545,0.0778,0.89,49.9,48.6,94.7),
new makeTrial("trial907_",3,0.451,0.413,0.493,53.9,3.69,92.2),
new makeTrial("trial908_",3,0.525,0.0671,0.476,1.97,1.58,92.8),
new makeTrial("trial909_",2,0.198,0.525,0.443,95.4,0.57,9.3),
new makeTrial("trial910_",3,0.467,0.905,0.406,5.26,1.86,6.39),
new makeTrial("trial911_",2,0.867,0.491,0.907,92.2,2.08,1.02),
new makeTrial("trial912_",3,0.512,0.00239,0.508,2.39,99.7,97.9),
new makeTrial("trial913_",2,0.406,0.98,0.481,93.9,95.9,46.6),
new makeTrial("trial914_",3,0.571,0.575,0.904,50.4,7,90.3),
new makeTrial("trial915_",4,0.17,0.525,0.575,96.1,52.1,47.8),
new makeTrial("trial916_",5,0.198,0.508,0.591,51.4,97,45.5),
new makeTrial("trial917_",6,0.583,0.932,0.416,9.78,7.2,0.0361),
new makeTrial("trial918_",4,0.967,0.529,0.0316,92.1,51.5,54.2),
new makeTrial("trial919_",3,0.959,0.845,0.0728,97.7,50.9,1.22),
new makeTrial("trial920_",1,0.432,0.18,0.525,98.1,97,4.89),
new makeTrial("trial921_",3,0.509,0.462,0.178,97.5,5.49,96.9),
new makeTrial("trial922_",6,0.917,0.431,0.402,51.2,54.3,94.8),
new makeTrial("trial923_",4,0.414,0.0552,0.801,98.6,94,98.6),
new makeTrial("trial924_",3,0.514,0.489,0.523,50.8,2.29,54.2),
new makeTrial("trial925_",2,0.988,0.00256,0.471,3.06,52.7,47.5),
new makeTrial("trial926_",4,0.917,0.466,0.429,51.1,6.57,47.2),
new makeTrial("trial927_",6,0.915,0.477,0.552,5.66,45.6,7.74),
new makeTrial("trial928_",4,0.0297,0.596,0.597,50.4,92.5,52.1),
new makeTrial("trial929_",6,0.802,0.0708,0.824,91.4,94.2,6.91),
new makeTrial("trial930_",4,0.844,0.524,0.131,5.59,6.92,91.2),
new makeTrial("trial931_",6,0.524,0.504,0.438,91.7,90.3,91.8),
new makeTrial("trial932_",5,0.0777,0.101,0.478,1.61,47.1,6.51),
new makeTrial("trial933_",3,0.453,0.59,0.0788,99.7,49.5,94.5),
new makeTrial("trial934_",1,0.0141,0.527,0.891,6.75,53.7,52.1),
new makeTrial("trial935_",6,0.878,0.592,0.503,98.6,49.5,98.5),
new makeTrial("trial936_",2,0.455,0.973,0.849,98.5,45.1,97.4),
new makeTrial("trial937_",4,0.471,0.15,0.817,95.6,2.88,2.08),
new makeTrial("trial938_",4,0.934,0.576,0.429,93.9,94.2,51.8),
new makeTrial("trial939_",4,0.591,0.952,0.881,92,54.2,50.2),
new makeTrial("trial940_",1,0.512,0.521,0.401,90.3,51.5,98.7),
new makeTrial("trial941_",4,0.417,0.571,0.0495,49.3,2.88,50.3),
new makeTrial("trial942_",6,0.579,0.506,0.593,92,96,7.39),
new makeTrial("trial943_",4,0.132,0.415,0.0802,52.7,7.58,54.2),
new makeTrial("trial944_",1,0.994,0.931,0.526,0.654,95.4,49.2),
new makeTrial("trial945_",1,0.418,0.478,0.546,2.48,98.4,92.1),
new makeTrial("trial946_",2,0.854,0.406,0.47,48.5,52.4,53.6),
new makeTrial("trial947_",4,0.544,0.415,0.514,50.1,0.466,6.08),
new makeTrial("trial948_",1,0.472,0.0414,0.968,92.5,95.6,92.1),
new makeTrial("trial949_",6,0.481,0.472,0.406,48.7,97.6,4.47),
new makeTrial("trial950_",6,0.0761,0.574,0.548,96,92.4,97.3),
new makeTrial("trial951_",5,0.557,0.415,0.534,92.3,46.3,53.6),
new makeTrial("trial952_",2,0.565,0.0354,0.176,90.9,0.348,46.8),
new makeTrial("trial953_",4,0.54,0.0947,0.919,99.5,51.4,6.08),
new makeTrial("trial954_",5,0.194,0.474,0.971,91.8,3.01,52.8),
new makeTrial("trial955_",6,0.567,0.411,0.00519,52.8,50.4,0.238),
new makeTrial("trial956_",2,0.509,0.419,0.977,46.4,99.5,8.08),
new makeTrial("trial957_",6,0.597,0.402,0.924,50.2,1.01,46.1),
new makeTrial("trial958_",5,0.473,0.818,0.6,4.72,7.7,51),
new makeTrial("trial959_",3,0.548,0.521,0.991,2.78,2.13,98.8),
new makeTrial("trial960_",3,0.832,0.442,0.951,94.4,8.62,52.9),
new makeTrial("trial961_",5,0.0107,0.537,0.111,1.68,4.53,95.1),
new makeTrial("trial962_",3,0.563,0.421,0.44,5.48,5.75,93),
new makeTrial("trial963_",6,0.409,0.462,0.507,46.5,3.46,52.5),
new makeTrial("trial964_",5,0.554,0.876,0.423,0.781,96.1,47.2),
new makeTrial("trial965_",2,0.873,0.575,0.891,98,6.32,7.09),
new makeTrial("trial966_",4,0.447,0.499,0.411,49.8,91.3,3.3),
new makeTrial("trial967_",6,0.867,0.92,0.88,95.9,92.5,90.6),
new makeTrial("trial968_",3,0.424,0.586,0.985,9.05,49.7,8.03),
new makeTrial("trial969_",4,0.598,0.893,0.893,8.6,53.5,53.7),
new makeTrial("trial970_",3,0.429,0.569,0.145,98,93.8,48.1),
new makeTrial("trial971_",5,0.0773,0.434,0.0465,6.93,8.93,2.41),
new makeTrial("trial972_",2,0.0533,0.814,0.429,90.4,9.17,92.4),
new makeTrial("trial973_",3,0.882,0.0175,0.567,48.9,96.1,0.544),
new makeTrial("trial974_",1,0.838,0.839,0.494,91.3,93.4,91),
new makeTrial("trial975_",2,0.965,0.154,0.982,50.4,94.4,94.2),
new makeTrial("trial976_",5,0.576,0.423,0.0691,51.1,0.275,94.3),
new makeTrial("trial977_",1,0.891,0.453,0.513,51,2.55,3.49),
new makeTrial("trial978_",1,0.52,0.587,0.495,96.1,97.9,4.22),
new makeTrial("trial979_",3,0.19,0.058,0.838,95,0.85,9.96),
new makeTrial("trial980_",5,0.117,0.504,0.525,99.8,94.8,93),
new makeTrial("trial981_",2,0.586,0.474,0.866,45.8,3.62,48.7),
new makeTrial("trial982_",1,0.958,0.562,0.105,50.6,5.01,3.39),
new makeTrial("trial983_",5,0.926,0.535,0.95,2,45,0.672),
new makeTrial("trial984_",5,0.475,0.47,0.0121,93.6,94.7,49.5),
new makeTrial("trial985_",4,0.409,0.452,0.999,99.5,96.5,48.1),
new makeTrial("trial986_",1,0.0258,0.405,0.574,5.88,45.6,4.93),
new makeTrial("trial987_",3,0.493,0.192,0.44,51.8,3.95,1.54),
new makeTrial("trial988_",2,0.186,0.868,0.0305,93.3,48.2,8.46),
new makeTrial("trial989_",5,0.584,0.876,0.576,90.7,7.39,94.1),
new makeTrial("trial990_",2,0.538,0.534,0.535,47.4,1.39,45.1),
new makeTrial("trial991_",6,0.54,0.0529,0.568,96.3,54.8,45.9),
new makeTrial("trial992_",2,0.471,0.425,0.485,0.187,0.714,96.6),
new makeTrial("trial993_",2,0.886,0.452,0.595,91.5,0.83,6.97),
new makeTrial("trial994_",4,0.854,0.998,0.589,9.47,9.86,4.92),
new makeTrial("trial995_",3,0.478,0.576,0.47,52.1,8.4,97.7),
new makeTrial("trial996_",4,0.409,0.942,0.582,93.7,9.4,96.2),
new makeTrial("trial997_",6,0.555,0.0474,0.555,94.9,0.864,54.8),
new makeTrial("trial998_",6,0.841,0.434,0.433,94.4,47.5,50.9),
new makeTrial("trial999_",5,0.0964,0.533,0.479,46.6,6.04,99.5)
]);

var trials = [];

//old version: just two conds.

// for(var i = 0; i < n_trials; i++){
//     condition == "cond1" ? trials.push(cond1_trialpool[i]) : trials.push(cond2_trialpool[i]);
// }

var mytrials;
if(condition == "cond1"){
    mytrials = cond1_trialpool
}else{
    mytrials = cond2_trialpool
}

var trialcounter = 0;
var phase1_n = 5;
var phase2_n = 20;
var phase3_n = 30;

trials.push(new splashScreen("Round One", "This is a practice round. In this part you get to see all the features of all the options."))

for(var i =0; i<phase1_n;i++){
    trials.push(mytrials[trialcounter])
    trialcounter++;
}

trials.push(new splashScreen("Round Two", "This is an incentives round. From now on your choices count towards your final score. For now you still get to see all the features of all the options."))

for(var i =0; i<phase2_n;i++){
    trials.push(mytrials[trialcounter])
    trialcounter++;
}

trials.push(new splashScreen("Round Three", "This is a strategic round. In this part some of the features are hidden.<br/>"+localStorage.getItem("myinstructions")))

for(var i =0; i<phase3_n;i++){
    trials.push(mytrials[trialcounter])
    trialcounter++;
}


	    
// var superbest = 0;
// var rnd_guess = 0;
// for(var i = 0; i<trials.length;i++){
//     var ex_val = [];
//     for(var option =0;option<3;option++){
// 	ex_val.push(trials[i].probfeatures[option]*trials[i].payfeatures[option])
//     }
//     superbest+=(ex_val.reduce(function(a, b) {return Math.max(a, b)}));
//     rnd_guess+=(ex_val.reduce(function(a, b) {return a+b}))/ex_val.length;//ugh, javascript? Better way avg?

// }




trials[0].drawMe()


// var prob_button = button_string("prob1","dice_noshadow.png","dice_shadow.png","dice_highlight.png","click_feature",0,0,100,100)
// var pay_button = button_string("pay1", "payout_noshadow.png","payout_shadow.png","payout_highlight.png","click_feature",0,-200,100,100)
// document.getElementById("uberdiv").innerHTML += prob_button;
// document.getElementById("uberdiv").innerHTML += pay_button;
// function checknow (){
//     //hjelp.
//     console.log("straight trialindex")
//     console.log(trials[trialindex].probfeatures[0]+":"+trials[trialindex].payfeatures[0])
//     console.log(trials[trialindex].probfeatures[1]+":"+trials[trialindex].payfeatures[1])
//     console.log(trials[trialindex].probfeatures[2]+":"+trials[trialindex].payfeatures[2])
//     console.log("Galaxy brain thing the response detection uses")//these match, as they should. Ok then.
//     console.log(feature_lookup[trials[trialindex].idstring+"prob1"]+":"+feature_lookup[trials[trialindex].idstring+"pay1"])
//     console.log(feature_lookup[trials[trialindex].idstring+"prob2"]+":"+feature_lookup[trials[trialindex].idstring+"pay2"])
//     console.log(feature_lookup[trials[trialindex].idstring+"prob3"]+":"+feature_lookup[trials[trialindex].idstring+"pay3"])

// }
