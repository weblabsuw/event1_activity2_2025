window.addEventListener("load", () => {
	localStorage.clear();
	sessionStorage.clear();
	highScores = {};
	currentLevel = 1;
	highestUnlocked = 1;
	loadLevel(1);
	updateLevelsUnlocked();
	updateLevelDisplay();
});

document.getElementById("restart").addEventListener("click", () => {
	const confirmReset = confirm("Are you sure you want to reset your high scores?");

	if (!confirmReset) return;

	for (let key in localStorage) {
		if (key.startsWith("highScore_level_")) {
			localStorage.removeItem(key);
		}
	}
	for (let level in highScores) {
		highScores[level] = 0;
	}
	document.getElementById("lastScoreDisplay").textContent = "Score: -";
	document.getElementById("highScoreDisplay").textContent = "High Score: 0.00% match";
})

document.getElementById("resetBtn").addEventListener("click", () => {
	const confirmReset = confirm("This will reset the editor to the default code!");

	if (!confirmReset) return
	const data = levels[currentLevel];

	editor.setValue(data.startCode);
	applyHTML(userIframe, data.startCode);
})

const editor = CodeMirror(document.getElementById("editor"), {
	mode: "htmlmixed",
	lineNumbers: true,
	lineWrapping: true,
	tabSize: 4,
	indentUnit: 4,
	indentWithTabs: true,
	smartIndent: true,
	autoCloseBrackets: true,
	autoCloseTags: true,
});

editor.setOption("extraKeys", {
	"Enter": function(cm) {
		cm.execCommand("newlineAndIndent");
	}
});

const userIframe = document.getElementById("userOutput");
const targetIframe = document.getElementById("targetOutput");

function applyHTML(iframe, html) {
const doc = iframe.contentDocument;
doc.open();
doc.write(html);
doc.close();
}

editor.on("change", () => {
	const userCode = editor.getValue();
	localStorage.setItem(`userCode_level_${currentLevel}`, userCode);
	applyHTML(userIframe, editor.getValue());
});

applyHTML(userIframe, editor.getValue());

