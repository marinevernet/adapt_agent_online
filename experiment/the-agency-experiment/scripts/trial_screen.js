var hasClickedOnSpecialStimuli = false;
var hasFixedStimuliPos = false;

let newTrialCounter = 0;
let previousImageSet = -1;
let saveSpecialStimuliAttributes = false;

function nextTrial() {
	clearTimeout(trialScreen.lockTimeout);
	clearTimeout(trialScreen.deactivationTimeout);
	clearTimeout(trialScreen.panTimeout);
	clearTimeout(trialScreen.searchTimeout);
	MouseProcessor.stopRecordLockedMouse();
	MouseProcessor.stopRecordUnlockedMouse();
	trialScreen = new TrialScreen(true);
	trialScreen.show();
}

function nextBlock() {
	block++;
	// Switch from phase 1 to phase 2 (feedback)
	if (block >= 2 && phase == 1) {
		removePredictionErrorOutliers();
		phase = 2;
		// DEBUG 
		//DataManager.exportBehaviouralData();
	}
}

function retryTrial() {
	clearTimeout(trialScreen.lockTimeout);
	clearTimeout(trialScreen.deactivationTimeout);
	clearTimeout(trialScreen.panTimeout);
	clearTimeout(trialScreen.searchTimeout);
	MouseProcessor.stopRecordLockedMouse();
	MouseProcessor.stopRecordUnlockedMouse();
	trialScreen = new TrialScreen(false);
	trialScreen.show();
	trialScreen.updateProgressBar(0);
}

function getTrialNumberInBlock(offset) {
	if (offset === undefined) offset = 0;
	let previousTrialsSum = 0;
	for (let i = 0; i < block; i++) { previousTrialsSum += trialsPerBlock[clamp(i, 0, trialsPerBlock.length-1)]; }
	return trial + offset - previousTrialsSum;
}

function registerFeedback(perceivedClickType) {
	// Detect if this is a false positive / pure virtual click case and count it (subject didn't click, potentially just let the computer do it for them instead of trying)	
	if (MouseProcessor.firstClick.initiator == 0 && MouseProcessor.secondClick.initiator == -1) { falsePositivesCounter.num++; falsePositivesCounter.inARow++; }
	else { falsePositivesCounter.inARow = 0; }
	if (falsePositivesCounter.inARow >= 4 || falsePositivesCounter.num >= 8) { displayFalsePositivesWarning = true; }
	// Save the results in the file and the program 
	trialScreen.trialData.perceivedFirstClickType = perceivedClickType;
	perceivedClickTypes.push(perceivedClickType);
	// Save the other trial results and persist them
	finaliseAndPersistTrialData();
}

function finaliseAndPersistTrialData() {
	if (MouseProcessor.extractedFeatures.waitingTime != -1) {
		trialScreen.trialData.features_waitingTime = MouseProcessor.extractedFeatures.waitingTime;
	}
	if (MouseProcessor.extractedFeatures.peakValue != -1) {
		trialScreen.trialData.features_peakSpeed = MouseProcessor.extractedFeatures.peakValue;
	}
	if (MouseProcessor.extractedFeatures.accelerationTime != -1) {
		trialScreen.trialData.features_accelerationTime = MouseProcessor.extractedFeatures.accelerationTime;
	}
	if (MouseProcessor.extractedFeatures.distance != -1) {
		trialScreen.trialData.features_distance = MouseProcessor.extractedFeatures.distance;
	}
	if (MouseProcessor.extractedFeatures.waitingTime != -1 && MouseProcessor.unlockInstant) {
		trialScreen.trialData.searchTime = MouseProcessor.extractedFeatures.waitingTime + MouseProcessor.unlockInstant - trialStartTime;
	}
	else if (MouseProcessor.unlockInstant) {
		trialScreen.trialData.searchTime = MouseProcessor.unlockInstant - trialStartTime;
	}
	if (trialScreen.trialData.searchTime != "" && trialScreen.trialData.searchTime < 0) {
		trialScreen.trialData.searchTime = "";
	}
	if (trialScreen.trialData.searchTime != "") {
		searchTimes[searchTimes.length-1].push(trialScreen.trialData.searchTime);
	}
	trialScreen.trialData.nearTargetLobesCount = MouseProcessor.nearTargetLobesCount;
	trialScreen.trialData.timeMovedDuringLockedScreen = timesMovedDuringLockedScreen;
	if (phase > 1) trialScreen.trialData.uncaughtPureVirtualClicksCounter = {"numberInSegment": falsePositivesCounter.num, "inARowInSegment": falsePositivesCounter.inARow, "displayRemarkAtTheEndOfSegment": displayFalsePositivesWarning};
	trialScreen.trialData.endTime = getDatestamp();
	DataManager.results.push(JSON.parse(JSON.stringify(trialScreen.trialData)));
}

