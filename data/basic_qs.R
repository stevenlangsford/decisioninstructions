source("readData.R")

##Did participant performance differ by instruction condition?
##You might want to split by observation budget?
regret_plot <- ggplot(strategy_trials, aes(x = as.character(ppntid), y = choiceloss)) +
    geom_point() +
    facet_grid(condition~instructiontype) +
    geom_hline(data = responsedf %>%
                   group_by(condition, instructiontype) %>%
                   summarize(meanloss = mean(choiceloss)),
               aes(yintercept = meanloss),
               color = "red"
               )

##Did participant observations differ by instruction condition?
ggplot(obsdf %>% filter(condition == "cond1"), aes(x = featuretype, fill = instructions)) +
    geom_bar(position = "dodge") +
    facet_grid(total_obs~observation_order) +
    guides(fill = FALSE) +
    ggtitle("condition1 (prob better)") +

    ggplot(obsdf %>% filter(condition == "cond2"), aes(x = featuretype, fill = instructions)) + 
    geom_bar(position = "dodge") +
    facet_grid(total_obs~observation_order) +
    ggtitle("condition2 (pay better)")

