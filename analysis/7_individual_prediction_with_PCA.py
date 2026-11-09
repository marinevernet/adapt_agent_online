import os
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np
import pingouin as pg

from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import cross_val_score

from scipy.stats import ttest_1samp
from scipy import stats

# ***************  CHOICE OF PARAMETERS AND INITIALIZE VARIABLES ***************

_mainDirectory = 'sessions'
_ID = ''
# _ID = "147589736_147589736" # the first subject

pred_colums2 = ['block', 'searchTime', 'peakSpeed', 'accelerationTime', 'distance', 'waitingTime', 'humanClickTime', 'virtualClickTime', 'distanceToTargetWhenHumanClick', 'distanceToTargetWhenVirtualClick', 'timeBetweenClicks']
label = 'perceivedFirstClickType'



# ************** FUNCTIONS ***************


# Function to load the data of one participant
# --------------------------------------------
def reading_data(filepath):

    df=pd.read_csv(filepath, sep=';')

    df.drop(df[df['block'] <2].index, inplace = True) # remove the training trials and training block
    df.drop(df[df['block'] >7].index, inplace = True) # remove the extra-blocks, if any
    df = df[df['popupType'].apply(lambda x: isinstance(x, float))] # remove the trials with warnings
    df.drop(df[df['timeBetweenClicks'] >= 0].index, inplace = True) # keep only successful algorithm
    columns = ['block', 'searchTime', 'features_peakSpeed', 'features_accelerationTime', 'features_distance', 'features_waitingTime', 'humanClickTime', 'virtualClickTime', 'distanceToTargetWhenHumanClick', 'distanceToTargetWhenVirtualClick', 'timeBetweenClicks', 'perceivedFirstClickType']
    df = df[columns]
    df = df.rename(columns={'features_peakSpeed': 'peakSpeed', 'features_accelerationTime': 'accelerationTime', 'features_distance': 'distance', 'features_waitingTime': 'waitingTime'})
    df = df.dropna()

    return df


# Scale individual data frame
# ---------------------------
def df_scaling(df, label):

    # Define Feature matrix ad Target vector
    X = df.drop(label, axis=1)
    y = df[label]

    # Feature scaling
    sc = StandardScaler()
    X_scaled = sc.fit_transform(X)

    # Create a new DataFrame with scaled features
    X_scaled_df = pd.DataFrame(X_scaled, columns=X.columns, index=X.index)

    # Concatenate the scaled features DataFrame with the target column
    df_scaled = pd.concat([X_scaled_df, y], axis=1)

    return df_scaled


# Running the PCA (all participants)
# ----------------------------------
def running_pca(df, label):

    df.reset_index(drop=True, inplace=True)

    X = df.drop([label, 'participant'], axis=1)
    y = df[[label, 'participant']]

    # PCA components
    pca = PCA(n_components=None)
    pca.fit(X)
    df_pca_components = pd.DataFrame(data = pca.components_, columns = pred_colums2)
    pc_index = ['PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6', 'PC7', 'PC8', 'PC9', 'PC10', 'PC11']
    df_pca_components = df_pca_components.rename(index=dict(zip(df_pca_components.index, pc_index)))

    # PCA transformation
    X_pca = pca.fit_transform(X)
    X_pca_df = pd.DataFrame(X_pca)
    df_pca = pd.concat([X_pca_df, y], axis=1)

    return df_pca, df_pca_components, pca.explained_variance_ratio_


# Function to decode the SoA from some predictors
# -----------------------------------------------
def decoding_SoA2(df, label, nb_components):

    X = df.iloc[:, 0:nb_components].to_numpy()
    y = df[label].to_numpy()

    # Creating the classification model with normalization
    model = make_pipeline(StandardScaler(), LogisticRegression())

    # Calculating AUC using cross-validation
    auc_scores = cross_val_score(model, X, y, cv=5, scoring='roc_auc')

    # Calculating the average AUC score
    average_auc = auc_scores.mean()

    return average_auc




# ************** MAIN ***************

directory = os.fsencode(_mainDirectory)
_doneIDs = []

df_all = pd.DataFrame(columns=pred_colums2 + [label])

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
    if ID not in _doneIDs:
        _doneIDs.append(ID)

        # name of the file
        print("# " + ID + " #")
        filepath = _mainDirectory + '/' + ID + '_experiment_results.txt'

        # loading the data
        df=reading_data(filepath)

        # selecting the columns
        df=df[pred_colums2 + [label]]

        # scaling the data
        df_scaled = df_scaling(df, label)

        # adding a column with the ID
        df_scaled['participant']=ID

        # concatenating to the group df
        df_all = pd.concat([df_all, df_scaled])

    else:
        continue

