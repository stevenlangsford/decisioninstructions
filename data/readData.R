library(tidyverse)
library(patchwork)
theme_set(theme_light())

rm(list = ls())

demographicsdf <- read.csv("raw/demographicsdata.csv")

##TODO: exclusion criteria

raw_responsesdf <- read.csv("raw/responsedata.csv") %>%
    rename(ppntid = ppntID)#style guide

observationsdf <- raw_responsesdf %>%
    select(starts_with("obs"))

bob <- observationsdf$observations[1]

scrape_array <- function(x){
    gsub("\"|\\[|\\]", "", x) %>% str_split(",") %>% pluck(1)
}

## trial_to_actions <- function(arow){
##     data.frame(action_type = "observation",
##                action_result = 
    
## }
