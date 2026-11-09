import os
import numpy as np
import pandas as pd
import pingouin as pg

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import cross_val_score

from scipy import stats

from itertools import combinations
from collections import OrderedDict
import pprint

# ***************  CHOICE OF PARAMETERS AND INITIALIZE VARIABLES ***************

run_or_load_the_decoding = 'load'

_mainDirectory = 'sessions'
_ID = ''
# _ID = '227985121_227985121'

pred_colums2 = ['block', 'searchTime', 'peakSpeed', 'accelerationTime', 'distance', 'waitingTime', 'humanClickTime', 'virtualClickTime', 'distanceToTargetWhenHumanClick', 'distanceToTargetWhenVirtualClick', 'timeBetweenClicks']
label = 'perceivedFirstClickType'


# ******************* FUNCTIONS ***************

# Function to load the data of one participant
# --------------------------------------------
def reading_data(filepath):

    df=pd.read_csv(filepath, sep=';')

    df.drop(df[df['block'] <2].index, inplace = True) # remove the training trials and training block
    df.drop(df[df['block'] >7].index, inplace = True) # remove the extra-blocks, if any
    df = df[df['popupType'].apply(lambda x: isinstance(x, float))] # remove the trials with warnings
    df.drop(df[df['timeBetweenClicks'] >= 0].index, inplace = True) # keep only successful algorithm
    # columns = ['block', 'searchTime', 'features_waitingTime', 'features_peakSpeed', 'features_accelerationTime', 'features_distance', 'humanClickTime', 'virtualClickTime', 'distanceToTargetWhenHumanClick', 'distanceToTargetWhenVirtualClick', 'timeBetweenClicks', 'prediction_error', 'perceivedFirstClickType']
    columns = ['block', 'searchTime', 'features_peakSpeed', 'features_accelerationTime', 'features_distance', 'features_waitingTime', 'humanClickTime', 'virtualClickTime', 'distanceToTargetWhenHumanClick', 'distanceToTargetWhenVirtualClick', 'timeBetweenClicks', 'perceivedFirstClickType']
    df = df[columns]
    df = df.rename(columns={'features_peakSpeed': 'peakSpeed', 'features_accelerationTime': 'accelerationTime', 'features_distance': 'distance', 'features_waitingTime': 'waitingTime'})
    df = df.dropna()

    return df


# Function to decode the SoA
# --------------------------
def decoding_SoA(df, label, combo):

    features = df[combo].to_numpy()  # Extracting the feature columns
    labels = df[label].to_numpy() # Extracting the label column

    # Creating the classification model with normalization
    model = make_pipeline(StandardScaler(), LogisticRegression())

    # Calculating AUC using cross-validation
    auc_scores = cross_val_score(model, features, labels, cv=5, scoring='roc_auc')

    # Calculating the average AUC score
    average_auc = auc_scores.mean()

    return average_auc


# Function to analyze an individual's results
# -------------------------------------------
def analyseSubject(ID, label, pred_colums2):

    combo_list = list()
    individual_auc = list()

    # name of the file
    print('# ' + ID + ' #')
    filepath = _mainDirectory + '/' + ID + '_experiment_results.txt'

    # loading the data
    df=reading_data(filepath)

    # decoding for each choice of features
    for r in np.arange(1, len(pred_colums2)+1):
        for combo in combinations(pred_colums2, r):
            
            # for all possible combinations of predictors
            if len(combo) == 1: 
                combo= [combo[0]]
            else:
                combo = np.array(combo)

            average_auc = decoding_SoA(df, label, combo)
            if np.isnan(average_auc): print('nan problem with %s' % ID)
            individual_auc.append(average_auc)
            combo_list.append(combo)

    return individual_auc, combo_list

