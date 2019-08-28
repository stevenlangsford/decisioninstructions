library(tidyverse)
library(hash)
rm(list = ls())
##a dumb string manipulation thing that switches an instruction list
##(as created by get_strategy.R) from condition->action to action <- condition
##Possibly helpful for turning instrucion lists into plain English?


actions <- hash()
include_choose <- FALSE

for (afile in list.files("cond_stuff", pattern = "cond1.*RData")){
    load(paste0("cond_stuff/", afile))

    for (stepcounter in 1:length(instruction_list)){
        astep <- instruction_list[[stepcounter]]
        for (aline in astep){
            myaction <- strsplit(aline, "\\|")[[1]][2]
            if (grepl("choose", myaction) && !include_choose)next;

            mycondition <- paste("step",
                                 stepcounter,
                                 strsplit(aline, "\\|")[[1]][1]
                                 )
            if (is.null(actions[[myaction]])){
                actions[[myaction]] <- list(mycondition)
            }else{
                actions[[myaction]] <- c(actions[[myaction]], mycondition)
            }
        }
    }
}


## for (p_obs in grep(" p ", names(actions), value = TRUE)){
##     print(actions[[p_obs]])
## }