# applying pca
df_pca, df_pca_components, pca_explained_variance = running_pca(df_all, label)

# decoding

all_auc = list()

for nb_components in np.arange(1,len(pred_colums2)+1):

    print('\nNumber of PCA components: %d' % nb_components)
    print('Explained variance = %.3f' % pca_explained_variance[:nb_components].sum())

    auc = list()
    for ID in _doneIDs:
        df_participant = df_pca[df_pca['participant']==ID]
        average_auc = decoding_SoA2(df_participant, label, nb_components)

        auc.append(average_auc)

    all_auc.append(auc)

    auc = np.array(auc)

    if stats.shapiro(auc)[1]>0.05:
        a = stats.ttest_1samp(auc, 0.5) #, alternative='greater')
        print('Decoding: AUC = %.2f +/- %.2f; ttest t(%d)=%.2f; p=%.4f; cohen d=%.2f' % (auc.mean(), auc.std(ddof=1), a.df, a.statistic, a.pvalue, (auc.mean()-0.5)/auc.std(ddof=1)))
    else: 
        # a = stats.wilcoxon(auc-0.5*np.ones(len(auc)))
        # effect_size_rb = 1-(2*a.statistic/(len(auc)*(len(auc+1))))
        # print('Decoding: AUC = %.2f +/- %.2f; Wilcoxon t=%.10f; p=%.4f; effect size r(rb)=%.2f' % (auc.mean(), auc.std(ddof=1), a.statistic, a.pvalue,  effect_size_rb))
        a = pg.wilcoxon(auc-0.5*np.ones(len(auc)))
        print('Decoding: AUC = %.2f +/- %.2f; Wilcoxon t=%.10f; p=%.4f; effect size r(rb)=%.2f' % (auc.mean(), auc.std(ddof=1), a['W-val'].Wilcoxon, a['p-val'].Wilcoxon,  a['RBC'].Wilcoxon))
    

all_auc = np.array(all_auc) 

# paired tests: all numbers of components are evaluated on the same participants
# one-sided: is the decoding in auc1 better than the decoding in auc2?
def paired_test_greater(auc1, auc2):
    if stats.shapiro(auc1-auc2)[1]>0.05:
        a = stats.ttest_rel(auc1, auc2, alternative='greater')
        stat_text = 'paired ttest t(%d)=%.2f; p=%.4f' % (a.df, a.statistic, a.pvalue)
    else:
        a = stats.wilcoxon(auc1, auc2, alternative='greater')
        stat_text = 'Wilcoxon t=%.2f; p=%.4f' % (a.statistic, a.pvalue)
    return a.pvalue, stat_text

# comparing each number of components to the maximum decoding performance
best_idx = np.argmax(all_auc.mean(axis=1))
ceiling_idx = best_idx # smallest number of components not significantly lower than the maximum
print('\nMaximum decoding performance is obtained with %d components: AUC = %.2f +/- %.2f' % (best_idx+1, all_auc[best_idx].mean(), all_auc[best_idx].std(ddof=1)))
for idx in np.arange(len(pred_colums2)):

    if idx == best_idx: continue

    pvalue, stat_text = paired_test_greater(all_auc[best_idx], all_auc[idx])

    if pvalue < 0.05:
        print('%d component(s): significantly lower than the maximum decoding performance (AUC = %.2f +/- %.2f; %s)' % (idx+1, all_auc[idx].mean(), all_auc[idx].std(ddof=1), stat_text))
    else:
        print('%d component(s): not significantly different from the maximum decoding performance (AUC = %.2f +/- %.2f; %s)' % (idx+1, all_auc[idx].mean(), all_auc[idx].std(ddof=1), stat_text))
        ceiling_idx = min(ceiling_idx, idx)

# comparing each larger number of components to the ceiling (does adding components further increase the decoding?)
print('\nCeiling reached with %d components: AUC = %.2f +/- %.2f' % (ceiling_idx+1, all_auc[ceiling_idx].mean(), all_auc[ceiling_idx].std(ddof=1)))
for idx in np.arange(ceiling_idx+1, len(pred_colums2)):

    pvalue, stat_text = paired_test_greater(all_auc[idx], all_auc[ceiling_idx])

    if pvalue < 0.05:
        print('%d components: significantly higher than with %d components (AUC = %.2f +/- %.2f; %s)' % (idx+1, ceiling_idx+1, all_auc[idx].mean(), all_auc[idx].std(ddof=1), stat_text))
    else:
        print('%d components: not significantly higher than with %d components (AUC = %.2f +/- %.2f; %s)' % (idx+1, ceiling_idx+1, all_auc[idx].mean(), all_auc[idx].std(ddof=1), stat_text))



