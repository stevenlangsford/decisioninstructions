library(tidyverse)
##This is the setup you have to mimic to run goldenline.R:
rm(list = ls())

condition1 <- TRUE #ok I know this is an utterly horrible hack
condition2 <- !condition1 #Sorrynotsorry

if (condition1){
    ##World params:
    print("cond1")
    prob_levels <- c("lowprob", "midprob", "highprob")
    problevel_prob <- c(1/3, 1/3, 1/3)
    problevel_value <- c(0.25, 0.5, 0.75)

    payoff_levels <- c("lowpay", "midpay", "highpay")
    paylevel_prob <- c(.25, .5, .25)
    paylevel_value <- c(15, 20, 25)

    ##Use the world params to figure out what the optimal paths are
    ##ie the 'golden line' of states reachable under optimal play
    source("goldenline.R")

    #should loop over all obsbudgets (which eval plot already does)
#    obs_budget <- 5 #optimal strategy depends on how many obs you have
#    source("get_strategy.R")#words for opt strategy stored in "instruction_list"


    
    source("eval_strategy.R")#creates performance.plot
}



if (condition2){
    ##World params:
    prob_levels <- c("lowprob", "midprob", "highprob")
    problevel_prob <- c(.2, .6, .2)
    problevel_value <- c(.1, .5, .9)

    payoff_levels <- c("lowpay", "midpay", "highpay")
    paylevel_prob <- c(1/3, 1/3, 1/3)
    paylevel_value <- c(5, 50, 95)
    
    ##Use the world params to figure out what the optimal paths are
    ##ie the 'golden line' of states reachable under optimal play
    source("goldenline.R")

    obs_budget <- 2 #optimal strategy depends on how many obs you have
    source("get_strategy.R")#words for opt strategy stored in "instruction_list"
    save(instruction_list, file = "cond_stuff/cond2obs2.RData")

    source("eval_strategy.R")#creates performance.plot
}


print(performance.plot)

##hand-switch between cond1 and cond2, ugh!
## all_instructions_cond2 <- list()
## for (afile in list.files(path = "cond_stuff/", pattern = "cond2.*RData")){
##     load(paste0("cond_stuff/", afile))
##     all_instructions_cond2[[afile]] <- instruction_list
## }

## sink("cond_stuff/all_cond2.txt")
## all_instructions_cond2
## sink()