var specialStimuliPos = undefined;
var specialStimuliSize = undefined;

class TrialScreen {
	
	/* ATTRIBUTES ----------------------------------------------------------- */
	lockTimeout;
	searchTimeout;
	nCol; nRow;
	isDeactivated;
	hasWarning;
	deactivationTimeout;
	panTimeout;
	
	/* SPECIAL STIMULI ATTRIBUTE GETTERS ------------------------------------ */
	getSpecialStimuliPos() {
		if (specialStimuliPos == undefined) {
			if ($('#specialStimuli').length) {
				let rotCoeff = (getElementRotation('specialStimuli') % 90 == 0) ? 1 : Math.sqrt(2);
				let ssPos = [
					$('#specialStimuli').offset().left + $('#specialStimuli').width()*rotCoeff/2, 
					$('#specialStimuli').offset().top + $('#specialStimuli').height()*rotCoeff/2
				];
				if (saveSpecialStimuliAttributes) { specialStimuliPos = ssPos; }
				return ssPos;
			}
			return undefined;
		}
		return specialStimuliPos;
	}
	getSpecialStimuliSize() {
		if (specialStimuliSize == undefined) {
			if ($('#specialStimuli').length) {
				let ssSize = $('#specialStimuli').width();
				if (saveSpecialStimuliAttributes) { specialStimuliSize = ssSize; }
				return ssSize;
			}
			return undefined;
		}
		return specialStimuliSize;
	}
	getSpecialStimuliPercentagePos() {
		let containerX = $('#stimuliGrid').offset().left;
		let containerY = $('#stimuliGrid').offset().top;
		let containerW = $('#stimuliGrid').width();
		let containerH = $('#stimuliGrid').height();
		let ssPos = this.getSpecialStimuliPos();
		return [(ssPos[0] - containerX)/containerW, (ssPos[1] - containerY)/containerH];
	}
	
	/* GET LOCK STATUS ------------------------------------------------------ */
	isLocked() {
		return $('.stimuliGridCell').hasClass('locked');
	}
	
