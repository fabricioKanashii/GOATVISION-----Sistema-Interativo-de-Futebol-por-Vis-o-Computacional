/* =========================================================
   CHUTE VIRTUAL
   Visão Computacional + TensorFlow.js + MoveNet
========================================================= */


/* =========================================================
   ESTADO GLOBAL
========================================================= */

let detector = null;

let video = null;

let canvas = null;

let overlay = null;

let ctx = null;

let octx = null;

let score = 0;

let attempts = 0;

let lastPoses = [];


/* =========================================================
   ESTADO DO CHUTE
========================================================= */

let lastKneeY = null;

let kneeCharging = false;

let chargeStart = 0;

let kickCooldown = false;

let ball = null;

let activeGoalZone = 0;

let goalZones = [];

let playerKneeX = 0.5;


/* =========================================================
   CONFIGURAÇÕES DE DETECÇÃO
========================================================= */

const KICK_RISE_THRESH = 0.08;

const KICK_DROP_THRESH = 0.06;

const CHARGE_MIN_MS = 200;


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document
    .getElementById('btn-start')
    .addEventListener('click', startGame);


/* =========================================================
   INICIAR JOGO
========================================================= */

async function startGame() {

    document
        .getElementById('screen-start')
        .style.display = 'none';

    document
        .getElementById('screen-game')
        .style.display = 'block';

    await initCamera();
}


/* =========================================================
   INICIALIZAR CÂMERA
========================================================= */

async function initCamera() {

    video = document.getElementById('video');

    canvas = document.getElementById('canvas');

    overlay = document.getElementById('overlay-canvas');

    ctx = canvas.getContext('2d');

    octx = overlay.getContext('2d');


    setMsg(
        'Aguardando permissão da câmera...'
    );


    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: 'user',

                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    }
                },

                audio: false
            });


        video.srcObject = stream;


        video.onloadedmetadata =
            async () => {

                video.play();

                resizeCanvases();


                setMsg(
                    'Carregando modelo de IA (MoveNet)...'
                );


                document
                    .getElementById('loading-msg')
                    .textContent =
                    'Carregando modelo de IA...';


                await loadDetector();


                document
                    .getElementById('loading-overlay')
                    .style.display = 'none';


                buildGoalZones();


                setActiveZone(
                    Math.floor(
                        Math.random() * 4
                    )
                );


                setMsg(
                    'Pronto! Levante o joelho direito para carregar o chute da Copa ⚽'
                );


                loop();
            };

    } catch (e) {

        document
            .getElementById('loading-msg')
            .textContent =
            '⚠️ Permita o acesso à câmera e recarregue a página.';


        console.error(e);
    }
}


/* =========================================================
   AJUSTAR CANVAS
========================================================= */

function resizeCanvases() {

    if (!video || !canvas || !overlay) {
        return;
    }


    const w =
        video.videoWidth || 640;

    const h =
        video.videoHeight || 480;


    canvas.width = overlay.width = w;

    canvas.height = overlay.height = h;
}


/* =========================================================
   CARREGAR MODELO MOVENET
========================================================= */

async function loadDetector() {

    try {

        detector =
            await poseDetection.createDetector(

                poseDetection.SupportedModels.MoveNet,

                {
                    modelType:
                        poseDetection
                            .movenet
                            .modelType
                            .SINGLEPOSE_LIGHTNING
                }

            );

    } catch (e) {

        console.error(
            'Erro ao carregar detector:',
            e
        );

        detector = null;
    }
}


/* =========================================================
   ZONAS DO GOL
========================================================= */

function buildGoalZones() {

    const W = canvas.width;

    const H = canvas.height;


    const gw = W * 0.96;

    const gh = H * 0.72;


    const gx =
        (W - gw) / 2;

    const gy =
        H * 0.12;


    const sw =
        gw / 2;

    const sh =
        gh / 2;


    goalZones = [

        {
            label: 'canto esq alto',
            x: gx,
            y: gy,
            w: sw,
            h: sh
        },

        {
            label: 'canto dir alto',
            x: gx + sw,
            y: gy,
            w: sw,
            h: sh
        },

        {
            label: 'canto esq baixo',
            x: gx,
            y: gy + sh,
            w: sw,
            h: sh
        },

        {
            label: 'canto dir baixo',
            x: gx + sw,
            y: gy + sh,
            w: sw,
            h: sh
        }

    ];
}


