
import os
import pandas as pd
import numpy as np
import json
import pingouin as pg
from scipy import stats
from scipy.stats import pearsonr

# ID = "147589736_147589736"
# ID = "101286468_101286468"
_mainDirectory = "sessions"



def extract_one_line_participant_exp_data_failed(ID, type):

    """
    type can be human_only or computer_only
    """

    # reading the file
    filepath = _mainDirectory + '/' + ID + '_experiment_results.txt'
    df=pd.read_csv(filepath, sep=';')

    # kept trials: trials without warning (80 trials per block)
    df_kept = df[df['popupType'].apply(lambda x: isinstance(x, float))]

    # failed trials
    df_failed = df_kept.copy()

    if type == 'human_only':
        df_failed = df_failed[(
            (df_failed['firstClickType'] == 1) &
            ((df_failed['secondClickType'] == 0) | (df_failed['secondClickType'].isna()))
        )]


    elif type == 'computer_only':
        df_failed = df_failed[
            ((df_failed['firstClickType'] == 0) & (df_failed['secondClickType'].isna()))
        ]

    # initializing variables
    nb_trials = list()
    searchTime = list()
    waitingTime = list()
    peakSpeed = list()
    accelerationTime = list()
    distance = list()
    clickTime = list()
    distanceToTargetWhenClick = list()
    mean_SoA = list()


    for block in np.arange(1, 7):

        # one of the six block
        df_failed_block = df_failed[df_failed['block']==block+1]
        
        # ******   variables that are measured block 0-6  *******
        
        nb_trials.append(len(df_failed_block))
        searchTime.append(df_failed_block['searchTime'].mean())
        waitingTime.append(df_failed_block['features_waitingTime'].mean())
        peakSpeed.append(df_failed_block['features_peakSpeed'].mean())
        accelerationTime.append(df_failed_block['features_accelerationTime'].mean())
        distance.append(df_failed_block['features_distance'].mean())

        if type == 'human_only':
            clickTime.append(df_failed_block['humanClickTime'].mean())
            distanceToTargetWhenClick.append(df_failed_block['distanceToTargetWhenHumanClick'].mean())
        elif type == 'computer_only':
            clickTime.append(df_failed_block['virtualClickTime'].mean())
            distanceToTargetWhenClick.append(df_failed_block['distanceToTargetWhenVirtualClick'].mean())

        mean_SoA.append(df_failed_block['perceivedFirstClickType'].mean())

    variables = {
        'searchTime': searchTime, 'waitingTime': waitingTime, 'peakSpeed': peakSpeed, 'accelerationTime': accelerationTime, 'distance': distance, \
        'clickTime': clickTime, 'distanceToTargetWhenClick': distanceToTargetWhenClick,  \
        'mean_SoA': mean_SoA, \
        'nb_trials': nb_trials \
        }        

    return variables


def testing_against_0(var1, title):

    if stats.shapiro(var1)[1]>0.05:
        a = stats.ttest_1samp(var1, 0) 
        print(title +  ': mean = %.2f +/- %.2f; (t-test) t(%d) = %.2f; p = %.4f; Cohen d=%.2f' % (np.nanmean(np.array(var1)), np.nanstd(np.array(var1), ddof=1), a.df, a.statistic, a.pvalue, np.nanmean(np.array(var1))/np.nanstd(np.array(var1), ddof=1)))
    else: 
        a2 = pg.wilcoxon(var1)
        print(title +  ': mean = %.2f +/- %.2f; (pingouin Wilcoxon) t = %.2f; p = %.4f; effect size r(rb)=%.2f' % (np.nanmean(np.array(var1)), np.nanstd(np.array(var1), ddof=1), a2['W-val'].Wilcoxon, a2['p-val'].Wilcoxon, a2['RBC'].Wilcoxon))


# ************** MAIN CODE ***************

directory = os.fsencode(_mainDirectory)
doneIDs = []

columns = ['ID', 
'searchTime1', 'ST2', 'ST3', 'ST4', 'ST5', 'ST6',
'waitingTime1', 'WT2', 'WT3', 'WT4', 'WT5', 'WT6',
'peakSpeed1', 'PS2', 'PS3', 'PS4', 'PS5', 'PS6',
'accelerationTime1', 'AT2', 'AT3', 'AT4', 'AT5', 'AT6',
'distance1', 'D2', 'D3', 'D4', 'D5', 'D6',
'clickTime1', 'CT2', 'CT3', 'CT4', 'CT5', 'CT6',
'distanceToTargetWhenClick1', 'DTTC2', 'DTTC3', 'DTTC4', 'DTTC5', 'DTTC6',
'meanSoA1', 'SoA2', 'SoA3', 'SoA4', 'SoA5', 'SoA6',
'nTrials1', 'nT2', 'nT3', 'nT4', 'nT5', 'nT6'
]


df_all_human_only = pd.DataFrame(columns=columns)
df_all_computer_only = pd.DataFrame(columns=columns)

