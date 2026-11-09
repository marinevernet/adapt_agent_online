var predictorOutput = -1;
var predictorTimeBegin = 0;
var predictorTime = 0;
var timeBeforeTrigger = 0;
var warningOverlayOpacity = 0;
var hasGottenCloseToSpecialStimuliTime = -1;

let hasMovedTowardsSpecialStimuli = false;
let isInLobe = false;
let hasReachedPeak = false;
let isNearTargetLobe = false;
let lobeDetectionThreshold = 0.2;
let lobeDescentCount = 0;
let zeroSpeedsCount = 0;
let nearTargetCount = 0;
let mouseToSpecialStimuliDist = -1;
let mouseToSpecialStimuliDir = -1;
let lobeProperties = {beginTime: -1, endTime: -1, peakTime: -1, peakValue: -1, beginMousePos: [-1, -1]};

class MouseProcessor {
	
	/* ATTRIBUTES */
	static mousePos = [-1, -1];
    static mousePrevPos = [-1, -1];
    static mouseCoords = [];
    static mouseSpeeds = [];
    static mouseZeroSpeedsCounter = 0;
	static mouseNonZeroSpeedsCounter = 0;
	
	static extractedFeatures = {distance: -1, peakValue: -1, accelerationTime: -1, waitingTime: -1};
	
	static nearTargetLobesCount = 0;
	static lobesCount = 0;
	
	static unlockedMouseListeningInterval;
	static lockedMouseListeningInterval;
	
	static clickTime;
	static unlockInstant;
	
	// (1 = human, 0 = machine)
	static firstClick = {initiator: -1, instant: -1};
	static secondClick = {initiator: -1, instant: -1};

	/* UPDATE MOUSE COORDINATES --------------------------------------------- */
	static updateMousePos(event) {
		MouseProcessor.mousePos[0] = event.pageX;
		MouseProcessor.mousePos[1] = event.pageY;
	}

	/* MOUSE CHECKS --------------------------------------------------------- */
	static mouseIsCloseToSpecialStimuli(margin) {
		let distanceDiff = distance(MouseProcessor.mousePos, trialScreen.getSpecialStimuliPos());
		return distanceDiff < trialScreen.getSpecialStimuliSize()*margin;
	}
	static mouseIsInGrid() {
		let gridBounds = document.getElementById("gameGrid").getBoundingClientRect();
		return (
			MouseProcessor.mousePos[0] >= gridBounds.left && 
			MouseProcessor.mousePos[0] <= gridBounds.right &&
			MouseProcessor.mousePos[1] >= gridBounds.top &&
			MouseProcessor.mousePos[1] <= gridBounds.bottom
		)
	}
	
	/* RESET FUNCTIONS ------------------------------------------------------ */
	static resetMetrics() {
		MouseProcessor.mouseCoords = [];
		MouseProcessor.mouseSpeeds = [];
	}
	static saveMouseDistance() {
		MouseProcessor.mouseToSpecialStimuliDist = distance(trialScreen.getSpecialStimuliPos(), MouseProcessor.mousePos);
	}
	static resetUnlockedProcessingVariables() {
		MouseProcessor.mouseZeroSpeedsCounter = 0;
		MouseProcessor.mouseNonZeroSpeedsCounter = 0;
		MouseProcessor.nearTargetLobesCount = 0;
		MouseProcessor.lobesCount = 0;
		MouseProcessor.extractedFeatures = {distance: -1, peakValue: -1, accelerationTime: -1, waitingTime: -1};
		MouseProcessor.firstClick = {initiator: -1, instant: -1};
		MouseProcessor.secondClick = {initiator: -1, instant: -1};
		hasGottenCloseToSpecialStimuliTime = -1;
		predictorOutput = -1;
		predictorTimeBegin = 0;
		predictorTime = 0;
		hasMovedTowardsSpecialStimuli = false;
		isInLobe = false;
		hasReachedPeak = false;
		isNearTargetLobe = false;
		lobeDetectionThreshold = 0.2;
		lobeDescentCount = 0;
		zeroSpeedsCount = 0;
		nearTargetCount = 0;
		mouseToSpecialStimuliDist = -1;
		mouseToSpecialStimuliDir = -1;
		lobeProperties = {beginTime: -1, endTime: -1, peakTime: -1, peakValue: -1, beginMousePos: [-1, -1]};
		//let normalDistribution = new NormalDistribution(p_mean(predictionErrors), p_stdev(predictionErrors));
		//timeBeforeTrigger = solveNormalDistribution(normalDistribution, 0.7);
		//let humanResponsesPercentage = p_mean(perceivedClickTypes);
		let maxTimeBack = 100; //map(humanResponsesPercentage, 0, 1, 20, 120, true);
		let meanAndStdev = p_mean(predictionErrors) + p_stdev(predictionErrors);
		timeBeforeTrigger = meanAndStdev < maxTimeBack ? getRandomInt(meanAndStdev, maxTimeBack) : meanAndStdev;
		console.log("TIME BEFORE TRIGGER:", timeBeforeTrigger);
	}
	
