// GRAVIDADE MAIS FORTE (Jogo menos flutuante)
const gravity = 1.0; 

class Fighter {
    constructor({ charId, name, position, velocity, offset, color }) {
        this.charId = charId; this.name = name; this.position = position; this.velocity = velocity;
        this.width = 90; this.height = 90; this.health = 100; this.color = color; 
        this.combo = 0; this.lastHitTime = 0;
        this.isAttacking = false; this.currentAttack = null; this.facingRight = offset.x === 0;

        // Ataques mais rápidos!
        this.attacks = {
            light: { offset: offset, width: 100, height: 40, damage: 5, duration: 100 }, // Soco jab rápido
            heavy: { offset: offset, width: 140, height: 60, damage: 12, duration: 250 } // Chutão pesado
        };

        this.attackBox = { position: { x: this.position.x, y: this.position.y }, width: 0, height: 0 };
        this.frame = 0; 
    }

    draw(ctx) {
        let isMoving = Math.abs(this.velocity.x) > 0;
        if (isMoving && this.velocity.y === 0) this.frame += 0.4; // Animação corrida
        else if (!isMoving) this.frame = 0;

        let swing = Math.sin(this.frame) * 18; 
        let dir = this.facingRight ? 1 : -1;
        let cx = this.position.x + this.width / 2;
        let cy = this.position.y + this.height / 2;

        ctx.save();
        this.drawBody(ctx, cx, cy);

        let punchExtend = 0; let kickExtend = 0;
        if (this.isAttacking) {
            if (this.currentAttack === 'light') punchExtend = 60 * dir;
            if (this.currentAttack === 'heavy') kickExtend = 70 * dir;
        }

        // Pés
        this.drawShoe(ctx, cx - (15 * dir), cy + 40 + swing, dir, '#880000');
        this.drawShoe(ctx, cx + (25 * dir) + kickExtend, cy + 40 - swing, dir, '#cc0000');
        
        // Mãos
        this.drawGlove(ctx, cx - (20 * dir), cy + 10 + swing, dir, '#ccc');
        this.drawGlove(ctx, cx + (30 * dir) + punchExtend, cy + 10 - swing, dir, '#fff');

        // Rajada de vento do golpe
        if (this.isAttacking && this.currentAttack && !isMoving) {
            ctx.fillStyle = this.currentAttack === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(255,165,0,0.8)';
            ctx.beginPath();
            let hx = cx + (dir * (this.currentAttack === 'light' ? 90 : 100));
            ctx.arc(hx, cy + (this.currentAttack === 'light' ? 10 : 40), 20 + Math.random()*15, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawGlove(ctx, x, y, dir, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(x - (3*dir), y + 3, 10, 0, Math.PI*2); ctx.fill(); }
    drawShoe(ctx, x, y, dir, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x + (10*dir), y, 22, 12, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'white'; ctx.fillRect(x - 12 + (10*dir), y + 8, 24, 4); }

    drawBody(ctx, cx, cy) {
        let look = this.facingRight ? 12 : -12;
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(0,0,0,0.4)";

        if (this.charId === 'brigadeiro') {
            ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.moveTo(cx-35, cy+40); ctx.lineTo(cx+35, cy+40); ctx.lineTo(cx+45, cy+10); ctx.lineTo(cx-45, cy+10); ctx.fill();
            let grad = ctx.createRadialGradient(cx-15, cy-15, 10, cx, cy, 50); grad.addColorStop(0, '#6b423f'); grad.addColorStop(1, '#2a1a19'); ctx.beginPath(); ctx.arc(cx, cy, 45, 0, Math.PI*2); ctx.fillStyle = grad; ctx.fill();
            const cores = ['#ff8888', '#88ff88', '#8888ff', '#ffff88', '#fff']; ctx.shadowBlur = 0; ctx.save(); ctx.translate(cx, cy); for(let i=0; i<8; i++) { ctx.fillStyle = cores[i%5]; ctx.rotate(0.8); ctx.fillRect(-25 + i*5, -30 + i*3, 4, 12); } ctx.restore();
            this.drawEyes(ctx, cx, cy, look, 'white');
        } 
        else if (this.charId === 'docedelete') {
            let grad = ctx.createLinearGradient(cx - 35, cy - 35, cx + 35, cy + 35); grad.addColorStop(0, '#f2ca8a'); grad.addColorStop(0.5, '#c98b42'); grad.addColorStop(1, '#8f5611'); ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(cx - 35, cy - 40, 70, 80, 8); ctx.fill();
            ctx.lineWidth = 3; ctx.strokeStyle = '#e6b97e'; ctx.beginPath(); ctx.moveTo(cx-25, cy-40); ctx.lineTo(cx-25, cy+40); ctx.stroke();
            this.drawEyes(ctx, cx, cy, look, '#522f07');
        }
        else if (this.charId === 'trakinas') {
            ctx.beginPath(); ctx.arc(cx, cy, 45, 0, Math.PI*2); ctx.fillStyle = '#c97834'; ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI*2); ctx.fillStyle = '#E8A365'; ctx.fill();
            ctx.fillStyle = '#4a2c2a'; ctx.beginPath(); ctx.arc(cx-15+look, cy-10, 6, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+15+look, cy-10, 6, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx+look, cy+15, 15, 0.1*Math.PI, 0.9*Math.PI); ctx.lineWidth = 5; ctx.strokeStyle = '#4a2c2a'; ctx.stroke();
        }
        else if (this.charId === 'pacoquinha') {
            let grad = ctx.createLinearGradient(cx - 35, cy, cx + 35, cy); grad.addColorStop(0, '#d2b48c'); grad.addColorStop(1, '#8f6e47'); ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(cx-35, cy-45, 70, 90, 10); ctx.fill();
            ctx.fillStyle = '#f0e0cd'; ctx.beginPath(); ctx.ellipse(cx, cy-45, 35, 12, 0, 0, Math.PI*2); ctx.fill(); this.drawEyes(ctx, cx, cy, look, '#4a2c2a');
        }
        else if (this.charId === 'beijinho') {
            let grad = ctx.createRadialGradient(cx-15, cy-15, 10, cx, cy, 50); grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ccc'); ctx.beginPath(); ctx.arc(cx, cy, 45, 0, Math.PI*2); ctx.fillStyle = grad; ctx.fill();
            ctx.fillStyle = '#3a2218'; ctx.beginPath(); ctx.arc(cx, cy-40, 5, 0, Math.PI*2); ctx.fill(); ctx.fillRect(cx-1, cy-40, 3, 15); this.drawEyes(ctx, cx, cy, look, 'black');
        }
        ctx.shadowBlur = 0;
    }

    drawEyes(ctx, cx, cy, look, color) {
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx - 15 + look, cy - 10, 8, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 15 + look, cy - 10, 8, 0, Math.PI*2); ctx.fill();
        if(color !== 'white') { ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(cx - 12 + look, cy - 12, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 18 + look, cy - 12, 3, 0, Math.PI*2); ctx.fill(); }
    }

    update(ctx, canvasHeight) {
        this.draw(ctx);
        let atkOffset = this.facingRight ? 0 : -this.attacks[this.currentAttack?.type || 'light'].width + this.width;
        this.attackBox.position.x = this.position.x + atkOffset + (this.facingRight ? 30 : -30);
        this.attackBox.position.y = this.position.y + (this.currentAttack === 'light' ? 10 : 50);

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.y + this.height + 50 + this.velocity.y >= canvasHeight - 50) {
            this.velocity.y = 0; this.position.y = canvasHeight - 50 - this.height - 50;
        } else { this.velocity.y += gravity; }
        
        if(this.position.x <= 0) this.position.x = 0;
        if(this.position.x + this.width >= 1024) this.position.x = 1024 - this.width;
    }