	/* LOCK OR UNLOCK GRID -------------------------------------------------- */
	toggleLock(type, warn) {
        // type: -1 = toggles both ways; 1 = unlocks; 0 = locks;
        // UNLOCK
		if (this.isLocked() && (type == 1 || type == -1)) {
            // Unlock cells 
			$('.stimuliGridCell').removeClass('locked');
			// Save unlock instant 
			MouseProcessor.unlockInstant = getTimestamp();
			// Stop timeouts and intervals
			clearTimeout(this.searchTimeout);
			MouseProcessor.stopRecordLockedMouse();
			// Save initial mouse distance
            MouseProcessor.saveMouseDistance();
			// Throw warning if mouse is outside of grid 
			if (!MouseProcessor.mouseIsInGrid()) {
				this.showWarning(experimentTexts['popups']['12']);
				return;
			}
            // Start lock timer (locks again after 2 seconds)
			var self = this;
			clearTimeout(this.lockTimeout);
			this.lockTimeout = setTimeout(function() { self.toggleLock(0, true); }, 1500);
			// Change mouse style
			$('#cursorFollower').css('display', 'block');
			$('#cursorFollower').css('left', MouseProcessor.mousePos[0] + 'px');
			$('#cursorFollower').css('top', MouseProcessor.mousePos[1] + 'px');
            // Start recording unlocked mouse input
			MouseProcessor.startRecordUnlockedMouse();
			// Hide border 
			$('#gameGrid').addClass("gameGridUnlocking");
			// Show growing circle 
			$('#growingCircle').css('display', 'block');
			$('#growingCircle').css('left', MouseProcessor.mousePos[0] + 'px');
			$('#growingCircle').css('top', MouseProcessor.mousePos[1] + 'px');
			$('#growingCircle').addClass('growingCircle');
			// Play lock animation 
			lockAnimation.play();
			// Update instructions 
			$('#onScreenInstructions').html(experimentTexts['sidePanel']['instructions']['2']);
		}
        // LOCK
		else if (type == 0 || type == -1) {
            // Lock cells 
			$('.stimuliGridCell').addClass('locked');
            // Stop timeouts and intervals
			clearTimeout(this.lockTimeout);
			MouseProcessor.stopRecordUnlockedMouse();
			// Revert mouse style
			$('#cursorFollower').css('display', 'none');
            // Start recording locked mouse input
			MouseProcessor.startRecordLockedMouse();
            // Reset mouse metrics 
            MouseProcessor.resetMetrics();
			// Show border 
			$('#gameGrid').removeClass("gameGridUnlocking");
			// Throw error 
			if (warn && !this.isDeactivated) { this.showWarning(experimentTexts['popups']['9']); }
			// Hide growing circle 
			$('#growingCircle').css('display', 'none');
			$('#growingCircle').removeClass('growingCircle');
			// Reset lock animation 
			lockAnimation.goToAndStop(0, true);
		}
	}
	
	/* DEACTIVATE GRID (ONCE SPECIAL STIMULI HAS BEEN CLICKED ON) ----------- */
	deactivate() {
		if (!this.isDeactivated) {
			this.isDeactivated = true;
			// Hide all other stimuli
			$('.stimuliGridCell').not('#specialStimuliCell').addClass('hidden');
			// Flash special stimuli
			$('#specialStimuliCell').addClass('flashing');
			setTimeout(function() {$('#specialStimuliCell').removeClass('flashing');}, 80);
			// Display impact animation
			$('#impactAnimation').css({
				'display': 'block',
				'left': this.getSpecialStimuliPos()[0] + 'px',
				'top': this.getSpecialStimuliPos()[1] + 'px',
				'width': this.getSpecialStimuliSize()*3 + 'px',
				'height': this.getSpecialStimuliSize()*3 + 'px'
			});
			impactAnimation.goToAndPlay(0);
			// Shake grid
			$('#stimuliGrid').addClass('stimuliGridShake');
			// Clear lock timeout
			clearTimeout(this.lockTimeout);
			// Set deactivation/pan timeout
			var self = this;
			if (phase > 1) {
				clearTimeout(this.panTimeout);
				this.panTimeout = setTimeout(function() {
					let isInFakeoutPhase = (phase == 1 && block == 1 && getTrialNumberInBlock() >= trialsPerBlock[block]-10);
					let isUnusuallyLateClick = (clickDelaysAfterGettingCloseToSpecialStimuli.length > 5 && hasGottenCloseToSpecialStimuliTime > -1 && (getTimestamp() - hasGottenCloseToSpecialStimuliTime) >= p_mean(clickDelaysAfterGettingCloseToSpecialStimuli) + 3*p_stdev(clickDelaysAfterGettingCloseToSpecialStimuli));
					let isMaliciousPureVirtualClick = (!isInFakeoutPhase && isUnusuallyLateClick && MouseProcessor.firstClick.initiator == 0 && MouseProcessor.secondClick.initiator == -1); 
					if (!isMaliciousPureVirtualClick) {
						$('#gameGridWrapper').addClass('panDown');
					}
					else {
						self.showWarning(experimentTexts['popups']['10'])
					}
				}, map(self.getSpecialStimuliPercentagePos()[1], 0, 1, 600, 750));
			}
			clearTimeout(this.deactivationTimeout);
			this.deactivationTimeout = setTimeout(function() { 
				let isInFakeoutPhase = (phase == 1 && block == 1 && getTrialNumberInBlock() >= trialsPerBlock[block]-10);
				let isUnusuallyLateClick = (clickDelaysAfterGettingCloseToSpecialStimuli.length > 5 && hasGottenCloseToSpecialStimuliTime > -1 && (getTimestamp() - hasGottenCloseToSpecialStimuliTime) >= p_mean(clickDelaysAfterGettingCloseToSpecialStimuli) + 3*p_stdev(clickDelaysAfterGettingCloseToSpecialStimuli));
				let isMaliciousPureVirtualClick = (!isInFakeoutPhase && isUnusuallyLateClick && MouseProcessor.firstClick.initiator == 0 && MouseProcessor.secondClick.initiator == -1); 
				if (!isMaliciousPureVirtualClick) {
					if (phase > 1) {
						$('#humanClickFeedback').removeClass('feedbackDisappear');
						$('#machineClickFeedback').removeClass('feedbackDisappear');
						$('#humanClickFeedback').removeClass('feedbackSelected');
						$('#machineClickFeedback').removeClass('feedbackSelected');
						$('#gameGrid').addClass('greyBackground');
						$('#feedbackSpotlight').css('display', 'block');
						$('#feedbackSpotlightBorder').css('display', 'block');
						$('#feedback').css('display', 'block');
						$('#cursorFollower').css('display', 'none');
					}
					else {
						finaliseAndPersistTrialData();
						nextScreen();
					}
				}
				else {
					self.showWarning(experimentTexts['popups']['10'])
				}
			}, 750);
			// Pulse special stimuli
			$('#specialStimuliWrapper').addClass('clickedStimuliWrapper');
		}
	}
	
