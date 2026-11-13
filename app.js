/* =========================================================
   ¿Quieres ser mi Caballero de Honor? — lógica
   ========================================================= */

// ---------- CONFIGURACIÓN (EDITAR para cada cliente) ----------
const CONFIG = {
    firma: 'Luis Almanzar',        // nombre de quien invita
    rol: 'Caballero de Honor',     // título de la pregunta. Ej: 'Caballero de Honor', 'Padrino'
    fecha: '04 de junio 2027',     // se muestra al aceptar, con el sello de CONFIDENCIAL
    whatsapp: '',                  // EDITAR: número que recibe la respuesta, solo dígitos. Ej: '18095551234'. Vacío = sin botón
    musica: '',                    // EDITAR: ruta de un mp3 (ej. 'musica.mp3'). Vacío = sin música
    velocidad: 42                  // ms entre letra y letra al escribir
};
// Nombre personalizado por enlace:  .../index.html?n=Carlos
const params = new URLSearchParams(location.search);
const NOMBRE = (params.get('n') || params.get('nombre') || '').trim().slice(0, 40);

const $ = (id) => document.getElementById(id);
const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esperar = (ms) => new Promise((r) => setTimeout(r, saltando ? 0 : ms));
let saltando = false;

// ---------- Personalización ----------
function personalizar() {
    // primera palabra grande; el resto ("de Honor") en una segunda línea
    const partes = CONFIG.rol.split(' ');
    const t = $('tituloScript');
    t.textContent = '';
    const l1 = document.createElement('span'); l1.className = 'ts-1';
    l1.textContent = partes[0] + (partes.length === 1 ? '?' : '');
    t.appendChild(l1);
    if (partes.length > 1) {
        const l2 = document.createElement('span'); l2.className = 'ts-2';
        l2.textContent = partes.slice(1).join(' ') + '?';
        t.appendChild(l2);
    }
    $('firma').textContent = CONFIG.firma;
    if (CONFIG.fecha) $('fechaTexto').textContent = CONFIG.fecha;
    if (NOMBRE) {
        $('sobreNombre').textContent = NOMBRE;
        $('saludo').textContent = 'Querido ' + NOMBRE + ',';
        $('graciasNombre').textContent = NOMBRE;
    }
    document.title = '¿Quieres ser mi ' + CONFIG.rol + '?';
}

// ---------- Marco dorado con esquinas recortadas ----------
function dibujarMarco() {
    const svg = $('marco');
    if (!svg) return;
    const path = svg.querySelector('path');
    const pintar = () => {
        const w = svg.clientWidth, h = svg.clientHeight, r = 18;
        if (!w || !h) return;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        path.setAttribute('d',
            'M' + r + ' 0 H' + (w - r) + ' A' + r + ' ' + r + ' 0 0 0 ' + w + ' ' + r +
            ' V' + (h - r) + ' A' + r + ' ' + r + ' 0 0 0 ' + (w - r) + ' ' + h +
            ' H' + r + ' A' + r + ' ' + r + ' 0 0 0 0 ' + (h - r) +
            ' V' + r + ' A' + r + ' ' + r + ' 0 0 0 ' + r + ' 0Z');
    };
    pintar();
    if ('ResizeObserver' in window) new ResizeObserver(pintar).observe(svg);
    else window.addEventListener('resize', pintar);
}

// ---------- Sobre ----------
function prepararSobre() {
    const sobre = $('sobre');
    let abierto = false;
    document.documentElement.style.overflow = 'hidden';
    function abrir() {
        if (abierto) return;
        abierto = true;
        iniciarMusica();
        sobre.classList.add('abriendo');
        setTimeout(() => document.body.classList.add('abierta'), 700);
        setTimeout(() => {
            sobre.remove();
            document.documentElement.style.overflow = '';
        }, reducido ? 900 : 2900);
        setTimeout(escribirPregunta, reducido ? 600 : 2000);
    }
    sobre.addEventListener('click', abrir);
    sobre.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
}