    attack(type) {
        if (this.isAttacking) return; 
        this.isAttacking = true; this.currentAttack = type;
        this.attackBox.width = this.attacks[type].width; this.attackBox.height = this.attacks[type].height;
        setTimeout(() => { this.isAttacking = false; this.currentAttack = null; }, this.attacks[type].duration);
    }
}

// NOVO: SISTEMA DE PARTÍCULAS (Migalhas voando)
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.velocity = { x: (Math.random() - 0.5) * 20, y: (Math.random() - 1) * 20 };
        this.radius = Math.random() * 6 + 2;
        this.color = color;
        this.alpha = 1;
    }
    draw(ctx) {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.restore();
    }
    update(ctx) {
        this.draw(ctx);
        this.velocity.y += 0.8; // Gravidade das partículas
        this.x += this.velocity.x; this.y += this.velocity.y;
        this.alpha -= 0.02; // Vai sumindo
    }
}

// NOVO: TEXTOS FLUTUANTES (POW! BAM!)
class FloatingText {
    constructor(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.velocity = -3; this.alpha = 1; this.life = 40;
    }
    draw(ctx) {
        ctx.save(); ctx.globalAlpha = this.alpha; 
        ctx.font = '24px "Press Start 2P"'; ctx.fillStyle = this.color; 
        ctx.strokeStyle = 'black'; ctx.lineWidth = 4;
        ctx.strokeText(this.text, this.x, this.y); ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
    update(ctx) {
        this.draw(ctx);
        this.y += this.velocity; this.life--;
        if(this.life < 10) this.alpha -= 0.1;
    }
}