/* =========================================================
   DEFINIR ZONA ATIVA
========================================================= */

function setActiveZone(idx) {

    activeGoalZone = idx;
}


/* =========================================================
   LOOP PRINCIPAL
========================================================= */

async function loop() {

    resizeCanvases();


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    octx.clearRect(
        0,
        0,
        overlay.width,
        overlay.height
    );


    /* ---------------------------------------------
       ESTIMAR POSE
    --------------------------------------------- */

    if (
        detector &&
        video.readyState >= 2
    ) {

        try {

            lastPoses =
                await detector.estimatePoses(
                    video
                );

        } catch (e) {

            console.error(
                'Erro na detecção:',
                e
            );
        }
    }


    /* ---------------------------------------------
       DESENHAR GOL
    --------------------------------------------- */

    drawGoal();


    /* ---------------------------------------------
       DESENHAR BOLA
    --------------------------------------------- */

    if (ball) {

        drawBall();
    }


    /* ---------------------------------------------
       PROCESSAR JOGADOR
    --------------------------------------------- */

    if (
        lastPoses &&
        lastPoses.length > 0
    ) {

        drawSkeleton(
            lastPoses[0]
        );

        processKick(
            lastPoses[0]
        );
    }


    requestAnimationFrame(loop);
}


/* =========================================================
   DESENHAR GOL
========================================================= */

function drawGoal() {

    const W = canvas.width;

    const H = canvas.height;


    const gw = W * 0.96;

    const gh = H * 0.72;


    const gx =
        (W - gw) / 2;

    const gy =
        H * 0.12;


    const postThickness = 14;


    const innerX =
        gx + postThickness / 2;

    const innerY =
        gy + postThickness / 2;


    const innerW =
        gw - postThickness;

    const innerH =
        gh - postThickness;


    octx.save();

    octx.lineCap = 'round';


    /* ---------------------------------------------
       ESTRUTURA DO GOL
    --------------------------------------------- */

    const postGradient =
        octx.createLinearGradient(
            gx,
            gy,
            gx + gw,
            gy + gh
        );


    postGradient.addColorStop(
        0,
        '#ffffff'
    );


    postGradient.addColorStop(
        0.5,
        '#f1f3f6'
    );


    postGradient.addColorStop(
        1,
        '#d7d9dc'
    );


    octx.strokeStyle =
        postGradient;

    octx.lineWidth =
        postThickness;

    octx.shadowColor =
        'rgba(255,255,255,0.5)';

    octx.shadowBlur = 10;


    octx.beginPath();

    octx.moveTo(
        gx,
        gy + gh
    );

    octx.lineTo(
        gx,
        gy
    );

    octx.lineTo(
        gx + gw,
        gy
    );

    octx.lineTo(
        gx + gw,
        gy + gh
    );

    octx.stroke();


    /* ---------------------------------------------
       LINHA DO GOL
    --------------------------------------------- */

    octx.shadowBlur = 0;

    octx.strokeStyle =
        'rgba(255,255,255,0.25)';

    octx.lineWidth = 3;


    octx.beginPath();

    octx.moveTo(
        gx,
        gy + gh
    );

    octx.lineTo(
        gx + gw,
        gy + gh
    );

    octx.stroke();


    /* ---------------------------------------------
       REDE INTERNA
    --------------------------------------------- */

    octx.fillStyle =
        'rgba(0, 229, 255, 0.08)';


    octx.fillRect(
        innerX,
        innerY,
        innerW,
        innerH
    );


    octx.strokeStyle =
        'rgba(255,255,255,0.16)';

    octx.lineWidth = 1;


    /* Linhas verticais */

    for (
        let x = innerX + 10;
        x < innerX + innerW;
        x += 18
    ) {

        octx.beginPath();

        octx.moveTo(
            x,
            innerY
        );

        octx.lineTo(
            x,
            innerY + innerH
        );

        octx.stroke();
    }


    /* Linhas horizontais */

    for (
        let y = innerY + 10;
        y < innerY + innerH;
        y += 16
    ) {

        octx.beginPath();

        octx.moveTo(
            innerX,
            y
        );

        octx.lineTo(
            innerX + innerW,
            y
        );

        octx.stroke();
    }


    /* ---------------------------------------------
       DIAGONAIS
    --------------------------------------------- */

    octx.strokeStyle =
        'rgba(255,255,255,0.1)';


    for (
        let offset = -innerH;
        offset < innerW;
        offset += 20
    ) {

        octx.beginPath();

        octx.moveTo(

            innerX +
            Math.max(0, offset),

            innerY +
            Math.max(0, -offset)

        );


        octx.lineTo(

            innerX +
            Math.min(
                innerW,
                innerW + offset
            ),

            innerY +
            Math.min(
                innerH,
                innerH + offset
            )

        );

        octx.stroke();
    }


    for (
        let offset = 0;
        offset < innerW + innerH;
        offset += 20
    ) {

        octx.beginPath();

        octx.moveTo(

            innerX +
            Math.max(
                0,
                offset - innerH
            ),

            innerY +
            Math.min(
                innerH,
                offset
            )

        );


        octx.lineTo(

            innerX +
            Math.min(
                innerW,
                offset
            ),

            innerY +
            Math.max(
                0,
                offset - innerW
            )

        );

        octx.stroke();
    }


    /* ---------------------------------------------
       ZONA ALVO
    --------------------------------------------- */

    const z =
        goalZones[activeGoalZone];


    if (z && !ball) {

        octx.fillStyle =
            'rgba(255, 215, 0, 0.12)';


        octx.fillRect(
            z.x,
            z.y,
            z.w,
            z.h
        );


        octx.strokeStyle =
            '#ffd700';

        octx.lineWidth = 2.5;

        octx.shadowColor =
            '#ffd700';

        octx.shadowBlur = 18;


        octx.strokeRect(
            z.x,
            z.y,
            z.w,
            z.h
        );


        octx.shadowBlur = 0;


        octx.fillStyle =
            '#ffd700';

        octx.font =
            `bold ${Math.round(W * 0.018)}px Segoe UI`;

        octx.textAlign =
            'center';


        octx.fillText(
            'ALVO DA COPA',

            z.x + z.w / 2,

            z.y + z.h / 2 + 6
        );
    }


    octx.restore();
}