# Function to batch analyze several individuals in a folder
# ---------------------------------------------------------
def analyseSubjects(label, pred_colums2):

    group_auc = list()

    directory = os.fsencode(_mainDirectory)
    doneIDs = []
    for file in os.listdir(directory):
        filename = os.fsdecode(file)
        if (filename[-4:] != '.txt'): continue
        if (filename.split('_')[2] != 'experiment'): continue
        fileSessionID = filename.split('_')[1]
        fileSubjectID = filename.split('_')[0]
        ID = fileSubjectID + '_' + fileSessionID
        if (ID=='203792202_203792202'): continue # excluded participant
        if (ID=='99653929_99653929'): continue # remove participant who always answered she won
        if (ID=='45996241_45996241'): continue # remove participant who answered only twice that it was not hear
        if ID not in doneIDs:
            doneIDs.append(ID)
            individual_auc, combo_list = analyseSubject(ID, label, pred_colums2)
        else:
            continue

        # appending to the group results
        group_auc.append(individual_auc)


    return group_auc, combo_list




# Main code
# ---------

# decode at the single or group level for each combination of pred_colums2 and calculate the AUC (+ stats if group)
if len(_ID) > 0: 
    individual_auc, combo_list = analyseSubject(_ID, label, pred_colums2)

    print('\n> INDIVIDUAL DECODING FOR PARTICIPANT %s' % _ID)
    for combo_nb, combo in enumerate(combo_list):
        print(combo)
        print(individual_auc[combo_nb])
    np.save('results/combo_list.npy', np.array([list(combo) for combo in combo_list], dtype=object), allow_pickle=True)

else: 

    if run_or_load_the_decoding == 'run':
        group_auc, combo_list = analyseSubjects(label, pred_colums2)
        group_auc = np.array(group_auc)
        np.save('results/group_auc.npy', group_auc)
        np.save('results/combo_list.npy', np.array([list(combo) for combo in combo_list], dtype=object), allow_pickle=True)
    else:
        group_auc = np.load('results/group_auc.npy')
        combo_list = np.load('results/combo_list.npy', allow_pickle=True)
    
    group_auc_mean = group_auc.mean(axis=0)
    sorted_indices = np.argsort(group_auc_mean)[::-1]
    ordered_group_auc = group_auc[:, sorted_indices]
    ordered_combo_list = [combo_list[i] for i in sorted_indices]

    if stats.shapiro(ordered_group_auc[:,0])[1]>0.05:
        stattestbest = 'ttest'
        abest = stats.ttest_1samp(ordered_group_auc[:,0], 0.5) #, alternative='greater')
    else: 
        stattestbest = 'wilcoxon'
        abest = pg.wilcoxon(ordered_group_auc[:,0]-0.5)

    # paired, one-sided tests (all combinations are evaluated on the same participants):
    # is the best combination better than each of the other combinations?
    # all combinations are tested (no stopping at the first significant one)
    equivalent_combos = [0] # the best combination itself
    for combo_nb in np.arange(1, len(sorted_indices)):

        if stats.shapiro(ordered_group_auc[:,0]-ordered_group_auc[:,combo_nb])[1]>0.05:
            stattest = 'paired ttest'
            a = stats.ttest_rel(ordered_group_auc[:,0], ordered_group_auc[:,combo_nb], alternative='greater')
        else: 
            stattest = 'wilcoxon'
            a = stats.wilcoxon(ordered_group_auc[:,0], ordered_group_auc[:,combo_nb], alternative='greater')
        
        if a.pvalue >= 0.05:
            equivalent_combos.append(combo_nb)

    nb_equivalent_combos = len(equivalent_combos)

    count_dict = {element:0 for element in pred_colums2}
    for preds in pred_colums2:
        for combo_nb in equivalent_combos:       
            if preds in ordered_combo_list[combo_nb]:
                count_dict[preds] += 1
        count_dict[preds] = count_dict[preds]/nb_equivalent_combos

    both_TBC_and_block = 0
    only_TBC = 0
    only_block = 0
    for combo_nb in equivalent_combos:       
        if 'block' in ordered_combo_list[combo_nb] and 'timeBetweenClicks' in ordered_combo_list[combo_nb]:
            both_TBC_and_block += 1
        elif 'block' in ordered_combo_list[combo_nb] and 'timeBetweenClicks' not in ordered_combo_list[combo_nb]:
            only_block += 1
        elif 'block' not in ordered_combo_list[combo_nb] and 'timeBetweenClicks' in ordered_combo_list[combo_nb]:
            only_TBC += 1
    both_TBC_and_block = both_TBC_and_block/nb_equivalent_combos
    only_TBC = only_TBC/nb_equivalent_combos
    only_block = only_block/nb_equivalent_combos

    # Format the dictionary values and sort it
    def format_float(value):
        # return f'{value:.2f}'
        return round(value, 2)
    formatted_dict = {key: format_float(value) for key, value in count_dict.items()}
    sorted_count_dict = dict(sorted(formatted_dict.items(), key=lambda item: item[1], reverse=True))
    ordered_dict = OrderedDict(sorted_count_dict)

    print('\n> GROUP DECODING')
    print('number of participants analyzed= ' + str(len(group_auc)))

    print('\nbest decoding:')
    print('AUC = %.2f +/- %.2f' % (ordered_group_auc[:,0].mean(), ordered_group_auc[:,0].std(ddof=1)))
    if stattestbest == 'ttest':
        print('ttest t(%d)=%.2f; p=%.4f; cohen d=%.2f' % (abest.df, abest.statistic, abest.pvalue, (ordered_group_auc[:,0].mean()-0.5)/ordered_group_auc[:,0].std(ddof=1)))
    elif stattestbest == 'wilcoxon':
        # print('wilcoxon t=%.2f; p=%.4f; effect size r(rb)=%.2f' % (abest.statistic, abest.pvalue, 1-(2*abest.statistic/(len(ordered_group_auc[:,0])*(len(ordered_group_auc[:,0])+1)))))    
        print('wilcoxon t=%.2f; p=%.4f; effect size r(rb)=%.2f' % (abest['W-val'].Wilcoxon, abest['p-val'].Wilcoxon, abest['RBC'].Wilcoxon))    

    # print('pvalue (%s) = %.4f' % (stattestbest, abest.pvalue))
    print(ordered_combo_list[0])

    print('\nthere are %d (out of %d) combinations, including the best one, that are not significantly worse than the best one' % (nb_equivalent_combos, len(group_auc_mean)))
    print('(rank of the worst of these combinations: %d)' % (max(equivalent_combos)+1))
    print('and here is the ratio of these combinations containing each of the predictor')
    pp = pprint.PrettyPrinter(width=56, compact=True)
    pp.pprint(ordered_dict)

    print('Here is the ratio of these combinations containing both block and TBC:')
    print(both_TBC_and_block)
    print('Here is the ratio of these combinations containing only TBC:')
    print(only_TBC)
    print('Here is the ratio of these combinations containing only block:')
    print(only_block)