function drawIframeToCanvas(iframe, canvas) {
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
		<foreignObject width="100%" height="100%">
			${new XMLSerializer().serializeToString(iframe.contentDocument.documentElement)}
		</foreignObject>
		</svg>
	`;
	const img = new Image();
	const ctx = canvas.getContext("2d");
	return new Promise((resolve) => {
		img.onload = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
		resolve();
		};
		img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	});
}

async function comparePixels() {
	const canvasUser = document.getElementById("canvasUser");
	const canvasTarget = document.getElementById("canvasTarget");

	await drawIframeToCanvas(userIframe, canvasUser);
	await drawIframeToCanvas(targetIframe, canvasTarget);

	const ctxUser = canvasUser.getContext("2d");
	const ctxTarget = canvasTarget.getContext("2d");

	const userData = ctxUser.getImageData(0, 0, 200, 200).data;
	const targetData = ctxTarget.getImageData(0, 0, 200, 200).data;

	let matching = 0;
	let total = userData.length / 4;

	for (let i = 0; i < userData.length; i += 4) {
		const userPixel = userData.slice(i, i + 4);
		const targetPixel = targetData.slice(i, i + 4);
			if (
				Math.abs(userPixel[0] - targetPixel[0]) < 10 &&
				Math.abs(userPixel[1] - targetPixel[1]) < 10 &&
				Math.abs(userPixel[2] - targetPixel[2]) < 10 &&
				Math.abs(userPixel[3] - targetPixel[3]) < 10
			) {
		matching++;
		}
	}

	const score = ((matching / total) * 100).toFixed(2);

	const lastScore = document.getElementById("lastScoreDisplay")
	const highScore = document.getElementById("highScoreDisplay")

	lastScore.textContent = `Score: ${score}% match`;

	const key = `highScore_level_${currentLevel}`;
	const prevHigh = parseFloat(localStorage.getItem(key)) || 0;

	if (score > prevHigh){
		localStorage.setItem(key, score);
		highScores[currentLevel] = parseFloat(score)
		highScore.textContent = `High Score: ${score}% match`;
	}
	else{
		highScore.textContent = `High Score: ${prevHigh.toFixed(2)}% match`;
	}
	unlockNextLevel(parseFloat(score));
}

let currentLevel = 1;
let highestUnlocked = 1;
const totalLevels = 5;

function updateLevelDisplay() {
	
	document.getElementById("levelLabel").innerText = `Level ${currentLevel}`;

	const prevArrow = document.getElementById("prevArrow");
	const nextArrow = document.getElementById("nextArrow");

	if (currentLevel > 1) {
		prevArrow.classList.add("unlocked");
		prevArrow.classList.remove("locked");
		prevArrow.disabled = false;
	} else {
		prevArrow.classList.remove("unlocked");
		prevArrow.classList.add("locked");
		prevArrow.disabled = true;
	}

	if (currentLevel < highestUnlocked) {
		nextArrow.classList.add("unlocked");
		nextArrow.classList.remove("locked");
		nextArrow.disabled = false;
	} else {
		nextArrow.classList.remove("unlocked");
		nextArrow.classList.add("locked");
		nextArrow.disabled = true;
	}
}
function nextLevel() {
	if (currentLevel < highestUnlocked && currentLevel < totalLevels) {
		currentLevel++;
		updateLevelDisplay();
		loadLevel(currentLevel);
	}
}
function prevLevel() {
	if (currentLevel > 1) {
		currentLevel--;
		updateLevelDisplay();
		loadLevel(currentLevel);
	}
}
function unlockNextLevel(scorePercent) {
	if (scorePercent >= 80 && highestUnlocked < totalLevels) {
		highestUnlocked = Math.max(highestUnlocked, currentLevel + 1);
		localStorage.setItem("highestUnlocked", highestUnlocked);
	}

	updateLevelsUnlocked();
	updateLevelDisplay();
}

const levels = {
	1: {
		startCode: `<!-- the width and height are 200px and the color is blue. -->
<div class="square"></div>

<style>
	div {
	}
</style>`,
		targetHTML: `<div></div>
		<style>
			div {
				width: 200px;
				height: 200px;
				background-color: blue;
			}
		</style>`
	},
	2: {
		startCode: ``,
		targetHTML: ``
	},
	3: {
		startCode: ``,
		targetHTML: ``
	},
	4: {
		startCode: ``,
		targetHTML: ``
	},
	5: {
		startCode: ``,
		targetHTML: ``
	}
};

function loadLevel(level) {
	const data = levels[level];
	if (!data) return;

	const savedCode = localStorage.getItem(`userCode_level_${level}`);
	const codeToLoad = savedCode || data.startCode;

	editor.setValue(codeToLoad);
	applyHTML(userIframe, codeToLoad);
	loadTargetHTML(data.targetHTML);

	currentLevel = level;

	document.getElementById("lastScoreDisplay").textContent = "Score: -";

	const key = `highScore_level_${level}`;
	const high = parseFloat(localStorage.getItem(key)) || 0;
	document.getElementById("highScoreDisplay").textContent = `High Score: ${high.toFixed(2)}% match`

	updateLevelDisplay();
}

function loadTargetHTML(html) {
	applyHTML(targetIframe, html)
}

function restoreProgress() {
	const savedLevel = parseInt(localStorage.getItem("currentLevel")) || 1;
	const savedUnlocked = parseInt(localStorage.getItem("highestUnlocked")) || 1;
	
	currentLevel = savedLevel;
	highestUnlocked = savedUnlocked;
	loadLevel(currentLevel);

	updateLevelsUnlocked();
	updateLevelDisplay();
}

function updateLevelsUnlocked() {
	const levelsComplete = document.getElementById("levels-complete");
	levelsComplete.textContent = `Levels Unlocked: ${highestUnlocked}/${totalLevels}`;
}

restoreProgress();
updateLevelDisplay();