/* =========================================================
   PROCESSAR CHUTE
========================================================= */

function processKick(pose) {

    if (kickCooldown) {
        return;
    }


    const kp = {};


    pose.keypoints.forEach(
        k => {
            kp[k.name] = k;
        }
    );


    const rightKnee =
        kp['right_knee'];

    const rightHip =
        kp['right_hip'];


    if (
        !rightKnee ||
        !rightHip
    ) {
        return;
    }


    if (
        rightKnee.score < 0.25 ||
        rightHip.score < 0.2
    ) {
        return;
    }


    const H =
        canvas.height;


    const kneeNorm =
        rightKnee.y / H;


    /* Posição horizontal */

    playerKneeX =
        rightKnee.x /
        canvas.width;


    if (lastKneeY === null) {

        lastKneeY =
            kneeNorm;

        return;
    }


    const delta =
        lastKneeY -
        kneeNorm;


    /* ---------------------------------------------
       FASE 1
       JOELHO SUBIU
    --------------------------------------------- */

    if (
        !kneeCharging &&
        delta > KICK_RISE_THRESH
    ) {

        kneeCharging = true;

        chargeStart =
            Date.now();


        setMsg(
            '🔋 Carregando... agora abaixe rápido para CHUTAR!'
        );
    }


    /* ---------------------------------------------
       FASE 2
       JOELHO DESCENDO
    --------------------------------------------- */

    if (kneeCharging) {

        const chargeTime =
            Date.now() -
            chargeStart;


        const pct =
            Math.min(
                100,
                (chargeTime / 1200) * 100
            );


        document
            .getElementById(
                'power-bar-fill'
            )
            .style.width =
            pct + '%';


        const dropDelta =
            kneeNorm -
            lastKneeY;


        if (
            dropDelta >
            KICK_DROP_THRESH &&
            chargeTime >
            CHARGE_MIN_MS
        ) {

            kneeCharging = false;


            document
                .getElementById(
                    'power-bar-fill'
                )
                .style.width =
                '0%';


            const power =
                Math.min(
                    1,
                    chargeTime / 1000
                );


            triggerKick(
                power,
                playerKneeX
            );
        }
    }


    /* ---------------------------------------------
       SUAVIZAÇÃO
    --------------------------------------------- */

    lastKneeY =
        kneeNorm * 0.4 +
        lastKneeY * 0.6;
}