	/* EXTRACT FEATURES FROM SPEED ------------------------------------------ */
	static extractFeatures() {

		let currSpeed = MouseProcessor.mouseSpeeds[MouseProcessor.mouseSpeeds.length-1];
		let isCloseToSpecialStimuli = MouseProcessor.mouseIsCloseToSpecialStimuli(1);

		// If speeds pick up, we've entered a lobe
		if (currSpeed > lobeDetectionThreshold && !isInLobe) {
			// Save properties
			isInLobe = true;
			MouseProcessor.lobesCount++;
			lobeProperties = {beginTime: -1, endTime: -1, peakTime: -1, peakValue: -1, beginMousePos: [-1, -1]};
			lobeProperties.beginTime = getTimestamp(); 
			lobeProperties.beginMousePos = [...MouseProcessor.mousePos];
			mouseToSpecialStimuliDist = distance(MouseProcessor.mousePos, trialScreen.getSpecialStimuliPos());
			mouseToSpecialStimuliDir = direction(MouseProcessor.mousePos, trialScreen.getSpecialStimuliPos());
			// Determine whether it's a near target lobe 
			if (isCloseToSpecialStimuli) {
				MouseProcessor.nearTargetLobesCount++;
				isNearTargetLobe = true;
				console.log("Extra lobe near target (" + MouseProcessor.nearTargetLobesCount + ")");
				// If too many lobes near target (more than average), cancel prediction
				if (MouseProcessor.nearTargetLobesCount > Math.ceil(averageNearTargetLobes) + 1) {
					predictorOutput = -1;
					trialScreen.trialData.virtualClickTime = "";
					trialScreen.trialData.timeBetweenClicks = "";
					trialScreen.trialData.secondClickType = "";
				}
			}
			else if (MouseProcessor.lobesCount > 2) {
				trialScreen.showWarning(experimentTexts['popups']['3']);
			}
		}
		
		// If beginning is before instant 0, try to estimate real beginning
		if (MouseProcessor.unlockInstant - lobeProperties.beginTime < -1 && MouseProcessor.mouseSpeeds.length == 2) {
			// Calculate tangent of the first 2 points 
			let y0 = MouseProcessor.mouseSpeeds[0];
			let y1 = MouseProcessor.mouseSpeeds[1];
			let xe = timeSampleRate*(y0)/(y0-y1);
			// If the estimated beginning is coherent and close enough, keep it
			if (y0-y1 != 0 && xe <= 0 && xe >= -10*timeSampleRate) {
				lobeProperties.beginTime = MouseProcessor.unlockInstant + xe;
			}
			// Otherwise (not coherent or too far away) throw error
			else {
				trialScreen.showWarning(experimentTexts['popups']['4']);
			}
		}
		
		// If immobile, increase counter 
		if (currSpeed == 0) {
			zeroSpeedsCount++;
			let zeroTimeThreshold = isCloseToSpecialStimuli ? 20 : 8;
			// If mouse has been immobile for too long away from target, throw error
			if (zeroSpeedsCount >= 4 && hasMovedTowardsSpecialStimuli && !isCloseToSpecialStimuli) {
				trialScreen.showWarning(experimentTexts['popups']['5']);
			}
		}
		else {
			zeroSpeedsCount = 0;
		}
		
		// If around target, increase counter 
		if (isCloseToSpecialStimuli) {
			nearTargetCount++;
			// If mouse has been too long around target, throw error
			if (nearTargetCount >= 48) {
				trialScreen.showWarning(experimentTexts['popups']['6']);
			}
		}
		else {
			nearTargetCount = 0;
		}
		
		// While in the lobe, record max speeds
		if (isInLobe && !hasReachedPeak) {
			if (currSpeed >= lobeProperties.peakValue) {
				lobeDescentCount = 0;
				lobeProperties.peakValue = currSpeed;
				lobeProperties.peakTime = getTimestamp(); 
			}
			else {
				lobeDescentCount++;
				// If we've been descending for too long, we've found the peak, we can stop 
				if (lobeDescentCount >= 2) {
					let currDir = direction(lobeProperties.beginMousePos, MouseProcessor.mousePos);
					let angleDiff = Math.abs((currDir - mouseToSpecialStimuliDir + 180 + 360) % 360 - 180);
					let isInTheRightDirection = angleDiff < 45;
					// If we're indeed moving towards the target 
					if (isInTheRightDirection || isCloseToSpecialStimuli) {
						// If it's the first movement towards target
						if (!hasMovedTowardsSpecialStimuli) {
							// Save properties to be used as inputs
							MouseProcessor.extractedFeatures.distance = mouseToSpecialStimuliDist;
							MouseProcessor.extractedFeatures.peakValue = lobeProperties.peakValue;
							MouseProcessor.extractedFeatures.accelerationTime = lobeProperties.peakTime - lobeProperties.beginTime;	
							MouseProcessor.extractedFeatures.waitingTime = lobeProperties.beginTime - MouseProcessor.unlockInstant;						
							hasMovedTowardsSpecialStimuli = true;
							// Launch Regression
							predictorTimeBegin = getTimestamp() - MouseProcessor.unlockInstant;
							predictorOutput = predictClickTime(MouseProcessor.extractedFeatures);
							if (predictorOutput) {
								// Calculate time to click based on prediction, adapt it to sample rate
								let machineClickTime = predictorOutput - timeBeforeTrigger;
								machineClickTime = Math.floor(machineClickTime / timeSampleRate) * timeSampleRate;
								// We assume the machine click will be the second click at first 
								MouseProcessor.registerMachineClick(MouseProcessor.unlockInstant + machineClickTime, false);
								// Save data 
								trialScreen.trialData.prediction_computationTime = predictorTime;
								trialScreen.trialData.prediction_availableDelay = predictorOutput - (predictorTimeBegin + predictorTime);
							}
						}
						hasReachedPeak = true;
					}
					// Otherwise throw error
					else {
						trialScreen.showWarning(experimentTexts['popups']['7']);
					}
				}
			}
		}
		
		// If speed goes back down, we've gone out of a lobe
		if (currSpeed < lobeDetectionThreshold && isInLobe) {
			isInLobe = false;
			hasReachedPeak = false;
			lobeProperties.endTime = getTimestamp(); 
		}
		
		let isInFeedbackPhase = (phase > 1);
		let isInFakeoutPhase = (phase == 1 && block == 1 && getTrialNumberInBlock() >= trialsPerBlock[block]-10);
		let phaseConditions = (isInFeedbackPhase || isInFakeoutPhase);
		let timestamp = getTimestamp();
		let currTime = timestamp - MouseProcessor.unlockInstant;
		
		if (!trialScreen.hasWarning && MouseProcessor.firstClick.initiator == -1) {
			
			// Simulate machine click SUPER EARLY in the 5 last trials of the training phase
			if (isInFakeoutPhase) {
				if (getTrialNumberInBlock() >= trialsPerBlock[block]-5 && lobeProperties.peakTime != -1 && lobeProperties.beginTime != -1) {
					let machineClickTime = map(getTrialNumberInBlock() - (trialsPerBlock[block]-5), 0, 6, lobeProperties.peakTime, lobeProperties.beginTime, true) - MouseProcessor.unlockInstant;
					if (currTime >= machineClickTime) {
						// Trigger machine click 
						MouseProcessor.registerMachineClick(timestamp, true);
						$("#specialStimuliCell").trigger("machine:mousedown");
					}
				}
			}
			
			// Simulate machine click if the time is right 
			if (predictorOutput > 0) {
				// Get time to click based on prediction, adapt it to sample rate
				let machineClickTime = predictorOutput - timeBeforeTrigger;
				machineClickTime = Math.floor(machineClickTime / timeSampleRate) * timeSampleRate;
				machineClickTime = Math.max(machineClickTime, currTime);
				if (isInFakeoutPhase) { 
					machineClickTime -= map(getTrialNumberInBlock() - (trialsPerBlock[block]-10), 0, 5, 0, 200, true); 
				}
				if (currTime >= machineClickTime) {
					// Trigger machine click 
					MouseProcessor.registerMachineClick(timestamp, true);
					if (phaseConditions) {
						$("#specialStimuliCell").trigger("machine:mousedown");
					}
				}
			}
			
		}
		
		return hasMovedTowardsSpecialStimuli;
		
	}
	