	/* SHOW/HIDE WARNING POPUP ---------------------------------------------- */
	showWarning(message, isMisclick) {
		if (!isTransitioning && !this.hasWarning && !$('#gameGridWrapper').hasClass('panDown')) {
			this.hasWarning = true;
			if (block > 0) { numWarnings[numWarnings.length-1] += 1; }
			$('#retryButton').removeClass('active');
			$('#warningPopup').css('display', 'block');
			$('#warningPopup').css('opacity', '1');
			$('#warningPopupMessage').html(message);
			this.toggleLock(0, false); 
			$('#borders').addClass('bordersComingIn');
			$('#borders').css('display', 'block');
			$('#stimuliGrid').addClass('stimuliGridShrink');
			$('#warningPopupTutorialText').remove();
			$('.instructionsReminderGif')[0].currentTime = 0;
			if (block == 0) { 
				let tutorialText = document.createElement("div");
				tutorialText.id = "warningPopupTutorialText";
				tutorialText.innerHTML = experimentTexts['tutorialReminder'];
				$('#warningPopupBoxContent').append(tutorialText);
			}
			// If trial screen is already deactivated, cancel the animation
			if (this.isDeactivated) {
				clearTimeout(this.deactivationTimeout);
				clearTimeout(this.panTimeout);
			}
			// Cancel lock timeout 
			clearTimeout(this.lockTimeout);
			this.trialData.popupType = $('#warningPopupMessage')[0].textContent || $('#warningPopupMessage')[0].innerText || "?";
			finaliseAndPersistTrialData();
		}
	}
	hideWarning() {
		$('#warningPopupMessage').html("");
		$('#warningPopup').css('display', 'none');
		$('#warningPopup').css('opacity', '0');
		$('#borders').removeClass('bordersComingIn');
		$('#borders').css('display', 'none');
		$('#stimuliGrid').removeClass('stimuliGridShrink');
		this.hasWarning = false;
	}

