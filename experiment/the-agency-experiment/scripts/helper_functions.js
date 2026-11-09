/* RANDOM FUNCTIONS --------------------------------------------------------- */
function getRandomInt(min, max) {
	return min + Math.floor(Math.random() * (max - min));
}
function getRandomChoice(array) {
	return array[getRandomInt(0, array.length)];
}
function shuffle(array) {
	for(let i = array.length - 1; i > 0; i--){
		const j = Math.floor(Math.random() * i)
		const temp = array[i]
		array[i] = array[j]
		array[j] = temp
	}
	return array;
}

/* DISTANCE FUNCTION -------------------------------------------------------- */
function distance(p1, p2) {
	return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

/* DIRECTION FUNCTION ------------------------------------------------------- */
function direction(p1, p2) {
	return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;
}

/* STATISTICS FUNCTIONS ----------------------------------------------------- */
function mean(array) {
	let n = array.length;
	let sum = 0;
	for (let i = 0; i < n; i++) {
		sum += array[i];
	}
	return sum/n;
}
function stdev(array) {
	let n = array.length;
	let m = mean(array);
	let sum = 0;
	for (let i = 0; i < n; i++) {
		sum += Math.pow(array[i] - m, 2);
	}
	return Math.sqrt(sum/(n-1));
}
function p_mean(array) {
	let n = array.length;
	let tau = rememberingFactor;
	let sum = 0;
	let den = 0;
	for (let i = 0; i < n; i++) {
		let w = math.exp(-math.square(i-n)/math.square(tau));
		sum += w*array[i];
		den += w;
	}
	return sum/den;
}
function p_stdev(array) {
	let n = array.length;
	let tau = rememberingFactor;
	let m = p_mean(array);
	let sum = 0;
	let den = 0;
	for (let i = 0; i < n; i++) {
		let w = math.exp(-math.square(i-n)/math.square(tau));
		sum += w*Math.pow(array[i] - m, 2);
		den += w;
	}
	return Math.sqrt(sum/den);
}
function solveNormalDistribution(normalDistribution, threshold) {
	let x0 = normalDistribution.mean - normalDistribution.standardDeviation*3;
	let x1 = normalDistribution.mean + normalDistribution.standardDeviation*3;
	let xstep = normalDistribution.standardDeviation*6 / 200;
	let solution = void 0;
	for (let x = x0; x < x1; x += xstep) {
		if (normalDistribution.cdf(x) >= threshold) {
			solution = x;
			break;
		}
	}
	return solution;
}

/* TIMESTAMP FUNCTION ------------------------------------------------------- */
if (window.performance.now) {
    console.log("Using high performance timer");
    getTimestamp = function() { return window.performance.now(); };
} else {
    if (window.performance.webkitNow) {
        console.log("Using webkit high performance timer");
        getTimestamp = function() { return window.performance.webkitNow(); };
    } else {
        console.log("Using low performance timer");
        getTimestamp = function() { return getTimestamp(); };
    }
}
function getDatestamp() {
	let date = new Date();
	return date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + ", " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
}

/* TRANSITION FUNCTION ------------------------------------------------------ */
function transition(todoFunction, transitionIndex) {
	isTransitioning = true;
	let anim = transitionAnimations[transitionIndex].anim;
	let frame = transitionAnimations[transitionIndex].switchFrame;
	anim.wrapper.style.display = 'block';
	anim.goToAndPlay(0, true);
	anim.addEventListener('enterFrame', function changeScreen(e) {
		if(e.currentTime > frame) {
			anim.removeEventListener('enterFrame', changeScreen);
			todoFunction();
		}
	})
}

/* MISCELLANEOUS FUNCTIONS -------------------------------------------------- */
function clamp(x, a, b) {
	if (x < a) return a;
	if (x > b) return b;
	return x;
}
function map(x, min1, max1, min2, max2, doClamp) {
	let mappedX = min2 + ((x-min1)/(max1-min1)) * (max2-min2)
	if (doClamp) {
		return clamp(mappedX, min2, max2);
	}
	else {
		return mappedX;
	}
}
function formatTo2Digits(x) {
	return (x < 10) ? "0" + x.toString() : x.toString();
}

/* STORAGE FUNCTIONS -------------------------------------------------------- */
function hashCode(str) {
  var hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash & 0xfffffff;
}
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
function setCookie(cname, data) {
	let date = new Date(); date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
	document.cookie = cname + '=' + data + '; expires=' + date.toGMTString() + '; path=/';
}
function getLocalData(cname) {
	return window.localStorage.getItem(cname);
}
function setLocalData(cname, data) {
	window.localStorage.setItem(cname, data);
}
function saveLocalData(cname, data) {
    if (typeof(Storage) !== "undefined") { setLocalData(cname, data); } 
	else { setCookie(cname, data); }
}
function loadLocalData(cname) {
	if (typeof(Storage) !== "undefined") { return getLocalData(cname); } 
	else { return getCookie(cname); }
}

/* FULLSCREEN FUNCTIONS ----------------------------------------------------- */
let elem = document.documentElement;
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}
function isFullScreen() {
	return (window.fullScreen) || (window.innerWidth == screen.width && window.innerHeight == screen.height);
}