for file in os.listdir(directory):
    filename = os.fsdecode(file)
    if (filename[-4:] != ".txt"): continue
    if (filename.split('_')[2] != 'experiment'): continue
    fileSessionID = filename.split('_')[1]
    fileSubjectID = filename.split('_')[0]
    ID = fileSubjectID + '_' + fileSessionID
    if (ID=='203792202_203792202'): continue # excluded participant
    if (ID=='99653929_99653929'): continue # remove participant who always answered she won
    if (ID=='45996241_45996241'): continue # remove participant who answered only twice that it was not hear
    # if (ID=='25001438_25001438'): continue # outlier
    if ID not in doneIDs:

        # where am I
        print(ID)

        # reading the data
        doneIDs.append(ID)

        for failed_type in ['human_only', 'computer_only']:
        
            exp_variables = extract_one_line_participant_exp_data_failed(ID, failed_type)

            # exp data
            all_variables = {**exp_variables}
            all_values = [ID] + [value for values in all_variables.values() for value in values]
            series = pd.Series(all_values)
            df = pd.DataFrame(series.values.reshape(1, -1), columns=columns)

            if failed_type == 'human_only':
                df_all_human_only = pd.concat([df_all_human_only, df])
            elif failed_type == 'computer_only':
                df_all_computer_only = pd.concat([df_all_computer_only, df])

        
df_all_human_only.set_index(np.arange(len(df_all_human_only)), inplace=True)
df_all_human_only.to_csv('results/all_participants_exp_data_human_only.csv')

df_all_computer_only.set_index(np.arange(len(df_all_computer_only)), inplace=True)
df_all_computer_only.to_csv('results/all_participants_exp_data_computer_only.csv')

print('Number of participants for human only = ' + str(len(df_all_human_only)))
print('Number of participants for computer only = ' + str(len(df_all_computer_only)))

# Report the number of these failed trials
def report_number_failed_trials(df, title):
    row_sums = df[['nTrials1', 'nT2', 'nT3', 'nT4', 'nT5', 'nT6']].sum(axis=1)
    mean_val = row_sums.mean()
    std_val = row_sums.std()
    print('Number of %s trials = %.0f +/- %.0f' %(title, mean_val, std_val))

report_number_failed_trials(df_all_human_only, 'HUMAN ONLY')
report_number_failed_trials(df_all_computer_only, 'COMPUTER ONLY')

# Report the average SoA of these failed trials
def report_soa_failed_trials(df, title):
    value_cols = ['meanSoA1', 'SoA2', 'SoA3', 'SoA4', 'SoA5', 'SoA6']
    weight_cols = ['nTrials1', 'nT2', 'nT3', 'nT4', 'nT5', 'nT6']
    values = df[value_cols].to_numpy(dtype=float)
    weights = df[weight_cols].to_numpy(dtype=float)
    mask = ~(weights == 0)
    values_masked = np.where(mask, values, 0.0)
    weights_masked = np.where(mask, weights, 0.0)
    num = np.sum((values_masked * weights_masked), axis=1)
    denom = np.sum(weights_masked, axis=1)
    row_weighted_mean = np.divide(
        num,
        denom,
        out=np.full(num.shape, np.nan),
        where=denom != 0
    )
    mean_val = np.nanmean(row_weighted_mean)
    std_val = np.nanstd(row_weighted_mean, ddof=1)
    print('SoA for %s trials = %.2f +/- %.2f' %(title, mean_val, std_val))


report_soa_failed_trials(df_all_human_only, 'HUMAN ONLY')
report_soa_failed_trials(df_all_computer_only, 'COMPUTER ONLY')

# Test if there is an evoluation through the experiment

blocks = np.array([1, 2, 3, 4, 5, 6])
SoA_computer_only = np.array(df_all_computer_only[['meanSoA1', 'SoA2', 'SoA3', 'SoA4', 'SoA5', 'SoA6']]).astype(float)
SoA_human_only = np.array(df_all_human_only[['meanSoA1', 'SoA2', 'SoA3', 'SoA4', 'SoA5', 'SoA6']]).astype(float)

corr_coeff_computer_only = list()
corr_coeff_human_only = list()

for subject in range(len(SoA_human_only)):

    mask_h = ~np.isnan(SoA_human_only[subject, :])
    mask_c = ~np.isnan(SoA_computer_only[subject, :])

    if np.sum(mask_c) >= 2:
        corr_coeff_computer_only.append(pearsonr(blocks[mask_c], SoA_computer_only[subject, mask_c])[0])
    else:
        corr_coeff_computer_only.append(np.nan)

    corr_coeff_human_only.append(pearsonr(blocks[mask_h], SoA_human_only[subject, mask_h])[0])

testing_against_0(corr_coeff_computer_only, 'corr coeff computer only')
testing_against_0(corr_coeff_human_only, 'corr coeff human only')