	/* REGISTER CLICKS ON TARGET -------------------------------------------- */
	static registerHumanClick(timestamp) {
		if (MouseProcessor.mouseIsCloseToSpecialStimuli(2)) {
			if (MouseProcessor.firstClick.initiator == -1) {
				// Set first click as human click 
				MouseProcessor.firstClick.initiator = 1;
				MouseProcessor.firstClick.instant = timestamp;
				trialScreen.trialData.firstClickType = MouseProcessor.firstClick.initiator;
				console.log("FIRST click registered as HUMAN");
			}
			else if (MouseProcessor.secondClick.initiator == -1) {
				// Set second click as human click 
				MouseProcessor.secondClick.initiator = 1;
				MouseProcessor.secondClick.instant = timestamp;
				trialScreen.trialData.secondClickType = MouseProcessor.secondClick.initiator;
				console.log("SECOND click registered as HUMAN");
			}
			trialScreen.trialData.humanClickTime = timestamp - MouseProcessor.unlockInstant;
			trialScreen.trialData.distanceToTargetWhenHumanClick = distance(MouseProcessor.mousePos, trialScreen.getSpecialStimuliPos());
			let deltaTime = Math.abs(MouseProcessor.secondClick.instant - MouseProcessor.firstClick.instant);
			if (MouseProcessor.firstClick.initiator == 0) deltaTime *= -1;
			if (MouseProcessor.firstClick.instant == -1 || MouseProcessor.secondClick.instant == -1) { deltaTime = ""; }
			trialScreen.trialData.timeBetweenClicks = deltaTime;
		}
	}
	static registerMachineClick(timestamp, first) {
		if (first) {
			if (MouseProcessor.firstClick.initiator == -1) {
				// Set first click as machine click 
				MouseProcessor.firstClick.initiator = 0;
				MouseProcessor.firstClick.instant = timestamp;
				trialScreen.trialData.firstClickType = MouseProcessor.firstClick.initiator;
				console.log("FIRST click registered as MACHINE");
				// Reset second click (firstly assumed to be machine click) to no one 
				if (MouseProcessor.secondClick.initiator == 0) {
					MouseProcessor.secondClick.initiator = -1;
					MouseProcessor.secondClick.instant = -1;
					trialScreen.trialData.secondClickType = "";
				}
			}
		}
		else {
			if (MouseProcessor.secondClick.initiator == -1) {
				// Set second click as machine click 
				MouseProcessor.secondClick.initiator = 0;
				MouseProcessor.secondClick.instant = timestamp;
				trialScreen.trialData.secondClickType = MouseProcessor.secondClick.initiator;
				console.log("SECOND click registered as MACHINE (for now)");
			}
		}
		trialScreen.trialData.virtualClickTime = getTimestamp() - MouseProcessor.unlockInstant;
		if (first) trialScreen.trialData.distanceToTargetWhenVirtualClick = distance(MouseProcessor.mousePos, trialScreen.getSpecialStimuliPos());
		let deltaTime = Math.abs(MouseProcessor.secondClick.instant - MouseProcessor.firstClick.instant);
		if (MouseProcessor.firstClick.initiator == 0) deltaTime *= -1;
		if (MouseProcessor.firstClick.instant == -1 || MouseProcessor.secondClick.instant == -1) { deltaTime = ""; }
		trialScreen.trialData.timeBetweenClicks = deltaTime;
	}

