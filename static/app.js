let canvas, ctx;
let mouseDown = false;
let lastX = 0, lastY = 0;

function init() {
    canvas = document.getElementById('sketchpad');
    ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', startDrawTouch, { passive: false });
    canvas.addEventListener('touchmove', drawTouch, { passive: false });
    window.addEventListener('touchend', stopDraw);
}

window.onload = init;

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function startDraw(e) {
    mouseDown = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;

    ctx.beginPath();
    ctx.arc(lastX, lastY, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
}

function draw(e) {
    if (!mouseDown) return;

    const pos = getMousePos(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
}

function stopDraw() {
    mouseDown = false;
}

function startDrawTouch(e) {
    e.preventDefault();
    startDraw(e.touches[0]);
}

function drawTouch(e) {
    e.preventDefault();
    draw(e.touches[0]);
}

function reset() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.getElementById('prediction').textContent = '—';
}

async function predictData() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, 28, 28);
    tempCtx.drawImage(canvas, 0, 0, 28, 28);

    const data = tempCtx.getImageData(0, 0, 28, 28);
    let img = [];

    for (let i = 0; i < 28 * 28; i++) {
        const r = data.data[4 * i];
        const g = data.data[4 * i + 1];
        const b = data.data[4 * i + 2];
        const gray = Math.round((r + g + b) / 3);
        img.push(255 - gray);
    }

    try {
        document.getElementById('prediction').textContent = '...';

        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(img)
        });

        if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
        }

        const res = await response.json();
        document.getElementById('prediction').textContent = res.prediction;
    } catch (error) {
        console.error(error);
        document.getElementById('prediction').textContent = 'Error';
    }
}
