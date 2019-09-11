rm(list = ls())
source("readData.R")

##You don't really care what the actual score is, you care about the expected score for the option chosen, reduce the variance in your analysis muchly. Probably easiest to do expected score of all options in the js, whack it on the save obj and just read it out here

ppnt_performance.df <- raw_responses.df %>%
    mutate(gain = score_after_choice - score_before_choice) %>%
    group_by(ppntid, obsbudget_initial) %>%
    summarize(count = n(), meangain = mean(gain))

ppnt_performance <- function(my_ppntid){
    my.plot <-
        ggplot(ppnt_performance.df,
                      aes(x = obsbudget_initial, y = meangain)) +
        geom_line() +
        geom_point(aes(size = count))

    return(my.plot)
}


ppnt_performance("7187427")