	/* UPDATE TRIAL COUNTER / PROGRESS BAR ---------------------------------- */
	updateTrialCounter() {
		let trialNumberInBlock = getTrialNumberInBlock()+1;
		// Update trial counter sprites
		let digits = formatTo2Digits(trialNumberInBlock).slice(-2);
		$('#trialCounterNumber').html("");
		let d1 = numberFontImages[parseInt(digits[0])];
		let d2 = (digits[0] == digits[1]) ? numberFontImages[parseInt(digits[1])].cloneNode(false) : numberFontImages[parseInt(digits[1])];
		$('#trialCounterNumber').append(d1);
		$('#trialCounterNumber').append(d2);
		$('#trialCounterNumber img:nth-child(1)').css("transform", "rotate(" + getRandomInt(-1, 4) + "deg)");
		$('#trialCounterNumber img:nth-child(2)').css("transform", "rotate(" + getRandomInt(-1, 4) + "deg)");
		// Update block counter 
		if (block == 0) {
			$('#blockCounter').html("<span style='color: #EC1C3A;'>" + experimentTexts['sidePanel']['levelCounter']['tutorial'] + "</span>" + "<br/>" + experimentTexts['sidePanel']['levelCounter']['label']);
		}
		else if (block < nbBlocs) {
			$('#blockCounter').html(experimentTexts['sidePanel']['levelCounter']['label'] + "<br/><span style='color: #EC1C3A;'>" + block + " / " + (nbBlocs-1) + "</span>");
		}
		else {
			$('#blockCounter').html(experimentTexts['sidePanel']['levelCounter']['label'] + "<br/><span style='color: #EC1C3A;'>" + experimentTexts['sidePanel']['levelCounter']['infinity'] + " " + (block-nbBlocs+1) + "</span>");
		}
	}
	updateProgressBar(offset) {
		let trialNumberInBlock = getTrialNumberInBlock(offset);
		let clampedBlock = clamp(block, 0, trialsPerBlock.length-1);
		let currBlockWidth = 94; 
		let lineMarginCounter = 0;
		$(".progressBarLine").each(function(i) {
			lineMarginCounter += (i == clampedBlock) ? currBlockWidth : (100 - currBlockWidth)/(nbBlocs-1);
			$(this).css('left', lineMarginCounter + '%');
		});
		
		let percentage = (100 - currBlockWidth)*clampedBlock/(nbBlocs-1) + (currBlockWidth)*(trialNumberInBlock)/trialsPerBlock[clampedBlock];
		$('#progressBarFilling').css('transform', 'scale(' + percentage/100 + ', 1)');
	}
	
	/* SET FOCUS TO TRIAL SCREEN AND SHOW IT -------------------------------- */
	show() {
		$('#infoScreen').css('display', 'none');
		$('#trialScreen').css('display', 'block');
		$('#debugScreen').css('display', 'none');
		currentScreen = 'trialScreen';
		let currBackground = $('#background').prop('src').split('/');
		if (currBackground[currBackground.length-1] != 'Background0.mp4') {
			$('#background').prop('src', 'resources/Animations/Background0.mp4');
		}
	}
	