# > GROUP DECODING
# number of participants analyzed= 109

# best decoding:
# AUC = 0.86 +/- 0.080620
# ['block' 'peakSpeed' 'distanceToTargetWhenVirtualClick'
#  'timeBetweenClicks']

# there are 13 (out of 2047) combinations, including the best one, that are not significantly worse than the best one
# (paired one-sided tests, every combination tested, no correction for multiple comparisons)
# (rank of the worst of these combinations: 122)
# OrderedDict([('block', 1.0),
#              ('timeBetweenClicks', 0.85),
#              ('distanceToTargetWhenHumanClick', 0.46),
#              ('distanceToTargetWhenVirtualClick', 0.38),
#              ('peakSpeed', 0.31),
#              ('accelerationTime', 0.23),
#              ('humanClickTime', 0.15),
#              ('virtualClickTime', 0.15),
#              ('searchTime', 0.08), ('distance', 0.0),
#              ('waitingTime', 0.0)])
# Here is the ratio of these combinations containing both block and TBC:
# 0.8461538461538461
# Here is the ratio of these combinations containing only TBC:
# 0.0
# Here is the ratio of these combinations containing only block:
# 0.15384615384615385

# previous version (unpaired tests, ttest_ind / mannwhitneyu, stopping at the first significant difference):
# there were 751 combinations having the same decoding performance than the best one
# block 0.85, timeBetweenClicks 0.83, humanClickTime 0.59, virtualClickTime 0.58, peakSpeed 0.52,
# distanceToTargetWhenVirtualClick 0.52, distanceToTargetWhenHumanClick 0.51, waitingTime 0.5,
# accelerationTime 0.48, distance 0.47, searchTime 0.43
# both block and TBC 0.68 (only TBC 0.15, only block 0.17, after correcting the swapped labels)