/* DETECT BROWSER ----------------------------------------------------------- */
function getBrowser() {
	
	var nVer = navigator.appVersion;
	var nAgt = navigator.userAgent;
	var browserName  = navigator.appName;
	var fullVersion  = ''+parseFloat(navigator.appVersion); 
	var majorVersion = parseInt(navigator.appVersion,10);
	var nameOffset,verOffset,ix;

	// In Edge
	if ((verOffset=nAgt.indexOf("Edge"))!=-1) {
		browserName = "Edge";
		fullVersion = nAgt.substring(verOffset+5);
		if ((verOffset=nAgt.indexOf("Version"))!=-1) 
			fullVersion = nAgt.substring(verOffset+8);
	}
	// In Chromium Edge
	if ((verOffset=nAgt.indexOf("Edg"))!=-1) {
		browserName = "Chromium Edge";
		fullVersion = nAgt.substring(verOffset+4);
		if ((verOffset=nAgt.indexOf("Version"))!=-1) 
			fullVersion = nAgt.substring(verOffset+8);
	}
	// In Opera GX
	else if ((verOffset=nAgt.indexOf("OPR"))!=-1) {
		browserName = "Opera GX";
		fullVersion = nAgt.substring(verOffset+4);
		if ((verOffset=nAgt.indexOf("Version"))!=-1) 
			fullVersion = nAgt.substring(verOffset+8);
	}
	// In Opera
	else if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
		browserName = "Opera";
		fullVersion = nAgt.substring(verOffset+6);
		if ((verOffset=nAgt.indexOf("Version"))!=-1) 
			fullVersion = nAgt.substring(verOffset+8);
	}
	// In MSIE
	else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
		browserName = "Microsoft Internet Explorer";
		fullVersion = nAgt.substring(verOffset+5);
	}
	// In Chrome
	else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
		browserName = "Chrome";
		fullVersion = nAgt.substring(verOffset+7);
	}
	// In Safari
	else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
		browserName = "Safari";
		fullVersion = nAgt.substring(verOffset+7);
		if ((verOffset=nAgt.indexOf("Version"))!=-1) 
			fullVersion = nAgt.substring(verOffset+8);
	}
	// In Firefox
	else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
		browserName = "Firefox";
		fullVersion = nAgt.substring(verOffset+8);
	}
	// In most other browsers
	else if ((nameOffset=nAgt.lastIndexOf(' ')+1) < (verOffset=nAgt.lastIndexOf('/'))) 
	{
		browserName = nAgt.substring(nameOffset,verOffset);
		fullVersion = nAgt.substring(verOffset+1);
		if (browserName.toLowerCase()==browserName.toUpperCase()) {
			browserName = navigator.appName;
		}
	}
	// Trim the fullVersion string at semicolon/space if present
	if ((ix=fullVersion.indexOf(";"))!=-1)
		fullVersion=fullVersion.substring(0,ix);
	if ((ix=fullVersion.indexOf(" "))!=-1)
		fullVersion=fullVersion.substring(0,ix);
	// Extract major version
	majorVersion = parseInt(''+fullVersion,10);
	if (isNaN(majorVersion)) {
		fullVersion  = ''+parseFloat(navigator.appVersion); 
		majorVersion = parseInt(navigator.appVersion, 10);
	}

	return {'name': browserName, 'majorVersion': majorVersion, 'fullVersion': fullVersion};
	
}


/* GET ELEMENT ROTATION ----------------------------------------------------- */
function getElementRotation(elid) {
	
	var el = document.getElementById(elid); if (!el) return 0;
	var st = window.getComputedStyle(el, null);
	var tr = st.getPropertyValue("-webkit-transform") ||
	   		 st.getPropertyValue("-moz-transform") ||
	   		 st.getPropertyValue("-ms-transform") ||
	   		 st.getPropertyValue("-o-transform") ||
	   		 st.getPropertyValue("transform") ||
	   		 "fail...";

	if( tr !== "none") {
		var values = tr.split('(')[1];
		  	values = values.split(')')[0];
		  	values = values.split(',');
		var a = values[0];
		var b = values[1];
		var c = values[2];
		var d = values[3];
		var scale = Math.sqrt(a*a + b*b);
		var radians = Math.atan2(b, a);
		var angle = Math.round( radians * (180/Math.PI));
	} 
	else {
		var angle = 0;
	}

	return angle;
	
}