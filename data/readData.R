library(tidyverse)
library(patchwork)
theme_set(theme_light())

rm(list = ls())

demographicsdf <- read.csv("raw/demographicsdata.csv")


instruction_typer <- function(astring){
    if (nchar(astring) < 10) return("none")
    if (nchar(astring) > 60) return("complex")
    return("simple")
}
responsedf <- read.csv("raw/responsedata.csv") %>%
    rename(ppntid = ppntID)%>%#style guide
    select(-isatrial,#distinguishes from splash screens: which don't save
           -obsbudget, #current obs left, forced to be 0 at save-time
           -obsbudget_initial#unreliable, confusing with phase changes
           ) %>% mutate(
                   bestvalue = pmax(expectedvalue1,
                                     expectedvalue2,
                                    expectedvalue3),
                   chosebest = chose_expectation == bestvalue,
                   choiceloss = chose_expectation - bestvalue,
                   instructiontype = sapply(as.character(myinstructions),
                                            instruction_typer)
                   )

##exclusion criteria: performance on phase2
phase2accuracy <- responsedf %>%
    filter(phase == "phase2") %>%
    group_by(ppntid) %>%
    summarize(accuracy = mean(chosebest))%>%
    ungroup()

##NO EXCLUSIONS ON SELF TEST DATA
## badaccuracy <- phase2accuracy %>%
##     filter(accuracy < .65) %>% pull(ppntid)
## responsedf <- responsedf%>%filter(!ppntid%in%badaccuracy) 

#this global prep + function + nrow() loop is an antipattern :-(
strategy_trials <- responsedf %>% filter(phase == "phase3")
obsdf <- data.frame()
obs_byrow_scraper <- function(mytrial) {
    scrape_array <- function(x) {
        gsub("\"|\\[|\\]", "", x) %>% str_split(",") %>% pluck(1)
    }


    arow <- strategy_trials[mytrial, ]

    obsdf <- data.frame(
        feature_observed = map(strsplit(scrape_array(arow$observations), "_"),
                               function(x){x[[2]]}) %>% as_vector,
        time_observed = scrape_array(arow$obstime),
        observation_order = 1:length(scrape_array(arow$observations)),
        trialrow = mytrial,
        ppntid = arow$ppntid,
        instructions = arow$instructiontype,
        condition = arow$condition,
        study_trialindex = arow$trialindex,
        total_obs = length(scrape_array(arow$observations))
    )
    obsdf$value_observed <- as.numeric(arow[, as.character(obsdf$feature_observed)])
    return(obsdf)
}

for(i in 1:nrow(strategy_trials)){
    ##there has got to be a tidy idiom for this row-processing
    ##go learn some purrr
    obsdf <- rbind(obsdf, obs_byrow_scraper(i))
}

for (i in 1:nrow(obsdf)) {#another anitpattern
    myobs <- as.character(obsdf[i,"feature_observed"])
    obsdf[i,"featuretype"] <- substr(myobs, 1, nchar(myobs)-1) #the only option ids are 1,2,3
}
