localStorage.removeItem("highScore")

const editor = CodeMirror(document.getElementById("editor"), {
  value: `<div></div>
<style>
    div {
        width: 100px;
        height: 100px;
        background: #dd6b4d;
    }
</style>`,
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

function loadTargetShape() {
const targetHTML = `<div class="shape"></div>
  <style>
    .shape {
      background-color: red;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  </style>`;
applyHTML(targetIframe, targetHTML);
}

editor.on("change", () => {
applyHTML(userIframe, editor.getValue());
});

applyHTML(userIframe, editor.getValue());
loadTargetShape();

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
  let highScoreRaw = localStorage.getItem("highScore");
  let high = highScoreRaw !== null ? parseFloat(highScoreRaw) : 0;

  const lastScore = document.getElementById("lastScoreDisplay")
  const highScore = document.getElementById("highScoreDisplay")

  lastScore.textContent = `Score: ${score}% match`;

  if (score > high){
    localStorage.setItem("highScore", score)
    highScore.textContent = `High Score: ${score}% match`;
  }
  else{
    highScore.textContent = `High Score: ${high.toFixed(2)}% match`;
  }
  
}
