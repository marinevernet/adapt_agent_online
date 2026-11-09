let currentContentID = -1;

class InfoScreen {

	show() {
		$('#infoScreen').css('display', 'block');
		$('#trialScreen').css('display', 'none');
		$('#debugScreen').css('display', 'none');
		currentScreen = 'infoScreen';
		let currBackground = $('#background').prop('src').split('/');
		if (currBackground[currBackground.length - 1] != 'Background1.mp4') {
			$('#background').prop('src', 'resources/Animations/Background1.mp4');
		}
	}

	constructor(contentID, buttonFunction, buttonLabel, boxSize) {

		let infoScreenNumber = contentID.split('_')[2];
		let isSurveyScreen = (
			contentID == 'iS_I0_2'
			|| contentID == 'iS_I0_3'
			|| contentID == 'iS_I3_2'
			|| contentID == 'iS_B_1'
			|| (contentID.split('_')[1] == 'I4' && ((infoScreenNumber >= 6 && infoScreenNumber <= 11) || infoScreenNumber == 1 || infoScreenNumber == 2))
		)

		// Set the header of the panel
		$('#infoScreenHeader').html($('#' + contentID + '> h1').html());
		$('#infoScreenHeaderBG').html($('#' + contentID + '> h1').html());


		// Hide all buttons if this is the 'sorry you can't participate' screen
		if (contentID == 'iS_I0_5') {

			$('#infoScreenNextButton').css('display', 'none');
			$('#infoScreenPrevButton').css('display', 'none');

		}
		else {

			$('#infoScreenNextButton').css('display', 'block');

			// Hide previous button if this is the first info screen in its series  
			if (infoScreenNumber == 1) {
				$('#infoScreenPrevButton').css('display', 'none');
			}
			else {
				$('#infoScreenPrevButton').css('display', 'block');
			}

		}



		// Put the old content back where it belongs in the DOM tree (in the element with its ID)
		if (currentContentID != -1) { $('#' + currentContentID).append($('#infoScreenContent > div')); }

		// If content has to be dynamically updated, do it on a case by case basis 
		switch (contentID) {
			case 'iS_B_1':
				let breakHTML = experimentTexts['breakScreen'];
				$('#iS_B_1 > div > div')[0].innerHTML = (breakHTML.split('$')[0] + block + breakHTML.split('$')[1]);
				break;
			case 'iS_MB_1':
				DataManager.exportExperimentResults();
				let miniBreakHTML = experimentTexts['miniBreakScreen'];
				// Search time average value
				let searchTimeAverage = Math.round(mean(searchTimes[searchTimes.length - 1]));
				$('#searchTimeStat')[0].innerHTML = searchTimeAverage + ' ms';
				// Search time evolution
				if (searchTimes.length > 1) {
					$('#searchTimeStatChange').css('display', 'block');
					let previousSearchTimeAverage = Math.round(mean(searchTimes[searchTimes.length - 2]));
					let searchTimeEvolution = Math.round(((searchTimeAverage - previousSearchTimeAverage) / previousSearchTimeAverage) * 100);
					if (searchTimeEvolution != 0) {
						let message = miniBreakHTML[1 - (searchTimeEvolution < 0)]
						$('#searchTimeStatChange')[0].innerHTML = message.split('$')[0] + Math.abs(searchTimeEvolution) + message.split('$')[1];
						$('#searchTimeStat').css('color', (searchTimeEvolution < 0) ? '#0EAF00' : '#FF0000');
					}
					else {
						$('#searchTimeStatChange')[0].innerHTML = miniBreakHTML[4];
					}
				}
				else {
					$('#searchTimeStatChange').css('display', 'none');
				}
				// Search time highscore
				let searchTimeHighscore = 99999999;
				for (let i = 0; i < searchTimes.length; i++) {
					let searchTimeAverage_i = Math.round(mean(searchTimes[i]));
					if (searchTimeAverage_i < searchTimeHighscore) {
						searchTimeHighscore = searchTimeAverage_i;
					}
				}
				$('#searchTimeStatHighscore')[0].innerHTML = miniBreakHTML[7].split('$')[0] + searchTimeHighscore + miniBreakHTML[7].split('$')[1];
				// Save future search times in the next entry
				searchTimes.push([]);
				// Number of warnings
				let warningCount = numWarnings[numWarnings.length - 1];
				$('#warningCountStat')[0].innerHTML = warningCount;
				// Number of warnings evolution
				if (numWarnings.length > 1) {
					$('#warningCountStatChange').css('display', 'block');
					let previousWarningCount = numWarnings[numWarnings.length - 2];
					if (previousWarningCount > warningCount) {
						$('#warningCountStat').css('color', '#0EAF00');
						$('#warningCountStatChange')[0].innerHTML = miniBreakHTML[6];
					}
					else if (previousWarningCount < warningCount) {
						$('#warningCountStat').css('color', '#FF0000');
						$('#warningCountStatChange')[0].innerHTML = miniBreakHTML[5];
					}
					else {
						$('#warningCountStatChange')[0].innerHTML = miniBreakHTML[4];
					}
				}
				else {
					$('#warningCountStatChange').css('display', 'none');
				}
				// Number of warnings highscore
				let warningCountHighscore = 99999999;
				for (let i = 0; i < numWarnings.length; i++) {
					let warningCount_i = numWarnings[i];
					if (warningCount_i < warningCountHighscore) {
						warningCountHighscore = warningCount_i;
					}
				}
				$('#warningCountStatHighscore')[0].innerHTML = miniBreakHTML[7].split('$')[0] + warningCountHighscore + miniBreakHTML[7].split('$')[1];
				// Save future numbers of warnings in the next entry
				numWarnings.push(0);
				// Display false positives warning if needed
				if (displayFalsePositivesWarning) {
					$('#falsePositivesWarning').css('display', 'block');
					boxSize[1] += 12;
				}
				else {
					$('#falsePositivesWarning').css('display', 'none');
				}
				break;
		}

		// Adjust the position of the prev button if the width is too tight 
		if (contentID == "iS_B_2") {
			$('#infoScreenPrevButton').css('left', '20%');
		}
		else {
			$('#infoScreenPrevButton').css('left', '28%');
		}

		// Fetch the new content in the DOM tree and put it in this info screen 
		$('#infoScreenContent').append($('#' + contentID + '> div'));

		// Reset the video if there's any 
		if ($('#infoScreenContent > div > video')[0]) { $('#infoScreenContent > div > video')[0].currentTime = 0; }

		// Set the label of the "next" button 
		$('#infoScreenNextButton').html(buttonLabel);
		// Unbind the previous "next" button click function and bind the new one
		let nextFunction = buttonFunction;
		if (isSurveyScreen) { nextFunction = function () { buttonFunction(); DataManager.exportSurveyResults(); } }
		$('#infoScreenNextButton').unbind("click").bind("click", nextFunction);

		// Hide the cursor follower 
		$('#cursorFollower').css('display', 'none');

		// Set the size of the panel 
		//let boxHeight = boxSize[1];
		//let proportionalBoxWidth = boxHeight * $(window).height()/$(window).width() * (boxSize[0]*1920)/(boxSize[1]*1080);
		$('#infoScreenBox').css('width', boxSize[0] + '%');
		$('#infoScreenBox').css('height', boxSize[1] + '%');

		// Disable the next button if this is a survey type of panel
		if (isSurveyScreen) {
			$("#infoScreenNextButton").addClass('disabled');
			switch (contentID) {
				case 'iS_I0_2':
					initialSurveyButtonTrigger();
					break;
				case 'iS_I0_3':
					initialSurvey2ButtonTrigger();
					break;
				case 'iS_I3_2':
					postTrainingSurveyButtonTrigger();
					break;
				case 'iS_B_1':
				case 'iS_I4_1':
					breakSurveyButtonTrigger();
					break;
				case 'iS_I4_2':
					freeCommentsButtonTrigger();
					break;
				default:
					finalSurveyButtonTrigger();
					break;
			}
		}
		else {
			$("#infoScreenNextButton").removeClass('disabled');
		}

		// Save the current content ID (so we can put it back in the DOM tree next time)
		currentContentID = contentID;

	}

}