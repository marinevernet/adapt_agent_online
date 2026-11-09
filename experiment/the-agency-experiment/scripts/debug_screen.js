class DebugScreen {
	
	/* ATTRIBUTES ----------------------------------------------------------- */
	graphVitesses;
    graphPositions;

	/* SHOW ----------------------------------------------------------------- */
	show() {
		$('#debugScreen').css('display', 'block');
		// Construct speed chart 
		let times = [];
		for (let i = 0; i < MouseProcessor.mouseSpeeds.length; i++) { times.push(i*timeSampleRate); } 
		const dataVitesses = {
		  labels: times,
		  datasets: [{
			  label: 'Vitesse de la souris',
			  data: MouseProcessor.mouseSpeeds,
			  borderColor: 'rgb(0, 0, 255)',
			  backgroundColor: 'rgb(0, 0, 255)',
			  cubicInterpolationMode: 'monotone',
			  tension: 0.4
		  }]
		};
		const configVitesses = {
		  type: 'line',
		  data: dataVitesses,
		  options: {
			scales: {
			  x: {display: true, title: { display: true, text: 'time (ms)' }},
			  y: {display: true, title: { display: true, text: 'speed (px/ms)' }}
			}
		  }
		};
		const dataPositions = {
			datasets: [{
				label: 'Position de la souris',
				data: [],
				backgroundColor: 'rgb(255, 0, 0)',
				showLine: true,
				pointRadius: 3,
				borderColor: 'rgb(255, 0, 0)',
				borderWidth: 2,
			  }],
		};
		for (var i = 0; i < MouseProcessor.mouseCoords.length; i++) {
			dataPositions.datasets[0].data.push({
				x: MouseProcessor.mouseCoords[i][0], 
				y: $(window).height() - MouseProcessor.mouseCoords[i][1]
			});
		}
		const configPositions = {
		  type: 'scatter',
		  data: dataPositions,
		  options: {
			scales: {
			  x: {min: 0, max: $(window).width()},
			  y: {min: 0, max: $(window).height()}
			}
		  }
		};
		this.graphVitesses.destroy();
		this.graphPositions.destroy();
		this.graphVitesses = new Chart($('#mesuresVitesse'), configVitesses);
		this.graphPositions = new Chart($('#mesuresPosition'), configPositions);
	}
	
	/* CONSTRUCTOR ---------------------------------------------------------- */
	constructor() {
		this.graphVitesses = new Chart($('#mesuresVitesse'), {});
		this.graphPositions = new Chart($('#mesuresPosition'), {});
	}
}