# *********** PLOTTING THE FIGURE **************

# ------- PREPARATION ---------
# Rename the vriables
df_pca_components = df_pca_components.rename(columns={'block': 'Block',
                                                      'searchTime': 'Search Time',
                                                      'waitingTime': 'Waiting Time',
                                                      'accelerationTime': 'Acceleration Time', 
                                                      'peakSpeed': 'Peak Speed', 
                                                      'distance': 'Distance at Start', 
                                                      'distanceToTargetWhenHumanClick':'Distance at Human Click', 
                                                      'distanceToTargetWhenVirtualClick' : 'Distance at Virtual Click',
                                                      'humanClickTime': 'Human Click Time',
                                                      'virtualClickTime': 'Virtual Click Time',
                                                      'timeBetweenClicks': 'Time Between Clicks'})

# Create a mask to hide values that are not above 0.3 or below -0.3
mask = (df_pca_components.transpose() > 0.3) | (df_pca_components.transpose() < -0.3)

# Name of the PC components
pc_index = ['PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6', 'PC7', 'PC8', 'PC9', 'PC10', 'PC11']

# Calculate upper and lower bounds for shading
upper_bound = [mean + std for mean, std in zip(all_auc.mean(axis=1), all_auc.std(axis=1, ddof=1))]
lower_bound = [mean - std for mean, std in zip(all_auc.mean(axis=1), all_auc.std(axis=1, ddof=1))]

# Calculate cumulative explained variance
cumulative_explained_variance = np.zeros(11)
for nb_components in np.arange(1, len(pred_colums2)+1):
    cumulative_explained_variance[nb_components-1] = pca_explained_variance[:nb_components].sum()

# ------- PLOT ---------
# Create the dual-axes figure
# fig, (ax1, ax2) = plt.subplots(2, 3) #, figsize=(10, 6)) #, sharex=True)
fig = plt.figure(figsize=(7.5, 6.6))  # Adjust the figure size as needed

# Create a grid layout for subplots
gs = fig.add_gridspec(2, 3, width_ratios=[0.15, 1, 0.05], hspace=0.3)
# gs = fig.add_gridspec(3, 3, height_ratios=[1, O.15, 1], width_ratios=[0.15, 1, 0.05])

# Subplot 1 - AUC and explained variance
ax1 = fig.add_subplot(gs[0, 1:2])
# ax1.set_xticklabels([])
ax1.plot(pc_index, all_auc.mean(axis=1), marker='o', label='AUC')
ax1.fill_between(pc_index, upper_bound, lower_bound, alpha=0.3, color='lightblue')
ax1.plot(pc_index, cumulative_explained_variance, marker='o', label='Cumulative Explained Variance')
ax1.legend()
ax1.set_xticklabels(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'])
ax1.set_xlabel('Number of components')
ax1.text(-0.40, 0.9, 'A', transform=ax1.transAxes, fontsize=16, fontweight='bold')

# Subplot 2 - Heatmap
ax2 = fig.add_subplot(gs[1, 1:2])
sns.heatmap(df_pca_components.transpose(), annot=False, center=False, cmap="coolwarm", ax=ax2, cbar=False)
# Annotate the heatmap with the non-masked values
for i in range(mask.shape[0]):
    for j in range(mask.shape[1]):
        if mask.iloc[i,j]:
            ax2.text(j + 0.5, i + 0.5, f'{df_pca_components.transpose().iloc[i,j]:.2f}', ha='center', va='center', fontsize=10, color='black')
# Define the coordinates for the square
x_start, x_end = 0, 6
y_start, y_end = 0, 11
# Draw a black rectangle around the first six components
ax2.hlines(y=y_start, xmin=x_start, xmax=x_end, colors='black', linewidth=4)
ax2.hlines(y=y_end, xmin=x_start, xmax=x_end, colors='black', linewidth=4)
ax2.vlines(x=x_start, ymin=y_start, ymax=y_end, colors='black', linewidth=4)
ax2.vlines(x=x_end, ymin=y_start, ymax=y_end, colors='black', linewidth=2)
# ax20 = fig.add_subplot(gs[1, 0])
ax2.text(-0.40, 0.9, 'B', transform=ax2.transAxes, fontsize=16, fontweight='bold')

# Create a colorbar
cbar_ax = fig.add_axes([0.85, 0.125, 0.02, 0.32])  # Adjusted position
# cbar = fig.colorbar(ax2.get_children()[0], cax=cbar_ax)
cbar = fig.colorbar(ax2.collections[0], cax=cbar_ax)

# Save and show the plot
plt.savefig('figures/PCA_figure.png', dpi=300, bbox_inches='tight')
plt.show()








