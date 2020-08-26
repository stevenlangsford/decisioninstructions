source("readData.R")

##Did participant performance differ by instruction condition?
ggplot(strategy_trials, aes(x = as.character(ppntid), y = choiceloss)) +
    geom_point() +
    facet_grid(condition~instructiontype) +
    geom_hline(data = responsedf %>%
                   group_by(condition, instructiontype) %>%
                   summarize(meanloss = mean(choiceloss)),
               aes(yintercept = meanloss),
               color = "red"
               )

##Did participant observations differ by instruction condition?

