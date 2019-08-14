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
var n_trials = 3;
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
    return shuffle([1,2,3,4,5,6])[0];
}
//stim setup:
var feature_lookup = {};

function makeTrial(idstring, obsbudget, p1, p2, p3, v1, v2, v3){
    this.ppntID = localStorage.getItem("ppntID");
    this.obsbudget = obsbudget; //tracker, decrements.
    this.obsbudget_initial = obsbudget; //recorder, fixed.
    this.probfeatures = [p1, p2, p3];
    this.payfeatures = [v1, v2, v3];
    this.drawTime = -1;

    feature_lookup[idstring+"prob1"] = p1;
    feature_lookup[idstring+"prob2"] = p2;
    feature_lookup[idstring+"prob3"] = p3;
    feature_lookup[idstring+"pay1"] = v1;
    feature_lookup[idstring+"pay2"] = v2;
    feature_lookup[idstring+"pay3"] = v3;
    
    this.drawMe = function(){	
	//in polar cords, position1 is (d,0)
	//position 2 is (d, 2pi/3)
	//position 3 is (d, 4pi/3)

	// so pos 1 in rect cords is: d*cos(0),d*sin(0) = (d,0)
	// pos 2 is d*cos(2pi/3), d*sin(2pi/3)
	//pos 3 is d*cos(4pi/3), d*sin(4pi/3)
	document.getElementById("uberdiv").innerHTML ="";
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
								 "\">Trial "+(trialindex+1)+" of "+n_trials+"</div>");
	

	var info_width = document.getElementById('infodiv').offsetWidth;
	var info_height = document.getElementById('infodiv').offsetHeight;

	document.getElementById("infodiv").style.top = (window.innerHeight/2-info_height/2-10)+"px";
	document.getElementById("infodiv").style.left = (window.innerWidth/2-info_width/2)+"px";

	//hide choice initially: revealed when obsbudget goes to zero.
	var cbs = document.getElementsByClassName("choicebutton");
	for (var i = 0; i < cbs.length; i++) {
	    cbs[i].style.display = "none";
	} 
    }
}



//helper fns
function get_current_info_message(){
    return "<p>You have "+trials[trialindex].obsbudget+" observation"+(trials[trialindex].obsbudget!=1 ? "s" : "")+" left this trial</p>"+
	"<p>Total score so far: "+(scorecounter.toPrecision(3))+"</p>"; 
}

function click_feature(featureid){
    //document.getElementById(featureid).style.display = "none";
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
    if(!choice_live)return;
    feature_live = false;
    choice_live = false;
    var id_split = choiceid.split("::");

    var myprob = feature_lookup[id_split[0]]
    var mypay =  feature_lookup[id_split[1]]
    var myoption = id_split[0].split("_")[1].charAt(id_split[0].split("_")[1].length-1)

    if(Math.random() < myprob){
	scorecounter+=parseFloat(mypay);
	
	document.getElementById("infodiv").innerHTML = "<p>Payout! Score increased by "+mypay+"</p><button onclick='nextTrial()'>Next</button>";
	var info_width = document.getElementById('infodiv').offsetWidth; //there has GOT to be a better way to stay centered?
	var info_height = document.getElementById('infodiv').offsetHeight;
	document.getElementById("infodiv").style.top = (window.innerHeight/2-info_height/2-10)+"px";
	document.getElementById("infodiv").style.left = (window.innerWidth/2-info_width/2)+"px";
	
    }else{
	document.getElementById("infodiv").innerHTML = "<p>This gamble did not pay out</p><button onclick='nextTrial()'>Next</button>";
	var info_width = document.getElementById('infodiv').offsetWidth;
	var info_height = document.getElementById('infodiv').offsetHeight;
	document.getElementById("infodiv").style.top = (window.innerHeight/2-info_height/2-10)+"px";
	document.getElementById("infodiv").style.left = (window.innerWidth/2-info_width/2)+"px";
    }
    //    console.log(myprob+":"+mypay+":"+myoption)

    //reveal all unobserved features
    for(var optionid=1; optionid<=3;optionid++){
	for(var whichfeature = 0; whichfeature<2;whichfeature++){
	    var features = ["prob","pay"];
	    
	    var featureid = "trial"+trialindex+"_"+features[whichfeature]+optionid;

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
}

function nextTrial(){ //assumes all DOM elements associated with a trial have class 'trial'
    // var paras = document.getElementsByClassName('trial');
    // while(paras[0]){
    // 	paras[0].parentNode.removeChild(paras[0]);
    // }
    trialindex++;
    choice_live = false; //toggle responsiveness of these buttons.
    feature_live = true;

    if(trialindex>=trials.length){
	localStorage.setItem("ppntscore",scorecounter);
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

    var mychoosebutton = button_string(probid+"::"+payid,"trial choicebutton","buttons/choosebutton.png","buttons/choosebutton_hilight.png","buttons/choosebutton_pulled.png","click_choice",
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
var trials = [];
for(var atrial = 0; atrial < n_trials; atrial++){
    trials.push( new makeTrial("trial"+atrial+"_", get_obsbudget(), get_prob(), get_prob(), get_prob(), get_payoff(), get_payoff(), get_payoff()))
}


var superbest = 0;
var rnd_guess = 0;
for(var i = 0; i<trials.length;i++){
    var ex_val = [];
    for(var option =0;option<3;option++){
	ex_val.push(trials[i].probfeatures[option]*trials[i].payfeatures[option])
    }
    superbest+=(ex_val.reduce(function(a, b) {return Math.max(a, b)}));
    rnd_guess+=(ex_val.reduce(function(a, b) {return a+b}))/ex_val.length;//ugh, javascript? Better way avg?

}

localStorage.setItem("bestscore",superbest);
localStorage.setItem("rndscore",rnd_guess);


trials[0].drawMe()


// var prob_button = button_string("prob1","dice_noshadow.png","dice_shadow.png","dice_highlight.png","click_feature",0,0,100,100)
// var pay_button = button_string("pay1", "payout_noshadow.png","payout_shadow.png","payout_highlight.png","click_feature",0,-200,100,100)
// document.getElementById("uberdiv").innerHTML += prob_button;
// document.getElementById("uberdiv").innerHTML += pay_button;