/* =========================================================
   DISPARAR CHUTE
========================================================= */

function triggerKick(
    power,
    kneeXNorm
) {

    if (kickCooldown) {
        return;
    }


    kickCooldown = true;


    attempts++;


    document
        .getElementById('attempts')
        .textContent =
        attempts;


    const W =
        canvas.width;

    const H =
        canvas.height;


    const startX =
        W / 2;

    const startY =
        H * 0.8;


    const z =
        goalZones[activeGoalZone];


    const targetX =
        z.x + z.w / 2;

    const targetY =
        z.y + z.h / 2;


    /* ---------------------------------------------
       PRECISÃO
    --------------------------------------------- */

    const accuracy =
        0.55 + power * 0.3;


    const randX =
        (Math.random() - 0.5) *
        (1 - accuracy) *
        W *
        0.6;


    const randY =
        (Math.random() - 0.5) *
        (1 - accuracy) *
        H *
        0.3;


    const finalX =
        targetX + randX;


    const finalY =
        targetY + randY;


    /* ---------------------------------------------
       VERIFICAR GOL
    --------------------------------------------- */

    const isGoal =
        finalX >= z.x &&
        finalX <= z.x + z.w &&
        finalY >= z.y &&
        finalY <= z.y + z.h;


    /* ---------------------------------------------
       CRIAR BOLA
    --------------------------------------------- */

    ball = {

        x: startX,

        y: startY,

        isGoal,

        power,

        progress: 0
    };


    const duration =
        600 + (1 - power) * 400;


    const start =
        performance.now();


    /* ---------------------------------------------
       ANIMAÇÃO DA BOLA
    --------------------------------------------- */

    function animBall(now) {

        const t =
            Math.min(
                1,
                (now - start) /
                duration
            );


        const ease =
            t < 0.5
                ? 2 * t * t
                : -1 + (4 - 2 * t) * t;


        ball.x =
            startX +
            (finalX - startX) *
            ease;


        ball.y =
            startY +
            (finalY - startY) *
            ease -
            Math.sin(Math.PI * t) *
            H *
            0.15;


        ball.progress =
            ease;


        if (t < 1) {

            requestAnimationFrame(
                animBall
            );

        } else {

            setTimeout(() => {

                if (isGoal) {

                    score++;


                    document
                        .getElementById(
                            'score'
                        )
                        .textContent =
                        score;


                    showGoalEffect();

                } else {

                    setMsg(
                        '❌ Errou! Tente de novo'
                    );
                }


                setTimeout(() => {

                    ball = null;

                    kickCooldown = false;


                    setActiveZone(
                        Math.floor(
                            Math.random() * 4
                        )
                    );


                    if (!isGoal) {

                        setMsg(
                            'Mire melhor! Levante o joelho para carregar ⚽'
                        );
                    }

                }, isGoal ? 2000 : 800);

            }, 100);
        }
    }


    requestAnimationFrame(
        animBall
    );
}


/* =========================================================
   DESENHAR BOLA
========================================================= */

