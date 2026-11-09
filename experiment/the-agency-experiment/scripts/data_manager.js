function downloadFile(content, name) {
	var textToWrite = content;
	var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
	var downloadLink = document.createElement("a");
	downloadLink.download = name;
	downloadLink.innerHTML = "download";
	if (window.webkitURL != null) {
		// Chrome allows the link to be clicked without actually adding it to the DOM.
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	}
	else {
		// Firefox requires the link to be added to the DOM before it can be clicked.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}
	downloadLink.click();
}

function removePredictionErrorOutliers() {
	let errors = predictionErrors;
	let errorsMean = p_mean(errors);
	let errorsStdev = p_stdev(errors);
	let cleanErrors = [];
	for (let i = 0; i < errors.length; i++) {
		let error = errors[i];
		let isOutlier = error < errorsMean - 2 * errorsStdev || error > errorsMean + 2 * errorsStdev;
		if (!isOutlier) { cleanErrors.push(error); }
	}
	predictionErrors = [...cleanErrors];
}

class DataManager {

	/* ATTRIBUTES */
	static results = [];
	static surveyResults = {
		initial: {},
		initial2: {},
		postTraining: "",
		breaks: [{}, {}, {}, {}, {}, {}],
		freeComments: ["", ""],
		final: {},
		miscellaneous: {
			experimentStart: "",
			experimentEnd: "",
			gpu: {},
			browser: {}
		}
	};

	/* LOAD BEHAVIOURAL DATA FILE FROM INPUT AND PARSE IT ------------------- */
	static loadBehaviouralData() {
		let inputField = $('#dataFileInput')[0];
		let selectedFile = inputField.files[0];
		var reader = new FileReader();
		reader.onload = function (loadedEvent) {
			let data = JSON.parse(loadedEvent.target.result);
			regressionInputs = data.inputs;
			regressionOutputs = data.outputs;
			predictionErrors = data.predictionErrors;
			sumNearTargetLobes = data.averageNearTargetLobes * data.inputs.length;
			averageNearTargetLobes = data.averageNearTargetLobes;
			clickDelaysAfterGettingCloseToSpecialStimuli = data.clickDelaysAfterGettingCloseToSpecialStimuli;
			console.log("--- DATA HAS BEEN LOADED (" + regressionInputs.length + " entries)");
		}
		reader.readAsText(selectedFile);
		phase = 2;
		block = 2;
		timelineCount = 6;
		trial = trialsPerBlock[0] + trialsPerBlock[1] - 1;
	}

	/* EXPORT BEHAVIOURAL DATA ---------------------------------------------- */
	static exportBehaviouralData() {
		if (phase == 1) { removeErrorOutliers(); }
		let data = JSON.stringify({
			inputs: regressionInputs,
			outputs: regressionOutputs,
			predictionErrors: predictionErrors,
			averageNearTargetLobes: averageNearTargetLobes,
			clickDelaysAfterGettingCloseToSpecialStimuli: clickDelaysAfterGettingCloseToSpecialStimuli
		});
		downloadFile(data, "behavioural_data");
	}

	/* EXPORT EXPERIMENT RESULTS TO PAVLOVIA SERVERS ------------------------ */
	static exportExperimentResults() {
		DataManager.surveyResults.miscellaneous.experimentEnd = getDatestamp();
		// Convert to CSV --------------------------------------------------- //
		// Fetch data 
		let json = DataManager.results;
		let csv = '';
		if (json.length > 0) {
			// Extract field column names
			let fields = Object.keys(json[0]);
			// Populate csv with json data
			let formatter = function (key, value) { return value === null ? '' : value }
			csv = json.map(function (row) {
				return fields.map(function (fieldName) {
					return JSON.stringify(row[fieldName], formatter)
				}).join(';');
			});
			// Insert column names at the beginning
			csv.unshift(fields.join(';'));
			// Format end and return
			csv = csv.join('\r\n');
		}
		// Save File -------------------------------------------------------- //
		pavlovia_save("experiment_results", csv, false);
	}

	static exportSurveyResults() {
		DataManager.surveyResults.miscellaneous.experimentEnd = getDatestamp();
		let surv = JSON.stringify(DataManager.surveyResults);
		pavlovia_save("survey_results", surv, false);
	}

}