	/* ABBERANT 0 VALUE FIXER ----------------------------------------------- */
	static fixSingleZeroValues() {

		if (MouseProcessor.mouseSpeeds.length < 3) { return; }
		let anteSpeed = MouseProcessor.mouseSpeeds[MouseProcessor.mouseSpeeds.length-3];
		let prevSpeed = MouseProcessor.mouseSpeeds[MouseProcessor.mouseSpeeds.length-2];
		let currSpeed = MouseProcessor.mouseSpeeds[MouseProcessor.mouseSpeeds.length-1];
		
		// If there is a sudden drop to 0, that's an anomaly
		let zeroDetectionThreshold = 2
		if (currSpeed == 0 && prevSpeed > zeroDetectionThreshold) {
			// Remove the value and replace it with an interpolated value (calculated using previous tangent)
			let anteTime = (MouseProcessor.mouseSpeeds.length-3)*timeSampleRate;
			let prevTime = (MouseProcessor.mouseSpeeds.length-2)*timeSampleRate;
			let currTime = (MouseProcessor.mouseSpeeds.length-1)*timeSampleRate;
			let a1 = (prevSpeed - anteSpeed) / timeSampleRate;
			let b1 = prevSpeed - a1*prevTime;
			let iY = a1*currTime + b1;
			iY = Math.max(0, iY);
			MouseProcessor.mouseSpeeds[MouseProcessor.mouseSpeeds.length-1] = iY;
			console.log("fixed ghosting error:", currTime);
		}
		
	}
	