// ---------- Escritura suave (cada letra aparece como tinta) ----------
async function escribir(el, texto) {
    el.textContent = '';
    let i = 0, extra = 0;
    texto.split(' ').forEach((pal, w) => {
        const span = document.createElement('span');
        span.className = 'palabra';
        for (const c of pal) {
            const l = document.createElement('span');
            l.className = 'letra';
            l.textContent = c;
            l.style.setProperty('--d', (i * CONFIG.velocidad + extra) / 1000 + 's');
            if (c === ',' || c === ':' || c === '.') extra += CONFIG.velocidad * 6;
            span.appendChild(l);
            i++;
        }
        el.appendChild(span);
        if (w < texto.split(' ').length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.setAttribute('aria-label', texto);
    void el.offsetWidth; // aplica el estado inicial antes de animar
    if (reducido || saltando) { el.classList.add('tinta', 'ya'); return; }
    el.classList.add('tinta');
    const total = i * CONFIG.velocidad + extra + 500;
    const fin = Date.now() + total;
    while (Date.now() < fin) {
        if (saltando) { el.classList.add('ya'); return; }
        await new Promise((r) => setTimeout(r, 60));
    }
}

async function escribirPregunta() {
    const tarjeta = $('tarjeta');
    const saltar = () => { saltando = true; };
    tarjeta.addEventListener('click', saltar);

    const intro = $('intro');
    await escribir(intro, intro.dataset.texto);
    await esperar(350);
    $('divCorazon').classList.remove('oculto');
    await esperar(450);
    const serif = $('tituloSerif');
    await escribir(serif, serif.dataset.texto);
    await esperar(300);
    $('tituloScript').classList.add('escribir');
    if (reducido || saltando) $('tituloScript').style.clipPath = 'none';
    await esperar(2000);
    $('trazo').classList.add('dibujar');
    await esperar(900);

    tarjeta.removeEventListener('click', saltar);
    $('saltar').classList.add('fuera');
    $('botones').classList.remove('oculto');
    saltando = false;
}

// ---------- Botón "No" juguetón ----------
const FRASES_NO = ['¿Estás seguro?', 'Piénsalo otra vez…', 'Hazlo por mí, hermano', 'Un no no es opción'];
let intentosNo = 0;
function prepararNo() {
    const no = $('btnNo');
    const si = $('btnSi');
    const caja = $('botones');
    function huir(e) {
        if (e) e.preventDefault();
        intentosNo++;
        if (intentosNo > FRASES_NO.length) { no.remove(); si.style.transform = 'scale(1.15)'; return; }
        no.textContent = FRASES_NO[intentosNo - 1];
        si.style.transform = 'scale(' + (1 + intentosNo * 0.06) + ')';
        no.classList.add('suelto');
        const ancho = caja.clientWidth - no.offsetWidth;
        const x = Math.random() * Math.max(ancho, 0);
        const y = (Math.random() > .5 ? 1 : -1) * (40 + Math.random() * 30);
        no.style.left = x + 'px';
        no.style.top = y + 'px';
    }
    no.addEventListener('mouseenter', huir);
    no.addEventListener('touchstart', huir, { passive: false });
    no.addEventListener('click', huir);
}

// ---------- Respuesta "Sí" ----------
function prepararSi() {
    $('btnSi').addEventListener('click', async () => {
        confeti();
        const pregunta = $('pregunta');
        pregunta.style.transition = 'opacity .6s ease';
        pregunta.style.opacity = '0';
        await new Promise((r) => setTimeout(r, 600));
        pregunta.hidden = true;
        $('respuesta').hidden = false;
        setTimeout(() => document.querySelector('.fecha-sello').classList.add('estampar'), 1100);
        $('tarjeta').scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });

        if (CONFIG.whatsapp) {
            const quien = NOMBRE ? NOMBRE : 'tu caballero';
            const msg = '¡' + CONFIG.firma + '! Soy ' + quien + ' y acepto con mucho orgullo ser tu ' + CONFIG.rol + ' 🤵';
            const a = $('btnWhats');
            a.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
            a.hidden = false;
        }
    });
}

// ---------- Confeti ----------
function confeti() {
    if (reducido) return;
    const cv = $('confeti');
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colores = ['#5E1426', '#8A2342', '#3F0A18', '#B8945A', '#E9CFA0', '#F4E9DF'];
    const piezas = Array.from({ length: 170 }, () => ({
        x: innerWidth / 2 + (Math.random() - .5) * 80,
        y: innerHeight * .55,
        vx: (Math.random() - .5) * 14,
        vy: -Math.random() * 15 - 6,
        r: Math.random() * 6 + 4,
        rot: Math.random() * 6.28,
        vr: (Math.random() - .5) * .3,
        c: colores[(Math.random() * colores.length) | 0],
        rombo: Math.random() < .3
    }));
    let t0 = performance.now();
    (function frame(t) {
        const dt = Math.min((t - t0) / 16.7, 3); t0 = t;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        let vivos = 0;
        piezas.forEach((p) => {
            p.vy += .32 * dt; p.vx *= .99; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
            if (p.y < innerHeight + 20) vivos++;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
            if (p.rombo) {
                ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r * .6, 0); ctx.lineTo(0, p.r); ctx.lineTo(-p.r * .6, 0); ctx.closePath(); ctx.fill();
            } else {
                ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
            }
            ctx.restore();
        });
        if (vivos) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
}

// ---------- Música (opcional) ----------
function iniciarMusica() {
    if (!CONFIG.musica) return;
    const audio = $('musica');
    const btn = $('btnMusica');
    audio.src = CONFIG.musica;
    audio.play().then(() => { btn.hidden = false; }).catch(() => { btn.hidden = false; btn.classList.add('pausa'); });
    btn.addEventListener('click', () => {
        if (audio.paused) { audio.play(); btn.classList.remove('pausa'); }
        else { audio.pause(); btn.classList.add('pausa'); }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    personalizar();
    dibujarMarco();
    prepararSobre();
    prepararNo();
    prepararSi();
});
