library(tidyverse)
##This is the setup you have to mimic to run goldenline.R:
rm(list = ls())
##World params:
prob_levels <- c("lowprob", "midprob", "highprob")
problevel_prob <- c(.4, .2, .4)
problevel_value <- c(.25, .5, .75)

payoff_levels <- c("lowpay", "midpay", "highpay")
paylevel_prob <- c(.1, .8, .1)
paylevel_value <- c(13, 20, 27)
prob_na_expected <- .5
pay_na_expected <- 20
value_na_na <- 10

##Use the world params to figure out what the optimal paths are
##ie the 'golden line' of states reachable under optimal play
source("goldenline.R")

obs_budget <- 4 #optimal strategy depends on how many obs you have

source("get_strategy.R")#words for opt strategy stored in "instruction_list"

source("eval_strategy.R")#creates performance.plot