	/* STOP MOUSE PROCESSORS ------------------------------------------------ */
	static stopRecordUnlockedMouse() {
		clearInterval(MouseProcessor.unlockedMouseListeningInterval);
	}
	static stopRecordLockedMouse() {
		clearInterval(MouseProcessor.lockedMouseListeningInterval);
	}

	/* UNLOCKED MOUSE PROCESSOR --------------------------------------------- */
	static processUnlockedMouse() {
		if (currentScreen != 'trialScreen' || trialScreen.hasWarning) MouseProcessor.stopRecordUnlockedMouse();
		// Save mouse coordinates 
		if (MouseProcessor.mousePos[0] != -1 && MouseProcessor.mousePos[1] != -1) {
			MouseProcessor.mouseCoords.push([...MouseProcessor.mousePos]);
		}
		// Save instantaneous speed, process it
		if (MouseProcessor.mouseCoords.length >= 2) {
			let cp = MouseProcessor.mouseCoords[MouseProcessor.mouseCoords.length-1];
			let pp = MouseProcessor.mouseCoords[MouseProcessor.mouseCoords.length-2]
			let currSpeed = distance(cp, pp)/timeSampleRate;
			MouseProcessor.mouseSpeeds.push(currSpeed);
			MouseProcessor.fixSingleZeroValues();
			MouseProcessor.extractFeatures();
		}
		// Hide the mouse moving warning text 
		$("#warningOverlayBox").css('opacity', 0);
		warningOverlayOpacity = 0;
	}

	/* LOCKED MOUSE PROCESSOR ----------------------------------------------- */
	static processLockedMouse() {
		if (currentScreen != 'trialScreen' || trialScreen.hasWarning) MouseProcessor.stopRecordLockedMouse();
		// Compute current distance to special stimuli 
		let dP = distance(MouseProcessor.mousePrevPos, MouseProcessor.mousePos);
		let dT = timeSampleRate;
		let currSpeed = dP/dT;
		// Update previous pos 
		MouseProcessor.mousePrevPos = [...MouseProcessor.mousePos];
		// Warn user if he's moving mouse 
		if (!trialScreen.hasWarning) {
			warningOverlayOpacity += map(currSpeed, 0, 0.8, -0.05, 0.12, true);
			warningOverlayOpacity = clamp(warningOverlayOpacity, 0, 4);
			$("#warningOverlayBox").css('opacity', clamp(warningOverlayOpacity, 0, 1));
			timesMovedDuringLockedScreen += $("#warningOverlayBox").css('opacity')*0.02;
		}
		else {
			$("#warningOverlayBox").css('opacity', 0);
			warningOverlayOpacity = 0;
		}
		// Throw error is mouse is close to special stimuli
		if (MouseProcessor.mouseIsCloseToSpecialStimuli(1.5) && !trialScreen.isDeactivated) {
			trialScreen.showWarning(experimentTexts['popups']['8']);
		}
	}
	
	/* START MOUSE PROCESSORS ------------------------------------------------ */
	static startRecordUnlockedMouse() {
		MouseProcessor.resetUnlockedProcessingVariables();
		clearInterval(MouseProcessor.unlockedMouseListeningInterval);
		MouseProcessor.unlockedMouseListeningInterval = setInterval(MouseProcessor.processUnlockedMouse, timeSampleRate);
	}
	static startRecordLockedMouse() {	
		MouseProcessor.mousePrevPos = [...MouseProcessor.mousePos];
		clearInterval(MouseProcessor.lockedMouseListeningInterval);
		MouseProcessor.lockedMouseListeningInterval = setInterval(MouseProcessor.processLockedMouse, timeSampleRate);
	}

}