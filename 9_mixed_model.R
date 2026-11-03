# Mixed-effects logistic regression of the local SoA (single trials)
# Predictors: those of the best model selected in 5_fitting_models.py
# Participants as random effects: random intercepts, and random intercepts + random slopes

library(lme4)


# ***************  CHOICE OF PARAMETERS ***************

main_directory <- "sessions"

excluded_IDs <- c("203792202_203792202",  # participant with ADHD diagnosis
                  "99653929_99653929",    # participant who always answered she won
                  "45996241_45996241")    # participant who answered only twice that it was not her

columns <- c("block", "searchTime", "features_peakSpeed", "features_accelerationTime", "features_distance", "features_waitingTime",
             "humanClickTime", "virtualClickTime", "distanceToTargetWhenHumanClick", "distanceToTargetWhenVirtualClick",
             "timeBetweenClicks", "perceivedFirstClickType")

# predictors of the best model selected in 5_fitting_models.py
predictors <- c("block", "searchTime", "peakSpeed", "distance",
                "distanceToTargetWhenHumanClick", "distanceToTargetWhenVirtualClick", "timeBetweenClicks")


# ******************* FUNCTIONS ***************

# Reading the data of one participant (same trial selection as 5_fitting_models.py)
# ---------------------------------------------------------------------------------
reading_data <- function(filepath) {

  df <- read.csv(filepath, sep = ";", na.strings = c("", "NA"))

  df <- df[df$block >= 2 & df$block <= 7, ]                         # remove the training block and the extra-blocks, if any
  df <- df[is.na(df$popupType), ]                                   # remove the trials with warnings
  df <- df[is.na(df$timeBetweenClicks) | df$timeBetweenClicks < 0, ] # keep only successful algorithm
  df <- df[, columns]
  names(df)[names(df) == "features_peakSpeed"] <- "peakSpeed"
  names(df)[names(df) == "features_accelerationTime"] <- "accelerationTime"
  names(df)[names(df) == "features_distance"] <- "distance"
  names(df)[names(df) == "features_waitingTime"] <- "waitingTime"
  df <- na.omit(df)

  return(df)
}


# ************** MAIN *****************************

files <- list.files(main_directory, pattern = "_experiment_results\\.txt$")
IDs <- unique(sapply(strsplit(files, "_"), function(parts) paste(parts[1], parts[2], sep = "_")))
IDs <- setdiff(IDs, excluded_IDs)

df_all <- do.call(rbind, lapply(IDs, function(ID) {
  df <- reading_data(file.path(main_directory, paste0(ID, "_experiment_results.txt")))
  df$participant <- ID
  df
}))
df_all$participant <- factor(df_all$participant)

cat("Number of participants =", nlevels(df_all$participant), "\n")
cat("Number of trials =", nrow(df_all), "\n\n")

# normalizing the predictors across all trials (as in 5_fitting_models.py)
df_all[predictors] <- scale(df_all[predictors])

fixed_part <- paste("perceivedFirstClickType ~", paste(predictors, collapse = " + "))
control <- glmerControl(optimizer = "bobyqa", optCtrl = list(maxfun = 1e5))

# Model 1: random intercepts only
model_intercepts <- glmer(as.formula(paste(fixed_part, "+ (1 | participant)")),
                          data = df_all, family = binomial, control = control)

# Model 2: random intercepts + random slopes for all predictors (uncorrelated random effects)
model_slopes <- glmer(as.formula(paste(fixed_part, "+ (1 +", paste(predictors, collapse = " + "), "|| participant)")),
                      data = df_all, family = binomial, control = control)

for (model_name in c("model_intercepts", "model_slopes")) {
  model <- get(model_name)
  cat("\n> ", model_name, "\n")
  print(summary(model))
  cat("Singular fit:", isSingular(model), "\n")
  cat("Convergence messages:", if (length(model@optinfo$conv$lme4$messages) == 0) "none" else model@optinfo$conv$lme4$messages, "\n")
}

cat("\n> Comparison of the two models\n")
print(anova(model_intercepts, model_slopes))