function drawBall() {

    if (!ball) {
        return;
    }


    const size =
        18 +
        (1 - ball.progress) *
        14;


    octx.save();


    octx.beginPath();


    octx.arc(
        ball.x,
        ball.y,
        size,
        0,
        Math.PI * 2
    );


    octx.fillStyle =
        '#fff';


    octx.shadowColor =
        '#ffd700';

    octx.shadowBlur = 20;


    octx.fill();


    octx.strokeStyle =
        '#222';

    octx.lineWidth = 1.5;

    octx.shadowBlur = 0;


    octx.stroke();


    /* ---------------------------------------------
       PENTÁGONO
    --------------------------------------------- */

    const r = size;


    const penta = [

        [0, -r * 0.5],

        [-r * 0.45, r * 0.1],

        [-r * 0.27, r * 0.42],

        [r * 0.27, r * 0.42],

        [r * 0.45, r * 0.1]

    ];


    octx.beginPath();


    penta.forEach(
        ([px, py], i) => {

            const rx =
                ball.x + px;

            const ry =
                ball.y + py;


            if (i === 0) {

                octx.moveTo(
                    rx,
                    ry
                );

            } else {

                octx.lineTo(
                    rx,
                    ry
                );
            }
        }
    );


    octx.closePath();


    octx.fillStyle =
        '#222';

    octx.fill();


    octx.restore();
}


/* =========================================================
   DESENHAR ESQUELETO
========================================================= */

function drawSkeleton(pose) {

    const kp = {};


    pose.keypoints.forEach(
        k => {
            kp[k.name] = k;
        }
    );


    const connections = [

        [
            'left_shoulder',
            'right_shoulder'
        ],

        [
            'left_shoulder',
            'left_elbow'
        ],

        [
            'left_elbow',
            'left_wrist'
        ],

        [
            'right_shoulder',
            'right_elbow'
        ],

        [
            'right_elbow',
            'right_wrist'
        ],

        [
            'left_shoulder',
            'left_hip'
        ],

        [
            'right_shoulder',
            'right_hip'
        ],

        [
            'left_hip',
            'right_hip'
        ],

        [
            'left_hip',
            'left_knee'
        ],

        [
            'left_knee',
            'left_ankle'
        ],

        [
            'right_hip',
            'right_knee'
        ],

        [
            'right_knee',
            'right_ankle'
        ]

    ];


    octx.save();


    octx.strokeStyle =
        'rgba(0,229,255,0.8)';

    octx.lineWidth = 3;

    octx.shadowColor =
        '#00e5ff';

    octx.shadowBlur = 8;


    /* ---------------------------------------------
       CONEXÕES
    --------------------------------------------- */

    connections.forEach(
        ([a, b]) => {

            const ka = kp[a];

            const kb = kp[b];


            if (
                !ka ||
                !kb ||
                ka.score < 0.2 ||
                kb.score < 0.2
            ) {
                return;
            }


            octx.beginPath();


            octx.moveTo(
                ka.x,
                ka.y
            );


            octx.lineTo(
                kb.x,
                kb.y
            );


            octx.stroke();
        }
    );


    /* ---------------------------------------------
       JOINTS
    --------------------------------------------- */

    const kickJoints = [

        'right_knee',

        'right_ankle',

        'right_hip'

    ];


    pose.keypoints.forEach(
        k => {

            if (k.score < 0.2) {
                return;
            }


            const isKick =
                kickJoints.includes(
                    k.name
                );


            octx.beginPath();


            octx.arc(

                k.x,

                k.y,

                isKick ? 8 : 5,

                0,

                Math.PI * 2

            );


            octx.fillStyle =
                isKick
                    ? '#ffd700'
                    : '#1de9b6';


            octx.shadowColor =
                isKick
                    ? '#ffd700'
                    : '#1de9b6';


            octx.shadowBlur =
                isKick
                    ? 15
                    : 6;


            octx.fill();
        }
    );


    octx.restore();
}


/* =========================================================
   EFEITO DE GOL
========================================================= */

function showGoalEffect() {

    const flash =
        document.getElementById(
            'goal-flash'
        );


    const txt =
        document.getElementById(
            'goal-text'
        );


    flash.classList.add(
        'show'
    );


    txt.classList.add(
        'show'
    );


    setTimeout(() => {

        flash.classList.remove(
            'show'
        );


        txt.classList.remove(
            'show'
        );

    }, 1800);


    setMsg(
        '🎉 GOOOOOL DO BRASIL! Incrível!'
    );
}


/* =========================================================
   MENSAGEM DE STATUS
========================================================= */

function setMsg(m) {

    document
        .getElementById(
            'status-msg'
        )
        .textContent = m;
}


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    'resize',
    resizeCanvases
);
