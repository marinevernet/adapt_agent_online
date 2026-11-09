/* MULTIVARIATE WEIGHTED LINEAR REGRESSION ---------------------------------- */
function predictClickTime(inputObject) {
	
	let t0 = getTimestamp();
	
	// Get dimensions
	let input = Object.values(inputObject);
	let m = regressionInputs.length;
	let n = input.length + 1;
	let tau = rememberingFactor;
	input.push(1);
	
	// No use trying to make predictions if not enough data
	if (m < 5) return;
	
	// Construct W*X and Y matrix
	let WXarray = [];
	let WYarray = [];
	// Line by line...
	for (let i = 0; i < m; i++) {
		// Input set from historical data 
		let x = Object.values(regressionInputs[i]); 
		let y = regressionOutputs[i];
		x.push(1);
		// Construct local spacial weighing factor (UNUSED)
		let wsum = 0; for (let j = 0; j < n; j++) { wsum += math.square(x[j] - input[j]); }
		let w1 = math.sqrt(math.exp(-(wsum)/(2*math.square(tau))));
		// Construct local temporal weighing factor 
		let w2 = math.sqrt(math.exp(-math.square(i-m)/math.square(tau)));
		// Construct current line for W*X
		let line = [];
		for (let j = 0; j < n; j++) { line.push(w2*x[j]); }
		WXarray.push(line);
		// Construct current line for Y
		WYarray.push([w2*y]);
	}
	let WX = new Matrix(WXarray);
	let WY = new Matrix(WYarray);
	
	// Calculate regression parameters 
	let THETA = solve(WX, WY, (useSVD = true));
	
	// Predict based on regression 
	let output = 0;
	for (let j = 0; j < n; j++) { output += THETA.get(j, 0)*input[j]; }
	
	// Adapt prediction based on previous errors
	if (predictionErrors.length > 2 && phase > 1) {
		let previousErrorMean = p_mean(predictionErrors);
		output -= previousErrorMean;
	}
	
	let t1 = getTimestamp();
	predictorTime = (t1 - t0);
	console.log("finished prediction in", predictorTime, "ms :", output);
	
	return output;
	
}

/* POLYNOMIAL REGRESSION ON THE FIRST FEATURE ONLY -------------------------- */
function predictClickTime_2(inputObject) {
	
	let t0 = getTimestamp();
	
	let input = Object.values(inputObject)[0];
	let x = [];
	let m = regressionInputs.length;
	for (let i = 0; i < m; i++) {
		x.push(Object.values(regressionInputs[i])[0]);
	}
	let y = regressionOutputs;
	
	const regression = new PolynomialRegression(x, y, 5);
	const output = regression.predict(input);
	
	let t1 = getTimestamp();
	predictorTime = (t1 - t0);
	console.log("finished prediction in", predictorTime, "ms :", output);
	
	return output;
	
}

/* MULTIVARIATE POLYNOMIAL REGRESSION --------------------------------------- */
function predictClickTime_3(inputObject) {
	
	let t0 = getTimestamp();
	
	let input = Object.values(inputObject);
	let x = []; let y = [];
	let m = regressionInputs.length;
	for (let i = 0; i < m; i++) {
		x.push(Object.values(regressionInputs[i]));
		y.push([regressionOutputs[i]]);
	}

	const model = new MultivariatePolynomialRegression(3);
	model.fit(x, y);
	const output = model.predict([input])[0];
	
	let t1 = getTimestamp();
	predictorTime = (t1 - t0);
	console.log("finished prediction in", predictorTime, "ms :", output);
	
	return output;
	
}

/* MULTIVARIATE LINEAR REGRESSION ------------------------------------------- */
function predictClickTime_4(inputObject) {
	
	let t0 = getTimestamp();
	
	let input = Object.values(inputObject);
	let x = []; let y = [];
	let m = regressionInputs.length;
	for (let i = 0; i < m; i++) {
		x.push(Object.values(regressionInputs[i]));
		y.push([regressionOutputs[i]]);
	}
	
	const regression = new MultivariateLinearRegression(x, y);
	const output = regression.predict(input);
	
	let t1 = getTimestamp();
	predictorTime = (t1 - t0);
	console.log("finished prediction in", predictorTime, "ms :", output);
	
	return output;
	
}

/* DECISION TREE REGRESSION ON THE FIRST FEATURE ONLY ----------------------- */
function predictClickTime_5(inputObject) {
	
	let t0 = getTimestamp();
	
	let input = Object.values(inputObject)[0];
	let x = [];
	let m = regressionInputs.length;
	for (let i = 0; i < m; i++) {
		x.push(Object.values(regressionInputs[i])[0]);
	}
	let y = regressionOutputs;
	
	const regression = new DecisionTreeRegression();
	regression.train(x, y);
	const output = regression.predict([input])[0];
	
	let t1 = getTimestamp();
	predictorTime = (t1 - t0);
	console.log("finished prediction in", predictorTime, "ms :", output);
	
	return output;
	
}