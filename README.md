# adapt_agent_online
This repository contains the code of the online experiment, the data and the analysis scripts for the following study:  Toma M, Mattout J, Quentin R, Rassoulou F, Gautier A, Maby E, Vernet M (2023) Humans progressively feel agency over events triggered before their actions. bioRxiv 2023.12.01.569449

Corresponding author:
Marine Vernet, PhD, CNRS researcher
Lyon Neuroscience Research Center, Impact team
16 Avenue du Doyen Jean Lépine, 69500 Bron, France
marine.vernet@inserm.fr

## How to cite
If you use anything from this repository (code, data, results or figures), please cite the peer-reviewed article once it is available, or the preprint until then:

- **Article:** [Authors (Year). Title. Journal. DOI: to be completed once published]
- **Preprint:** Toma M, Mattout J, Quentin R, Rassoulou F, Gautier A, Maby E, Vernet M (2023) Humans progressively feel agency over events triggered before their actions. bioRxiv 2023.12.01.569449. https://doi.org/10.1101/2023.12.01.569449

## License
This repository is licensed under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/): you may share and adapt its contents for any purpose, provided that you give appropriate credit by citing the study as above. Third-party material is not covered by this license; see [LICENSE](LICENSE) for the list.

## Authors of the code
- **Experiment** (`experiment/`): written by Marcus Toma (d.marcus.toma@gmail.com)
- **Analysis scripts** (`analysis/`): written by Marine Vernet (marine.vernet@inserm.fr)

The experiment also includes third-party code, which keeps its own authors and licenses: the JavaScript libraries in `experiment/the-agency-experiment/scripts/` (`ml_js.js`, `detect_gpu_js.js`, `normal_distribution_js.js`) and `pavlovia_interface.js`, a modified version of the jsPsych plugin for Pavlovia (Alain Pitiot, MIT License).
## Repository structure
- `experiment/`: code and documentation of the online experiment
- `analysis/`: analysis scripts
- `results/`: results computed by the scripts (.csv, .npy)
- `figures/`: figures
- `sessions/`: raw data of each participant

## Experiment
The experiment is a web application (HTML, CSS, JavaScript), available in English and French, that was hosted on [Pavlovia](https://pavlovia.org).

The version used in the study displayed its text in Segoe UI and Univers Condensed. These commercial fonts cannot be shared here, so this repository uses the fonts available on the participant's system instead, and the appearance of the text may differ slightly from the original.

- `experiment/The Agency Experiment - Documentation.docx`: full documentation, written by Marcus Toma (design, technical specifications and implementation, user manual). The `analyser.py` script described in its section on data analysis is not part of this repository; the analyses of the study are those in `analysis/`.
- `experiment/the-agency-experiment/`: code of the experiment
  - `index.html`: entry point
  - `scripts/`: experiment logic, including the online prediction of the participant's click (`predictor.js`, `mouse_processor.js`)
  - `styles/`: style sheets
  - `resources/`: graphics, animations and translated texts

To run the experiment locally, serve its folder with a local server, for example with the Node.js package [http-server](https://www.npmjs.com/package/http-server):

```
npm install -g http-server
cd experiment/the-agency-experiment
http-server
```

Then open the address shown in the terminal (usually `http://localhost:8080`). Results are saved through Pavlovia, so they are not stored when the experiment runs locally (see the user manual in the documentation).

## Data
`sessions/` contains two files for each session, named `SubjectID_SessionID_experiment_results.txt` (trial-by-trial data, semicolon-separated) and `SubjectID_SessionID_survey_results.txt` (questionnaires, comments and session information, JSON). The IDs are generated automatically by the experiment.

## Analysis
The Python environment can be installed with conda (the versions are pinned, and were exported from macOS):

```
conda env create -f analysis/environment_analyze_behav_data.yml
conda activate analyze_behav_data
```

`9_mixed_model.R` requires R and the `lme4` package, which are not part of this environment.

Run the scripts from the root of the repository, for example `python analysis/2_group_analysis.py` (Python) or `source("analysis/9_mixed_model.R")` (R), as the paths are relative to the root.

| Script | Description |
| --- | --- |
| `0_some_parameters.py` | Prints descriptive values of the experiment (trial counts, click times, durations) |
| `1_export_group_data.py` | Exports the data of all participants to `results/` |
| `1_bis_details_IPC.py` | Exports the details of the IPC questionnaire to `results/` |
| `2_group_analysis.py` | Group analyses and main figures; also runs `1_export_group_data.py` and saves `results/all_participants_results_calculation.csv` |
| `3_survey_comments.py` | Analyses of the survey comments; also runs `1_export_group_data.py` and requires the output of `2_group_analysis.py` |
| `4_plotting_parameters.py` | Plots the relationships between the trial parameters and the local sense of agency |
| `5_fitting_models.py` | Fits all combinations of predictors of the local sense of agency and finds the best model |
| `6_individual_prediction.py` | Decodes the local sense of agency of each participant from combinations of predictors |
| `7_individual_prediction_with_PCA.py` | Same decoding from the components of a PCA |
| `9_mixed_model.R` | Mixed-effects logistic regression of the local sense of agency, with the predictors of the best model of `5_fitting_models.py` |
| `11_export_group_data_for_failed_trials.py` | Exports and analyzes the failed trials: the participant clicked before the computer (`human_only`), or only the computer clicked (`computer_only`) |
