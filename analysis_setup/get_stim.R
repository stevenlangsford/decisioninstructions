##assumes setup_params ran, ie all these exist:
set.seed(4)
##Cond 1

## prob_levels <- c("lowprob", "midprob", "highprob")
## problevel_prob <- c(1/3, 1/3, 1/3)
## problevel_value <- c(0.25, 0.5, 0.75)

## payoff_levels <- c("lowpay", "midpay", "highpay")
## paylevel_prob <- c(.25, .5, .25)
## paylevel_value <- c(15, 20, 25)

##Cond 2
## prob_levels <- c("lowprob", "midprob", "highprob")
## problevel_prob <- c(.2, .6, .2)
## problevel_value <- c(.1, .5, .9)

## payoff_levels <- c("lowpay", "midpay", "highpay")
## paylevel_prob <- c(1/3, 1/3, 1/3)
## paylevel_value <- c(5, 50, 95)


stim.n <- 1000 * 3 #counts options: 3 options per trial.
sigfigs <- 3
##Maybe you should start with sensible-looking distributions,
##then discretize them to get a strategy.
##Going the other way like this is a bit odd.
##You could also generate trials directly in the javascript. So R has nice tools for working with distributions, you're not using them atm and the copypaste is a bad look?
probgap <- .1
paygap <- 5

prob_pool <- list()
pay_pool <- list()

for (i in 1:length(problevel_prob)){
    prob_pool[[i]] <- runif(ceiling(stim.n * problevel_prob[i]),
                            problevel_value[i] - probgap,
                            problevel_value[i] + probgap)
}

for (i in 1:length(paylevel_prob)){
    pay_pool[[i]] <- runif(ceiling(stim.n * paylevel_prob[i]),
                            paylevel_value[i] - paygap,
                            paylevel_value[i] + paygap)
}

##sample shuffles, but also enforces length in case ceiling rounded up.
prob_pool <- unlist(prob_pool) %>% signif(sigfigs) %>% sample(stim.n)
pay_pool <- unlist(pay_pool) %>% signif(sigfigs) %>% sample(stim.n)


stimlist <- map2(prob_pool, pay_pool, c)

js_string <- function(threeoptions, indexid){
##    to match:
    ## new makeTrial("trial"+atrial+"_",
    ## get_obsbudget(),
    ## get_prob(),
    ## get_prob(),
    ## get_prob(),
    ## get_payoff(),
    ## get_payoff(),
    ## get_payoff()))

    ##obs budget is random in 1:6 ?
    ##actually the -1 on indexid is important :-(
    retstring <- (paste0("new makeTrial(\"trial", (indexid - 1), "_\",",
                            sample(1:6, 1), ",",
                            threeoptions[[1]][1], ",", #probs
                            threeoptions[[2]][1], ",",
                            threeoptions[[3]][1], ",",
                            threeoptions[[1]][2], ",", #payoffs
                            threeoptions[[2]][2], ",",
                            threeoptions[[3]][2],
                            "),\n"))
    return(
        retstring
    )
}

for (trialindex in 1:(stim.n / 3) * 3 - 2){
    cat(js_string(stimlist[trialindex:(trialindex + 2)], (trialindex + 2) / 3))
}