	/* CONSTRUCTOR ---------------------------------------------------------- */ 
	constructor(isNewTrial) {
		
		// If this isn't a retry trial
		if (isNewTrial) { 
			// Count number of trials 
			trial++; 
			// Count number of blocks
			if (getTrialNumberInBlock() >= trialsPerBlock[clamp(block, 0, trialsPerBlock.length-1)]) {
				nextBlock();
				trialScreen.updateProgressBar(0);
			}
			else {
				hasEndedBlock = false;
			}
			// Cumulative counter (for the first block, 5 in a row)
			newTrialCounter++;
		}
		// If this is a retry
		else {
			// Reset cumulative counter / trial counter
			newTrialCounter = 0;
			if (block == 0 && trial > 0) {
				trial = 0;
			}
		}
		
		// Initialize the trial data object 
		this.trialData = {
			block: block, 
			trialInBlock: getTrialNumberInBlock()+1,
			trial: trial,
			startTime: "",
			endTime: "",
			popupType: "",
			nearTargetLobesCount: "",
			searchTime: "",
			timeMovedDuringLockedScreen: "",
			features_waitingTime: "",
			features_peakSpeed: "",
			features_accelerationTime: "",
			features_distance: "",
			humanClickTime: "",
			virtualClickTime: "",
			distanceToTargetWhenHumanClick: "",
			distanceToTargetWhenVirtualClick: "",
			firstClickType: "",
			secondClickType: "",
			timeBetweenClicks: "",
			perceivedFirstClickType: "",
			prediction_error: "",
			prediction_errorMean: "",
			prediction_errorStdev: "",
			prediction_computationTime: "",
			prediction_availableDelay: "",
			prediction_isOutlier: "",
			uncaughtPureVirtualClicksCounter: ""		
		}
		
		// Clear previous trial and lock it, hide warning popup if any, change header text 
		$('#gameGrid').removeClass('greyBackground');
		$('#gameGridWrapper').removeClass('panDown');
		$('#feedbackSpotlight').css('display', 'none');
		$('#feedbackSpotlightBorder').css('display', 'none');
		$('#feedback').css('display', 'none');
		$('#stimuliGrid').remove();
		this.hideWarning();
		this.isDeactivated = false;
		this.hasWarning = false;
		hasClickedOnSpecialStimuli = false;
		timesMovedDuringLockedScreen = 0;
		this.updateTrialCounter();
		$('#onScreenInstructions').html(experimentTexts['sidePanel']['instructions']['1']);
		$('#impactAnimation').css('display', 'none');
		
		// Choose motif set 
		let imageSetProgressions = [1, 2, 3, 5, 10, 6, 7, 4, 8, 11, 9, 12, 13];
		let allowedNumImageSets = 13 - 6 + clamp(block-1, 0, 6);
		let allowedImageSetProgressions = imageSetProgressions.slice(0, allowedNumImageSets);
		// Increase odds of selecting new motif
		if (block > 1) {
			for (let i = 0; i < allowedNumImageSets/10; i++) {
				allowedImageSetProgressions.push(allowedImageSetProgressions[allowedNumImageSets-1]);
			}
		}
		// Choose random motif from allowed list
		let imageSet = getRandomChoice(allowedImageSetProgressions);
		while (imageSet == previousImageSet) {
			imageSet = getRandomChoice(allowedImageSetProgressions);
		}
		previousImageSet = imageSet;
		// If this is the first trial of the block, choose the new motif
		if (getTrialNumberInBlock() == 0) {
			imageSet = allowedImageSetProgressions[allowedImageSetProgressions.length-1];
		}
		// Select a pair within that motif
		let imagePair = shuffle(stimuliParams[imageSet]["images"]).slice(0, 2); 
		
		// Calculate grid size 
		let dummy = document.createElement("div"); dummy.className = "stimuliGridCell";
		$('#gameGridWrapper').append(dummy);
		$('#trialScreen').css('display', 'block');
		let cellMargin = parseFloat($('.stimuliGridCell').css('margin').replace(/[^-\d\.]/g, ''));
		let cellPadding = parseFloat($('.stimuliGridCell').css('padding').replace(/[^-\d\.]/g, ''));
		let screenMargin = parseFloat($('#gameGrid').css('padding').replace(/[^-\d\.]/g, ''));
		let containerHeight = $('#gameGrid').height() - screenMargin;
		let containerWidth = $('#gameGrid').width() - screenMargin;
		this.nRow = 3 + difficulty; 
		this.nCol = Math.floor(this.nRow * containerWidth/containerHeight);
		$('#trialScreen').css('display', 'none');
		$('.stimuliGridCell').remove();
		
		// Choose position of special item 
		let si = getRandomInt(0, this.nRow);
		let sj = getRandomInt(0, this.nCol);
		
		// Choose special color
		let allcols = [1, 2, 3, 4]
		let scol = getRandomChoice(allcols);
		let cols = allcols.filter(function(value, index, arr) { 
	        return value != scol;
	    });
		
		// Create grid of stimuli
		let container = document.createElement("div");
        container.id = "stimuliGrid";
		for (let i = 0; i < this.nRow; i++) {
			// Create row
			let row = document.createElement("div");
			row.className = "stimuliGridRow";
			//row.id = "stimuliGridRow" + i;
			for (let j = 0; j < this.nCol; j++) {
				// Create cell 
			    let cell = document.createElement("div"); 
				cell.className = "stimuliGridCell locked";
				//cell.id = "stimuliGridCell" + j;
			    row.appendChild(cell);
				// Create image
				let isSpecialStimuli = (i == si && j == sj);
				let imgWrapper = document.createElement("div");
				imgWrapper.className = "stimuliWrapper";
				let img; 
				if (isSpecialStimuli) {
					img = imagePair[0][scol-1].cloneNode(false);
					img.id = "specialStimuli";
					imgWrapper.id = "specialStimuliWrapper";
					cell.id = "specialStimuliCell";
				}
				else {
					img = imagePair[1][getRandomChoice(cols)-1].cloneNode(false);
				}
				imgWrapper.appendChild(img);
				cell.appendChild(imgWrapper);	
			}
			container.appendChild(row);
		}
		// Add the grid to the game 
        $('#gameGridWrapper').prepend(container); 
		
		// Calculate and apply cell size 
		let size = (containerHeight - cellMargin) / this.nRow - 2*cellMargin - 2*cellPadding;
		let borderSize = size*0.15;
		$('.stimuliGridCell').css('width', size + "px");
		$('.stimuliGridCell').css('height', size + "px");
		$('.stimuliGridCell').css('border-radius', borderSize + "px");
		
		// Reset pos/size variables
		specialStimuliPos = undefined;
		specialStimuliSize = undefined;
		saveSpecialStimuliAttributes = false;
		
		// Adjust special stimuli position if too close to mouse or too far away
		if (DataManager.surveyResults.miscellaneous.experimentStart != '') {
			$('#trialScreen').css('display', 'block');
			if (MouseProcessor.mousePos[0] != -1 && MouseProcessor.mousePos[1] != -1) {
				while ((MouseProcessor.mouseIsCloseToSpecialStimuli(2)) || (!MouseProcessor.mouseIsCloseToSpecialStimuli(5))) {
					if (MouseProcessor.mouseIsCloseToSpecialStimuli(2)) { console.log("--- Special Stimuli is too close to mouse!"); }
					else { console.log("--- Special Stimuli is too far away from mouse!"); }
					// Choose the image of a random child from random col of the container
					let numberElements = $(".stimuliGridCell").length;
					let otherImage = $(".stimuliGridCell").eq(getRandomInt(0, numberElements)).find("img");
					let specialStimuliSrc = $('#specialStimuli').prop('src'); 
					// Set the specialStimuli's src to the other image's one and id / parent cell id to ""
					$('#specialStimuli').prop('src', otherImage.prop('src'));
					$('#specialStimuli').parent().parent().prop('id', '');
					$('#specialStimuli').parent().prop('id', '');
					$('#specialStimuli').prop('id', '');
					// Set its src to the special stimuli's one, and id / parent cell to "specialStimuli"
					otherImage.prop('src', specialStimuliSrc);
					otherImage.parent().parent().prop('id', 'specialStimuliCell');
					otherImage.parent().prop('id', 'specialStimuliWrapper');
					otherImage.prop('id', 'specialStimuli');
				}
			}
			$('#trialScreen').css('display', 'none');
		}
		
		// Randomly rotate stimuli 
		if (difficulty >= 1) {
			let possibleRotations = [];
			for (let i = 0; i < 8; i++) {
				possibleRotations.push(i*stimuliParams[imageSet]["orientationStep"]);
			}
			$(".stimuli").each(function() {
				$(this).css('transform','rotate('+getRandomChoice(possibleRotations)+'deg)'); 
			});
		}
		
		// From now on, try to save special stimuli attributes so you don't have to compute them again
		saveSpecialStimuliAttributes = true;
		
		// Lock screen 
		this.toggleLock(0, false);
		
		// Set timeout if user searches for too long 
		var self = this;
		clearTimeout(this.searchTimeout);
		this.searchTimeout = setTimeout(function() { self.showWarning(experimentTexts['popups']['11']); }, 16000);
		
		// Save trial construction time 
		trialStartTime = getTimestamp();
		this.trialData.startTime = getDatestamp();
		
		// Trial screen special stimuli MOUSE CLICK listener 
		$('#specialStimuliCell').on("mousedown", function(event) {
			var timestamp = getTimestamp();
			// If the grid is unlocked,
			if (!self.isLocked() && !hasClickedOnSpecialStimuli) {
				hasClickedOnSpecialStimuli = true;
				// Stop timeouts and intervals
				clearTimeout(self.lockTimeout);
				MouseProcessor.stopRecordUnlockedMouse();
				// Detect clicks that have dragged on for too long
				let isInFakeoutPhase = (phase == 1 && block == 1 && getTrialNumberInBlock() >= trialsPerBlock[block]-10);
				let isUnusuallyLateClick = (clickDelaysAfterGettingCloseToSpecialStimuli.length > 5 && hasGottenCloseToSpecialStimuliTime > -1 && (getTimestamp() - hasGottenCloseToSpecialStimuliTime) >= p_mean(clickDelaysAfterGettingCloseToSpecialStimuli) + 3*p_stdev(clickDelaysAfterGettingCloseToSpecialStimuli));
				let isMaliciousWaitedClick = (!isInFakeoutPhase && phase == 2 && isUnusuallyLateClick && MouseProcessor.firstClick.initiator == 0 && MouseProcessor.secondClick.initiator == -1); 
				// Register click instant
				MouseProcessor.registerHumanClick(timestamp);
				// If not in tutorial 
				let hasExtractedFeatures = (JSON.stringify(MouseProcessor.extractedFeatures) != JSON.stringify({distance: -1, peakValue: -1, accelerationTime: -1, waitingTime: -1}));
				if (block > 0 && hasExtractedFeatures) { 
					// Save trial data in the program 
					regressionInputs.push(MouseProcessor.extractedFeatures);
					regressionOutputs.push(self.trialData.humanClickTime);
					sumNearTargetLobes += self.trialData.nearTargetLobesCount;
					averageNearTargetLobes = sumNearTargetLobes / regressionInputs.length;
					if (!isInFakeoutPhase && !isMaliciousWaitedClick && hasGottenCloseToSpecialStimuliTime > -1) { 
						clickDelaysAfterGettingCloseToSpecialStimuli.push(timestamp - hasGottenCloseToSpecialStimuliTime); 
					}
					// If there's been a prediction,
					if (predictorOutput >= 0) {
						// Save prediction error in the program
						let predictionError = predictorOutput - (timestamp - MouseProcessor.unlockInstant);
						let errorMean = p_mean(predictionErrors);
						let errorStdev = p_stdev(predictionErrors); 
						let isOutlier = predictionError < errorMean - 2*errorStdev || predictionError > errorMean + 2*errorStdev;
						if ((!isOutlier && phase > 1) || (phase == 1)) { predictionErrors.push(predictionError); }
						// Complete trial data for the results file 
						self.trialData.prediction_error = predictionError;
						self.trialData.prediction_errorMean = errorMean;
						self.trialData.prediction_errorStdev = errorStdev;
						if (phase > 1) { self.trialData.prediction_isOutlier = isOutlier; }
					}
				}
				// Throw popup in the case of a malicioius click
				if (isMaliciousWaitedClick) {
					self.showWarning(experimentTexts['popups']['10'])
				}
				// Hide all other stimuli, transition into feedback screen or next trial screen
				self.deactivate();
				// Update progress bar if in phase 1
				if (phase == 1) { self.updateProgressBar(1); }
			}
		});
		$('#specialStimuliCell').on("machine:mousedown", function(event) {
			// Stop timeouts and intervals
			clearTimeout(self.lockTimeout);
			MouseProcessor.stopRecordUnlockedMouse();
			// Transition into feedback screen
			self.deactivate();
		});
		
	}
	
}