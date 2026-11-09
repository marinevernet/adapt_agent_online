function getDatestamp() {
	let date = new Date();
	return date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + ", " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
}

function nextInfoScreen(content, nextFunction, nextLabel, boxSize, withAnimation) {
	if (withAnimation) {
		$('#infoScreenBox').removeClass('infoScreenBoxAppearing');
		void $('#infoScreenBox')[0].offsetWidth;
		$('#infoScreenBox').addClass('infoScreenBoxAppearing');
	}
	infoScreen = new InfoScreen(content, nextFunction, nextLabel, boxSize);
	infoScreen.show();
}

function nextScreen() {

	function continueInfoScreenSequence() {
		if ($('#infoScreenNextButton').hasClass('disabled')) { return; }
		infoScreenCount++; // Increment info screen counter 
		infoScreenGoingBack = false;
		nextScreen(); // Show what's next (another info screen)
	}
	function continueInfoScreenSequenceConsentCheck() {
		if ($('#infoScreenNextButton').hasClass('disabled')) { return; }
		// Check requirements
		meetsRequirements = 2 - ((initialSurveyResults.Age >= 18) && initialSurvey2Results.R1 && !initialSurvey2Results.R2 && !initialSurvey2Results.R3);
		infoScreenCount += meetsRequirements; // Increment info screen counter 
		infoScreenGoingBack = false;
		nextScreen(); // Show what's next (another info screen)
	}
	function continueAfterMiniBreak() {
		if ($('#infoScreenNextButton').hasClass('disabled')) { return; }
		if (getTrialNumberInBlock() >= trialsPerBlock[block] - 1) { hasEndedBlock = true; }
		falsePositivesCounter = { num: 0, inARow: 0 };
		displayFalsePositivesWarning = false;
		nextScreen();
		isDisplayingMiniBreakScreen = false;
	}
	function continueAfterBreak() {
		if ($('#infoScreenNextButton').hasClass('disabled')) { return; }
		infoScreenCount = 1;
		hasEndedBlock = false;
		hasDisplayedBreakScreen = true;
		nextScreen();
	}
	function endInfoScreenSequence1() {
		if ($('#infoScreenNextButton').hasClass('disabled')) { return; }
		infoScreenCount = 1; // Reset info screen counter 
		timelineCount++; // Increment timeline counter
		trialScreen.updateProgressBar(1); // Update progress bar for the next block (with an offset of 1 because trial counter is at -1 until it gets re-incremented in the trial constructor)
		infoScreenGoingBack = false;
		hasEndedBlock = false;
		nextScreen(); // Show what's next (typically a trial)
	}
	function endInfoScreenSequence2() {
		if ($('#infoScreenNextButton').hasClass('disabled')) { return; }
		infoScreenCount = 1; // Reset info screen counter 
		timelineCount++; // Increment timeline counter 
		nextBlock(); // Update the block (this has to be done before the trial's constructor so the counters work in here)
		trialScreen.updateProgressBar(1); // Update progress bar for the next block (with an offset of 1 because trial counter is at -1 until it gets re-incremented in the trial constructor)
		infoScreenGoingBack = false;
		hasEndedBlock = false;
		nextScreen(); // Show what's next (typically a trial)
	}
	function endInfoScreenSequence3() {
		if ($('#infoScreenNextButton').hasClass('disabled')) { return; }
		window.location = "https://app.prolific.co/submissions/complete?cc=C13330FG"
		console.log("FINISH")
		/*
		infoScreenCount = 1; // Reset info screen counter 
		timelineCount--; // Decrement timeline counter 
		nextBlock(); // Update the block (this has to be done before the trial's constructor so the counters work in here)
		trialScreen.updateProgressBar(1); // Update progress bar for the next block (with an offset of 1 because trial counter is at -1 until it gets re-incremented in the trial constructor)
		infoScreenGoingBack = false;
		hasEndedBlock = false;
		nextScreen(); // Show what's next (typically a trial)
		*/

	}

	switch (timelineCount) {

		/* INFO SCREENS I0 */
		case 0:
			// First screen, appear with animation (unless we're going back from another info screen)
			if (infoScreenCount == 1) {
				if (!infoScreenGoingBack) {
					transition(function () {
						nextInfoScreen('iS_I0_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['6'], [40, 86], true);
					}, 2);
				}
				else {
					nextInfoScreen('iS_I0_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['6'], [40, 86], false);
				}
			}
			// Survey first screen, appears without animation
			else if (infoScreenCount == 2) {
				nextInfoScreen('iS_I0_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [40, 86], false);
			}
			// Survey second screen, appears without animation
			else if (infoScreenCount == 3) {
				nextInfoScreen('iS_I0_' + infoScreenCount, continueInfoScreenSequenceConsentCheck, experimentTexts['nextButtons']['1'], [40, 86], false);
			}
			// Last screen, when button pressed reset infoScreenCount, increment timelineCount, and go to next screen
			else if (infoScreenCount == 4) {
				nextInfoScreen('iS_I0_' + infoScreenCount, endInfoScreenSequence1, experimentTexts['nextButtons']['1'], [40, 86], false);
			}
			// Denial screen, there is no button to press
			else if (infoScreenCount == 5) {
				nextInfoScreen('iS_I0_' + infoScreenCount, () => { }, "", [40, 86], false);
			}
			break;

		/* INFO SCREENS I1 */
		case 1:
			// First screen, appear with animation (unless we're going back from another info screen)
			if (infoScreenCount == 1) {
				if (!infoScreenGoingBack) {
					transition(function () {
						nextInfoScreen('iS_I1_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 65], true);
					}, 2);
				}
				else {
					nextInfoScreen('iS_I1_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 65], false);
				}
			}
			// Middle screens, appear without animation
			else if (infoScreenCount < 8) {
				nextInfoScreen('iS_I1_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 65], false);
			}
			// Last screen, when button pressed reset infoScreenCount, increment timelineCount, and go to next screen
			else {
				nextInfoScreen('iS_I1_' + infoScreenCount, endInfoScreenSequence1, experimentTexts['nextButtons']['2'], [45, 65], false);
			}
			break;

		/* TUTORIAL TRIALS BLOCK */
		case 2:
			// Normally, go to next trial with animation
			if (getTrialNumberInBlock() + 1 < trialsPerBlock[block]) {
				transition(function () {
					nextTrial();
				}, 0);
			}
			// Last trial, increment timelineCount and call the function again to display infoScreen
			else {
				infoScreenGoingBack = false;
				hasEndedBlock = false;
				timelineCount++; nextScreen();
			}
			break;

		/* INFO SCREEN I2 */
		case 3:
			// First screen, appear with animation (unless we're going back from another info screen)
			if (infoScreenCount == 1) {
				if (!infoScreenGoingBack) {
					transition(function () {
						nextInfoScreen('iS_I2_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 45], true);
					}, 2);
				}
				else {
					nextInfoScreen('iS_I2_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 45], false);
				}
			}
			// Second / last screen, when button pressed reset infoScreenCount, increment timelineCount, increment blocks manually, and go to next screen
			else {
				nextInfoScreen('iS_I2_' + infoScreenCount, endInfoScreenSequence2, experimentTexts['nextButtons']['2'], [45, 45], false);
			}
			break;

		/* TRAINING TRIALS BLOCK */
		case 4:
			// Normally, go to next trial with animation
			if (getTrialNumberInBlock() < trialsPerBlock[block] && !hasEndedBlock) {
				// Every 20 trials, display a mini-break screen
				if ((getTrialNumberInBlock() + 1) != 0 && (getTrialNumberInBlock() + 1) % 20 == 0 && !isDisplayingMiniBreakScreen) {
					isDisplayingMiniBreakScreen = true;
					transition(function () {
						nextInfoScreen('iS_MB_1', continueAfterMiniBreak, experimentTexts['nextButtons']['3'], [45, 60], true);
					}, 2);
				}
				// Normally, display trial
				else {
					transition(function () {
						nextTrial();
					}, 0);
				}
			}
			// Last trial, increment timelineCount and call the function again to display infoScreen
			else {
				infoScreenGoingBack = false;
				hasEndedBlock = false;
				timelineCount++; nextScreen();
			}
			break;

		/* INFO SCREENS I3 */
		case 5:
			// First screen, appear with animation (unless we're going back from another info screen)
			if (infoScreenCount == 1) {
				if (!infoScreenGoingBack) {
					transition(function () {
						nextInfoScreen('iS_I3_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 65], true);
					}, 2);
				}
				else {
					nextInfoScreen('iS_I3_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 65], false);
				}
			}
			// Middle screens, appear without animation
			else if (infoScreenCount < 6) {
				if (infoScreenCount == 3) $('#postTrainingFeedback').prop('readonly', true);
				nextInfoScreen('iS_I3_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 65], false);
			}
			// Last screen, when button pressed reset infoScreenCount, increment timelineCount, increment blocks manually, and go to next screen
			else {
				nextInfoScreen('iS_I3_' + infoScreenCount, endInfoScreenSequence2, experimentTexts['nextButtons']['2'], [45, 65], false);
			}
			break;

		/* FEEDBACK TRIALS BLOCKS */
		case 6:
			// Normally, go to next trial with animation
			if (getTrialNumberInBlock() < trialsPerBlock[clamp(block, 0, trialsPerBlock.length - 1)] && !hasEndedBlock) {
				// Every 20 trials, display a mini-break screen
				if ((getTrialNumberInBlock() + 1) != 0 && (getTrialNumberInBlock() + 1) % 20 == 0 && !isDisplayingMiniBreakScreen && !hasDisplayedBreakScreen) {
					isDisplayingMiniBreakScreen = true;
					transition(function () {
						nextInfoScreen('iS_MB_1', continueAfterMiniBreak, experimentTexts['nextButtons']['3'], [45, 60], true);
					}, 2);
				}
				// Normally, display trial
				else {
					transition(function () {
						nextTrial();
					}, 0);
				}
				hasDisplayedBreakScreen = false;
			}
			// Last trial, display break screen
			else {
				// If not last block, display break block
				if (block != nbBlocs - 1) {
					// First screen, appear with animation
					if (infoScreenCount == 1) {
						if (!infoScreenGoingBack) {
							breakSurvey.clear(); // This function lags a bit! we execute it here so the lag occurs during the transition
							breakSurvey.render();
							breakSurveyResults = {};
							transition(function () {
								nextInfoScreen('iS_B_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [40, 75], true);
							}, 2);
						}
						else {
							nextInfoScreen('iS_B_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [40, 75], false);
						}
					}
					// Second & last screen, set hasDisplayedBreakScreen to true so that next time we change screens, a trial is displayed
					else {
						nextInfoScreen('iS_B_' + infoScreenCount, continueAfterBreak, experimentTexts['nextButtons']['2'], [40, 75], false);
					}
				}
				// If last block, increment timelineCount and call the function again to display infoScreen
				else {
					infoScreenGoingBack = false;
					hasEndedBlock = false;
					timelineCount++; nextScreen();
				}
			}
			break;

		/* INFO SCREENS I4 */
		case 7:
			// First screen, appear with animation (unless we're going back from another info screen)
			if (infoScreenCount == 1) {
				if (!infoScreenGoingBack) {
					$('#iS_I4_' + infoScreenCount + '>div').append($('#breakFeedback'));
					breakSurvey.clear(); // This function lags a bit! we execute it here so the lag occurs during the transition
					breakSurvey.render();
					breakSurveyResults = {};
					transition(function () {
						nextInfoScreen('iS_I4_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 85], true);
					}, 2);
				}
				else {
					nextInfoScreen('iS_I4_' + infoScreenCount, continueInfoScreenSequence, experimentTexts['nextButtons']['1'], [45, 85], false);
				}
			}
			// Middle screens, appear without animation
			else if (infoScreenCount < 12) {
				let isSurvey = (infoScreenCount >= 6 && infoScreenCount <= 11);
				let isFeedback = (infoScreenCount == 2);
				let size = [45, 55];
				if (isFeedback) { size = [45, 85]; }
				if (isSurvey) { size = [45, 90]; }
				let label = experimentTexts['nextButtons']['1'];
				if (infoScreenCount == 5) { label = experimentTexts['nextButtons']['4']; }
				if (infoScreenCount == 11) { label = experimentTexts['nextButtons']['5']; }
				nextInfoScreen('iS_I4_' + infoScreenCount, continueInfoScreenSequence, label, size, false);
			}
			// Last screen, when button pressed reset infoScreenCount, decrement timelineCount (go to infinite feedback phase), increment block (to infinite feedback phase) and go to next screen
			else {
				DataManager.exportSurveyResults();
				hasEnded = true;
				nextInfoScreen('iS_I4_' + infoScreenCount, endInfoScreenSequence3, experimentTexts['nextButtons']['5'], [45, 55], false);
			}
			break;

	}

}

/* SURVEY COMPLETION HANDLERS */
function initialSurveyButtonTrigger() {
	if (Object.keys(initialSurveyResults).length == 3) {
		$("#infoScreenNextButton").removeClass('disabled');
		DataManager.surveyResults.initial = JSON.parse(JSON.stringify(initialSurveyResults));
	}
}
function initialSurvey2ButtonTrigger() {
	if (Object.keys(initialSurvey2Results).length == 3) {
		$("#infoScreenNextButton").removeClass('disabled');
		DataManager.surveyResults.initial2 = JSON.parse(JSON.stringify(initialSurvey2Results));
	}
}
function postTrainingSurveyButtonTrigger() {
	if (postTrainingSurveyResults.length > 0) {
		$("#infoScreenNextButton").removeClass('disabled');
		DataManager.surveyResults.postTraining = postTrainingSurveyResults;
	}
}
function breakSurveyButtonTrigger() {
	if (Object.keys(breakSurveyResults).length == 2) {
		$("#infoScreenNextButton").removeClass('disabled');
		DataManager.surveyResults.breaks[block - 2] = JSON.parse(JSON.stringify(breakSurveyResults));
	}
}
function freeCommentsButtonTrigger() {
	if (freeComments1Results.length > 0 && freeComments2Results.length > 0) {
		$("#infoScreenNextButton").removeClass('disabled');
	}
	if (freeComments1Results.length > 0) {
		DataManager.surveyResults.freeComments[0] = freeComments1Results;
	}
	if (freeComments2Results.length > 0) {
		DataManager.surveyResults.freeComments[1] = freeComments2Results;
	}
}
function finalSurveyButtonTrigger() {
	if (Object.keys(finalSurveyResults[infoScreenCount - 6]).length == 4) {
		$("#infoScreenNextButton").removeClass('disabled');
		Object.assign(DataManager.surveyResults.final, JSON.parse(JSON.stringify(finalSurveyResults[infoScreenCount - 6])));
	}
}

/* ENSURE THE CURRENT BROWSER IS SUPPORTED */
function ensureBrowserSupport() {
	(async () => {

		let gpuTier = await getGPUTier();
		let hasAppleM1 = (gpuTier.gpu.toUpperCase().includes("APPLE M1"))
		DataManager.surveyResults.miscellaneous.gpu = gpuTier;
		DataManager.surveyResults.miscellaneous.browser = getBrowser();
		if (is.firefox() || is.safari() || is.ie() || is.mobile()) {
			$('#wrongBrowserScreen').css('display', 'flex');
			return;
		}
		else if (!(hasAppleM1 || gpuTier.tier > 1)) {
			$('#hardwareAccelerationScreen').css('display', 'flex');
			return;
		}

	})();
}

/* APPLY GLOBAL LISTENERS */
function applyGlobalListeners() {

	/* GLOBAL LISTENERS */
	// Trial Screen MOUSE MOVEMENT listener 
	$(document).mousemove(function (e) {
		// Update mouse position variable
		MouseProcessor.updateMousePos(e);
		// Update position of graphical mouse element 
		if ($('#cursorFollower').css('display') == 'block') {
			$('#cursorFollower').css({
				'left': e.pageX + 'px',
				'top': e.pageY + 'px'
			});
		}
		if (currentScreen == 'trialScreen') {
			// Start counting how long it's been close to the target (if close to target)
			if (MouseProcessor.mouseIsCloseToSpecialStimuli(1) && hasGottenCloseToSpecialStimuliTime == -1) {
				hasGottenCloseToSpecialStimuliTime = getTimestamp();
			}
		}
	});
	// Trial Screen MOUSE CLICK listener 
	$(document).mousedown(function (e) {
		// Only occurs if the listener on the special stimuli wasn't triggered
		if (hasClickedOnSpecialStimuli) return;
		if (!(currentScreen == 'trialScreen')) return;
		// Throw error under certain conditions
		let clickConditions = (MouseProcessor.firstClick.initiator == -1) || (MouseProcessor.firstClick.initiator == 0 && MouseProcessor.secondClick.initiator == -1);
		let distanceConditions = !MouseProcessor.mouseIsCloseToSpecialStimuli(0.6);
		let isInFakeoutPhase = (phase == 1 && block == 1 && getTrialNumberInBlock() >= trialsPerBlock[block] - 10);
		let phaseConditions = (!isInFakeoutPhase || (isInFakeoutPhase && !trialScreen.isDeactivated));
		if (
			!trialScreen.isLocked() 						// grid is unlocked 
			&& clickConditions 								// no one has clicked first or machine clicked first but not human
			&& phaseConditions 								// not in the fakeoutphase unless the screen isn't deactivated 
			&& !isTransitioning 							// it's not transitioning towards the next trial 
			&& !$('#gameGridWrapper').hasClass('panDown') 	// it hasn't transitioned towards the feedback screen
		) {
			// it's indeed outside of the SS's bounding box 
			if (distanceConditions) {
				trialScreen.trialData.humanClickTime = getTimestamp() - MouseProcessor.unlockInstant;
				trialScreen.trialData.distanceToTargetWhenHumanClick = distance(MouseProcessor.mousePos, trialScreen.getSpecialStimuliPos());
				trialScreen.showWarning(experimentTexts['popups'][(MouseProcessor.mouseIsCloseToSpecialStimuli(1.6)) ? '2' : '1']);
				$('#impactAnimation').css('display', 'none');
			}
			// otherwise (most likely an uncaught SS click because SS was shaking), redirect to SS listener 
			else {
				$('#specialStimuliCell').trigger('mousedown');
			}
		}
	});
	// Warning Popup RETRY listener
	$('#retryButton').mousedown(function (e) {
		let containerWidth = $('#gameGrid').width();
		let containerHeight = $('#gameGrid').height();
		if (containerWidth / containerHeight > 640 / 360) {
			$('#transitionOverlay1').css('width', containerWidth + 'px');
		}
		else {
			$('#transitionOverlay1').css('width', 640 * containerHeight / 360 + 'px');
		}
		if (!isTransitioning) {
			transition(function () { retryTrial(); }, 1);
		}
		$(this).addClass('active');
	});
	// Pause Screen RESUME listener 
	$('#resumeButton').mousedown(function (e) {
		openFullscreen();
		if (currentScreen == 'trialScreen') {
			transition(function () { $('#pauseScreen').css('display', 'none'); retryTrial(); }, 0);
		}
		else {
			transition(function () { $('#pauseScreen').css('display', 'none'); }, 0);
		}
	});
	// Info Screen PREV listener 
	$('#infoScreenPrevButton').click(function (e) {
		infoScreenGoingBack = true;
		if (infoScreenCount > 0) { infoScreenCount--; nextScreen(); }
		else { infoScreenCount = 1; }
	});
	$('#infoScreenPrevButton').mousedown(function (e) {
		if ($('#infoScreenPrevButton').hasClass('disabled')) { return; }
		// Restart jerk animation
		$('#infoScreenPrevButton').removeClass('infoScreenPrevButtonJerk');
		void $('#infoScreenPrevButton')[0].offsetWidth;
		$('#infoScreenPrevButton').addClass('infoScreenPrevButtonJerk')
	});
	// Info Screen NEXT listener (on top of the actual action listener)
	$('#infoScreenNextButton').mousedown(function (e) {
		if ($('#infoScreenNextButton').hasClass('disabled')) { return; }
		// Restart jerk animation
		$('#infoScreenNextButton').removeClass('infoScreenNextButtonJerk');
		void $('#infoScreenNextButton')[0].offsetWidth;
		$('#infoScreenNextButton').addClass('infoScreenNextButtonJerk')
	});
	// Trial Screen KEYBOARD listener
	$(document).keydown(function (e) {
		var code = e.keyCode || e.which;
		// Unlock trial grid 
		if (code == 32) {
			if (!(currentScreen == 'trialScreen')) return;
			if (!trialScreen.hasWarning && !trialScreen.isDeactivated && trialScreen.isLocked()) {
				trialScreen.toggleLock(-1, true);
			}
		}
		// DEBUG SAVE RESULTS (F2)
		/*
		if (code == 113) { 
			DataManager.exportExperimentResults();
			DataManager.exportSurveyResults();
		}
		*/
	});
	// Feedback screen MOUSE CLICK listener 
	$('#humanClickFeedback').on('click', function () {
		if (!isTransitioning) {
			registerFeedback(1);
			nextScreen();
		}
		$('#machineClickFeedback').addClass('feedbackDisappear');
		$('#humanClickFeedback').addClass('feedbackSelected');
		trialScreen.updateProgressBar(1);
	})
	$('#machineClickFeedback').on('click', function () {
		if (!isTransitioning) {
			registerFeedback(0);
			nextScreen();
		}
		$('#humanClickFeedback').addClass('feedbackDisappear');
		$('#machineClickFeedback').addClass('feedbackSelected');
		trialScreen.updateProgressBar(1);
	})
	// Animation Listeners 
	for (let i = 0; i < transitionAnimations.length; i++) {
		transitionAnimations[i].anim.addEventListener("complete", function () {
			transitionAnimations[i].anim.wrapper.style.display = 'none';
			isTransitioning = false;
		});
	}
	// Quitting listener 
	/*window.onbeforeunload = function (e) {
		e.preventDefault();
		return 'Êtes vous sûrs de vouloir quitter ?';
	};*/
	window.onunload = function (e) {
		if (hasStarted) {
			//DataManager.exportExperimentResults();
			//DataManager.exporSurveyResults();
			pavlovia_closeSession(hasEnded, true);
		}
	}
	// Quitting fullscreen listener 
	$(window).on('resize', function () {
		if (!isFullScreen() & hasStarted) {
			$('#pauseScreen').css('display', 'flex');
		}
	});
	// Flag button listeners 
	$('#fr > img').click(function () {
		language = 'fr';
		$('#chooseLanguageWrapper').css('opacity', '0');
		loadExperimentTextsAndStart();
	});
	$('#en > img').click(function () {
		language = 'en';
		$('#chooseLanguageWrapper').css('opacity', '0');
		loadExperimentTextsAndStart();
	});

}

/* LOAD TEXTS, START EXPERIMENT */
function startExperiment() {

	// Create dummy trial screen to preload elements
	trialScreen = new TrialScreen(false);
	// Show first screen
	$('#background').css('display', 'block');
	transition(function () {
		nextInfoScreen('iS_W_1', function () {
			openFullscreen();
			pavlovia_init();
			hasStarted = true;
			infoScreenGoingBack = false;
			nextScreen();
		}, experimentTexts['nextButtons']['0'], [45, 55]);
	}, 2);
	// Hide language select screen
	$('#chooseLanguage').css('display', 'none');
	// Save start time 
	DataManager.surveyResults.miscellaneous.experimentStart = getDatestamp();

}
function applyExperimentTexts() {

	/* HTML ELEMENTS */
	$('#trialCounterLabel > span').html(experimentTexts['html']['trialCounter']);
	$('#instructionsReminderTitle > span').html(experimentTexts['html']['instructionsReminder']['0']);
	for (let i = 1; i <= 4; i++) {
		$('#popupInstructionsReminderList > ol > li:nth-child(' + i + ')').html(experimentTexts['html']['instructionsReminder'][i]);
	}
	$('#retryButton').html(experimentTexts['html']['retry']);
	$('#warningOverlayMessage').html(experimentTexts['html']['warningOverlay']);
	$('#pauseScreen > div > p').html(experimentTexts['html']['pauseScreen']);
	$('#resumeButton').html(experimentTexts['html']['resume']);
	$('#wrongBrowserScreen > div > p').html(experimentTexts['html']['wrongBrowser']);
	$('#hardwareAccelerationScreen > div > p').html(experimentTexts['html']['hardwareAcceleration']);
	$('#infoScreenContents').html(experimentTexts['html']['infoScreens']);

	/* IMAGES */
	$('#feedbackQuestion').prop('src', 'resources/Miscellaneous Graphics/FeedbackQuestion_' + language + '.png');
	$('#humanClickFeedback > img').prop('src', 'resources/Miscellaneous Graphics/HumanClickButton_' + language + '.png');
	$('#machineClickFeedback > img').prop('src', 'resources/Miscellaneous Graphics/MachineClickButton_' + language + '.png');
	$('.instructionsReminderGif').prop('src', 'resources/Animations/InstructionsMemo_' + language + '.mp4')

	/* SURVEYS */
	// Initial Survey 
	var initialSurveyJSON = experimentTexts['surveys']['initial'];
	initialSurvey = new Survey.Model(initialSurveyJSON);
	$("#initialSurvey").Survey({ model: initialSurvey });
	var initialSurvey2JSON = experimentTexts['surveys']['initial2'];
	initialSurvey2 = new Survey.Model(initialSurvey2JSON);
	$("#initialSurvey2").Survey({ model: initialSurvey2 });
	// Break Feedback 
	var breakSurveyJSON = experimentTexts['surveys']['break'];
	breakSurvey = new Survey.Model(breakSurveyJSON);
	$("#breakFeedback").Survey({ model: breakSurvey });
	// Final Feedback 
	var finalSurveysJSON = experimentTexts['surveys']['final'];
	finalSurveys = [];
	for (let i = 0; i < 6; i++) {
		let survey = new Survey.Model(finalSurveysJSON[i]);
		finalSurveys.push(survey);
		$("#finalFeedback" + i).Survey({ model: survey });
	}
	// Survey listeners
	initialSurvey.onValueChanged.add(function (sender, options) {
		initialSurveyResults = JSON.parse(JSON.stringify(sender.data));
		$("#infoScreenNextButton").addClass('disabled');
		initialSurveyButtonTrigger();
	});
	initialSurvey2.onValueChanged.add(function (sender, options) {
		initialSurvey2Results = JSON.parse(JSON.stringify(sender.data));
		$("#infoScreenNextButton").addClass('disabled');
		initialSurvey2ButtonTrigger();
	});
	$('#postTrainingFeedback').bind('input propertychange', function () {
		postTrainingSurveyResults = this.value;
		$("#infoScreenNextButton").addClass('disabled');
		postTrainingSurveyButtonTrigger();
	});
	breakSurvey.onValueChanged.add(function (sender, options) {
		breakSurveyResults = JSON.parse(JSON.stringify(sender.data));
		$("#infoScreenNextButton").addClass('disabled');
		breakSurveyButtonTrigger();
	});
	$('#freeComments1').bind('input propertychange', function () {
		freeComments1Results = this.value;
		$("#infoScreenNextButton").addClass('disabled');
		freeCommentsButtonTrigger();
	});
	$('#freeComments2').bind('input propertychange', function () {
		freeComments2Results = this.value;
		$("#infoScreenNextButton").addClass('disabled');
		freeCommentsButtonTrigger();
	});
	for (let i = 0; i < 6; i++) {
		finalSurveys[i].onValueChanged.add(function (sender, options) {
			finalSurveyResults[i] = JSON.parse(JSON.stringify(sender.data));
			$("#infoScreenNextButton").addClass('disabled');
			finalSurveyButtonTrigger();
		});
	}

}
function loadExperimentTextsAndStart() {
	let path = "resources/lang_" + language + ".json";
	let result = null;
	let request = new XMLHttpRequest();
	request.open("GET", path, true);
	request.send();
	request.onload = function () {
		experimentTexts = JSON.parse(request.response);
		applyExperimentTexts();
		ensureBrowserSupport();
		startExperiment();
	}
}

function initialiseLanguageChoosingScreen() {
	let question = {
		"en": "• Please select your language •",
		"fr": "• Quelle langue parlez-vous ? •"
	}
	$('#chooseLanguageQuestion > span').html(question[language]);
	$('#chooseLanguage').css('display', 'flex');
}

/* MAIN */
function main() {

	applyGlobalListeners();
	initialiseLanguageChoosingScreen();

}