

//drawing params
var buttonheight = 100;
var buttonwidth = 100;
var digitheight = 100;
var digitwidth = 100/4;
var circle_size = 280;
var circle_x = 0;
var circle_y = 0;
var feature_precision = 3; //same for prob and pay features (split ?) ref'd at get_

//study params: n stim, dists of each feature, TODO obs budget?

var n_trials = 5;

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

	document.getElementById("uberdiv").innerHTML += trial_string(idstring+"prob1",idstring+"pay1",
								     circle_size+circle_y - 130,//fudge why?
								     0+circle_x,
								     true);
	document.getElementById("uberdiv").innerHTML += trial_string(idstring+"prob2",idstring+"pay2",
								     circle_size*Math.cos(2*Math.PI/3)+circle_y,
								     circle_size*Math.sin(2*Math.PI/3)+circle_x,
								     false);
	document.getElementById("uberdiv").innerHTML += trial_string(idstring+"prob3",idstring+"pay3",
								     circle_size*Math.cos(4*Math.PI/3)+circle_y,
								     circle_size*Math.sin(4*Math.PI/3)+circle_x,
								     false);
    }
}



//helper fns
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

function click_feature(featureid){
    //document.getElementById(featureid).style.display = "none";
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
    console.log(choiceid);
}

function cleartrial(){ //assumes all DOM elements associated with a trial have class 'trial'
    var paras = document.getElementsByClassName('trial');
    while(paras[0]){
	paras[0].parentNode.removeChild(paras[0]);
    }
}

function button_string(id, img, imghover, imgclick, clickfn, top, left, height, width){
    var viewportwidth = window.innerWidth; //used to center element. Viewport size might change! You'll get the one that was current at call time.
    var viewportheight = window.innerHeight;
    
    var drawstring = "<img class = 'trial' id='"+id+"' src='"+img+"' height=\""+height+"\" width=\""+width+"\""+
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

function trial_string(probid, payid, top, left, buttonbelow){
    var viewportwidth = window.innerWidth; //used to center element. Viewport size might change! You'll get the one that was current at call time.
    var viewportheight = window.innerHeight;

    var mychoosebutton = button_string("choose"+probid+payid, "buttons/choosebutton.png","buttons/choosebutton_hilight.png","buttons/choosebutton_pulled.png","click_choice",
				       (buttonbelow ? top+buttonheight*.6 : top-buttonheight*.9),
				       left+buttonwidth*.1,
				       buttonheight*.8,
				       buttonwidth*3);
    var drawstring = ""+
	mychoosebutton +
	button_string(probid, "buttons/dice_noshadow.png","buttons/dice_shadow.png","buttons/dice_highlight.png","click_feature",top,left-buttonwidth/1.2,buttonheight,buttonwidth)+
	button_string(payid, "buttons/payout_noshadow.png","buttons/payout_shadow.png","buttons/payout_highlight.png","click_feature",top,left+buttonwidth/1.2,buttonheight,buttonwidth);

    return drawstring;
}

//MAIN
var trials = [];
for(var atrial = 0; atrial < n_trials; atrial++){
    trials.push( new makeTrial("trial"+atrial+"_", 6, get_prob(), get_prob(), get_prob(), get_payoff(), get_payoff(), get_payoff()))
}

trials[0].drawMe()


// var prob_button = button_string("prob1","dice_noshadow.png","dice_shadow.png","dice_highlight.png","click_feature",0,0,100,100)
// var pay_button = button_string("pay1", "payout_noshadow.png","payout_shadow.png","payout_highlight.png","click_feature",0,-200,100,100)
// document.getElementById("uberdiv").innerHTML += prob_button;
// document.getElementById("uberdiv").innerHTML += pay_button;
