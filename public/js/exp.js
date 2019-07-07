//Generic sequence-of-trials
//If that's all you want, all you need to edit is the makeTrial object and the responseListener. Give maketrial an appropriate constructor that accept the key trial properties, a drawMe function, and something that will hit responseListener.
//then put a list of trial-property-setter entries in 'stim' and you're golden.

var trials = [];
var trialindex = 0;

function choose(aresponse){//global so it'll be just sitting here available for the trial objects to use. So, it must accept whatever they're passing.
//    console.log("responseListener heard: "+aresponse); //diag
    trials[trialindex].response = aresponse;
    trials[trialindex].responseTime= Date.now();
    
    // $.post('/response',{myresponse:JSON.stringify(trials[trialindex])},function(success){
    // 	console.log(success);//For now server returns the string "success" for success, otherwise error message.
    // });
    
    //can put this inside the success callback, if the next trial depends on some server-side info.
    trialindex++; //increment index here at the last possible minute before drawing the next trial, so trials[trialindex] always refers to the current trial.
    nextTrial();
}

function reveal(targfeature, targoption){
    if(trials[trialindex].obsbudget == 0){
	alert("You are out of observations. Please choose an option to continue.")
	return;
    }
    if(targfeature == "p"){
	trials[trialindex].probvisible[targoption] = true;
    }
    if(targfeature == "v"){
	trials[trialindex].payvisible[targoption] = true;
    }

    trials[trialindex].obsbudget = trials[trialindex].obsbudget - 1;
    trials[trialindex].drawMe("uberdiv");
}

function nextTrial(){
    if(trialindex<trials.length){
	trials[trialindex].drawMe("uberdiv");
    }else{
	$.post("/finish",function(data){window.location.replace(data)});
    }
}

// a trial object should have a drawMe function and a bunch of attributes.
//the data-getting process in 'dashboard.ejs' & getData routes creates a csv with a col for every attribute, using 'Object.keys' to list all the properties of the object. Assumes a pattern where everything interesting is saved to the trial object, then that is JSONified and saved as a response.
//Note functions are dropped by JSON.
//Also note this means you have to be consistent with the things that are added to each trial before they are saved, maybe init with NA values in the constructor.
function makeTrial(obsbudget, p1, p2, p3, v1, v2, v3){
    this.ppntID = localStorage.getItem("ppntID");
    this.obsbudget = obsbudget;
    this.probfeatures = [p1, p2, p3];
    this.payfeatures = [v1, v2, v3];
    this.probvisible = [false, false, false];
    this.payvisible = [false, false, false];
    this.obstimes = [];
    this.drawTime = -1;

    this.optionDrawstring = function(option_index){
	return "<div class='optiondiv'>" +
	    "<h5>Option "+(option_index + 1)+"</h5>" +
	    (this.probvisible[option_index] ? "<p>Probability: "+this.probfeatures[option_index]+"</p>" : "<button class='revealbutton' onclick='reveal(\"p\","+option_index+")'>Show probability</button>") +
	    (this.payvisible[option_index] ? "<p>Payout: "+this.payfeatures[option_index]+"</p>" : "<button 'revealbutton' onclick='reveal(\"v\","+option_index+")'>Show payout</button>") +
	    "<hr>" + 
	    "<button onclick='choose("+option_index+")'>Choose this option</button>" +
	    "</div>"
    }
    
    this.drawMe = function(targdiv){
	if(this.drawTime == -1) {
	    this.drawTime = Date.now();
	}else{
	    this.obstimes.push(Date.now());
	}
	var mask = "NA"
	var infodisplay =  "<div id='infodisplay'>" +
	    "<h3 id='prompttext'>You can reveal "+this.obsbudget+" more feature"+(this.obsbudget==1 ? "" : "s")+" before you choose</h3>"+
	    this.optionDrawstring(0) +
	    this.optionDrawstring(1) +
	    this.optionDrawstring(2) +
	    "</div>"
	
	document.getElementById(targdiv).innerHTML= infodisplay;

    }
}



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

function rnorm() { //standard normal via Box-Muller
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}
//****************************************************************************************************
//Stimuli
var possible_obsbudgets = [1,2,3,4,5,6];
var sigfigs = 3;
function rnd_payoff(){
    return rnorm()*7+20;
}
function rnd_prob(){
    return Math.random();
}

var hm_trials = 2;
for(i = 0; i < hm_trials; i++){
    trials.push(new makeTrial(shuffle(possible_obsbudgets)[1], rnd_prob().toPrecision(sigfigs), rnd_prob().toPrecision(sigfigs), rnd_prob().toPrecision(sigfigs), rnd_payoff().toPrecision(sigfigs), rnd_payoff().toPrecision(sigfigs), rnd_payoff().toPrecision(sigfigs)))
}


nextTrial();
