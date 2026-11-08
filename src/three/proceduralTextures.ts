import * as THREE from 'three';
import { ZoneType } from '../types/classroom';

/**
 * Creates high-detail procedural parquet wood floor texture
 */
export function createParquetFloorTexture(renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base soft warm beech wood
  ctx.fillStyle = '#e8dfd5';
  ctx.fillRect(0, 0, 1024, 1024);

  const plankW = 256;
  const plankH = 64;

  for (let y = 0; y < 1024; y += plankH) {
    const rowOffset = (y / plankH) % 2 === 0 ? 0 : plankW / 2;
    for (let x = -plankW; x < 1024 + plankW; x += plankW) {
      const px = x + rowOffset;
      // Slight plank shade variation
      const shade = 230 + Math.floor(Math.sin(x * 12.3 + y * 4.7) * 12);
      ctx.fillStyle = `rgb(${shade}, ${shade - 8}, ${shade - 18})`;
      ctx.fillRect(px + 2, y + 2, plankW - 4, plankH - 4);

      // Subtle wood grain lines
      ctx.fillStyle = 'rgba(180, 150, 120, 0.12)';
      for (let g = 0; g < 4; g++) {
        const gy = y + 8 + g * 12 + (Math.sin(px + g) * 4);
        ctx.fillRect(px + 4, gy, plankW - 8, 1.5);
      }

      // Plank bevel edge
      ctx.strokeStyle = 'rgba(140, 115, 90, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 2, y + 2, plankW - 4, plankH - 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return texture;
}

/**
 * Creates lush procedural school garden panorama or cosmic vista for large windows
 */
export function createGardenViewTexture(theme?: import('../types/classroom').ClassroomTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (theme === 'cosmic_space') {
    // Cosmic Nebula & Stars
    const bg = ctx.createLinearGradient(0, 0, 1024, 512);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(0.5, '#0f0c29');
    bg.addColorStop(1, '#1e1035');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 512);

    // Glowing nebula clouds
    ctx.fillStyle = 'rgba(147, 51, 234, 0.25)';
    ctx.beginPath();
    ctx.arc(300, 200, 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.beginPath();
    ctx.arc(700, 280, 220, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 180; i++) {
      const sx = (i * 137.5) % 1024;
      const sy = (i * 93.3) % 480;
      const sr = (i % 5 === 0) ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing ringed planet
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(780, 140, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.7)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(780, 140, 90, 20, -0.3, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // Sunny sky gradient for Earth themes
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
  if (theme === 'warm_wood') {
    skyGrad.addColorStop(0, '#f59e0b');
    skyGrad.addColorStop(0.5, '#fde68a');
    skyGrad.addColorStop(1, '#fef3c7');
  } else if (theme === 'nature_green') {
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.5, '#7dd3fc');
    skyGrad.addColorStop(1, '#dcfce7');
  } else {
    skyGrad.addColorStop(0, '#60a5fa');
    skyGrad.addColorStop(0.6, '#93c5fd');
    skyGrad.addColorStop(1, '#e0f2fe');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Distant fluffy clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const drawCloud = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.7, cy - r * 0.3, r * 0.8, 0, Math.PI * 2);
    ctx.arc(cx + r * 1.4, cy, r * 0.9, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.7, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCloud(180, 100, 35);
  drawCloud(480, 80, 45);
  drawCloud(820, 120, 40);

  // Distant green hills
  ctx.fillStyle = theme === 'warm_wood' ? '#fcd34d' : '#86efac';
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.quadraticCurveTo(256, 280, 512, 340);
  ctx.quadraticCurveTo(768, 290, 1024, 320);
  ctx.lineTo(1024, 512);
  ctx.lineTo(0, 512);
  ctx.fill();

  // Closer vibrant lawn
  ctx.fillStyle = theme === 'warm_wood' ? '#fbbf24' : '#4ade80';
  ctx.beginPath();
  ctx.moveTo(0, 380);
  ctx.quadraticCurveTo(340, 340, 680, 380);
  ctx.quadraticCurveTo(860, 360, 1024, 390);
  ctx.lineTo(1024, 512);
  ctx.lineTo(0, 512);
  ctx.fill();

  // Stylized school trees
  const drawTree = (x: number, y: number, h: number, crownColor: string) => {
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x - 6, y - h * 0.35, 12, h * 0.35);
    ctx.fillStyle = crownColor;
    ctx.beginPath();
    ctx.arc(x, y - h * 0.65, h * 0.45, 0, Math.PI * 2);
    ctx.arc(x - 16, y - h * 0.55, h * 0.35, 0, Math.PI * 2);
    ctx.arc(x + 16, y - h * 0.55, h * 0.35, 0, Math.PI * 2);
    ctx.fill();
  };

  const foliage = theme === 'warm_wood' ? '#ea580c' : '#22c55e';
  const foliage2 = theme === 'warm_wood' ? '#d97706' : '#16a34a';

  drawTree(120, 410, 130, foliage);
  drawTree(240, 430, 160, foliage2);
  drawTree(400, 420, 140, '#f472b6'); // cherry blossom
  drawTree(620, 440, 170, '#15803d');
  drawTree(780, 420, 150, '#fbbf24'); // golden elm
  drawTree(920, 430, 140, foliage);

  // School path / flower borders
  ctx.fillStyle = '#fde047';
  for (let f = 30; f < 1000; f += 40) {
    ctx.beginPath();
    ctx.arc(f, 480 + (f % 15), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates modern motivational classroom banner
 */
export function createBannerTexture(
  bannerTitle = 'LỚP HỌC ẢO 3D – GIÁO VIÊN SÁNG TẠO',
  theme?: import('../types/classroom').ClassroomTheme
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dynamic theme gradient background
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  if (theme === 'cosmic_space') {
    grad.addColorStop(0, '#312e81');
    grad.addColorStop(0.5, '#7c3aed');
    grad.addColorStop(1, '#312e81');
  } else if (theme === 'nature_green') {
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.5, '#10b981');
    grad.addColorStop(1, '#047857');
  } else if (theme === 'warm_wood') {
    grad.addColorStop(0, '#b45309');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#b45309');
  } else {
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(10, 10, 1004, 236, 24);
  ctx.fill();

  // Decorative border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(24, 24, 976, 208, 16);
  ctx.stroke();

  // Cute golden stars
  const drawStar = (cx: number, cy: number, spikes: number, outerR: number, innerR: number) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerR;
      y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fillStyle = '#fde047';
    ctx.fill();
  };

  drawStar(80, 128, 5, 28, 14);
  drawStar(944, 128, 5, 28, 14);
  drawStar(140, 70, 4, 16, 8);
  drawStar(884, 70, 4, 16, 8);

  // Main text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px "Quicksand", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 10;
  ctx.fillText(bannerTitle, 512, 105);

  ctx.shadowBlur = 0;
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('Học tập chủ động • Tương tác trực quan • Khơi nguồn trí tuệ', 512, 165);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates working wall clock canvas texture
 */
export function createClockTexture(hours: number, minutes: number, seconds: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;
  const r = 220;

  // Outer ring
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Face
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 18, 0, Math.PI * 2);
  ctx.fill();

  // Numbers & ticks
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let num = 1; num <= 12; num++) {
    const angle = ((num * 30) - 90) * (Math.PI / 180);
    const nx = cx + Math.cos(angle) * (r - 55);
    const ny = cy + Math.sin(angle) * (r - 55);
    ctx.fillText(num.toString(), nx, ny);
  }

  // Hour hand
  const hAngle = (((hours % 12) + minutes / 60) * 30 - 90) * (Math.PI / 180);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(hAngle) * 90, cy + Math.sin(hAngle) * 90);
  ctx.stroke();

  // Minute hand
  const mAngle = ((minutes + seconds / 60) * 6 - 90) * (Math.PI / 180);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(mAngle) * 135, cy + Math.sin(mAngle) * 135);
  ctx.stroke();

  // Second hand
  const sAngle = (seconds * 6 - 90) * (Math.PI / 180);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sAngle) * 155, cy + Math.sin(sAngle) * 155);
  ctx.stroke();

  // Center pin
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates high-fidelity screen canvas texture for EMPTY or populated frames
 * STRICT REQUIREMENT: When empty, no mock images/games! Displays clean subtle "+ Thêm nội dung".
 */
export function renderScreenCanvas(
  title: string,
  zone: ZoneType,
  color: string,
  hasContent: boolean,
  contentDetail?: {
    imageObj?: HTMLImageElement;
    videoTitle?: string;
    gameTitle?: string;
    docTitle?: string;
  }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  if (hasContent && contentDetail?.imageObj) {
    // Draw the actual uploaded image!
    const img = contentDetail.imageObj;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 640);

    // Cover / contain aspect ratio calculation
    const imgRatio = img.width / img.height;
    const canvasRatio = 1024 / 640;
    let drawW = 1024;
    let drawH = 640;
    let dx = 0;
    let dy = 0;

    if (imgRatio > canvasRatio) {
      drawW = 1024;
      drawH = 1024 / imgRatio;
      dy = (640 - drawH) / 2;
    } else {
      drawH = 640;
      drawW = 640 * imgRatio;
      dx = (1024 - drawW) / 2;
    }

    try {
      ctx.drawImage(img, dx, dy, drawW, drawH);
    } catch {
      // fallback
    }

    // Elegant gradient bottom pill with title
    const pillGrad = ctx.createLinearGradient(0, 520, 0, 640);
    pillGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
    pillGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
    ctx.fillStyle = pillGrad;
    ctx.fillRect(0, 520, 1024, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 32, 595);

    return canvas;
  }

  // If POPULATED VIDEO / GAME / DOC:
  if (hasContent) {
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 640);
    bgGrad.addColorStop(0, '#0a101f');
    bgGrad.addColorStop(1, '#111e38');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 640);

    // Glowing border
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, 992, 608);

    // Glowing circle in center
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 40;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(512, 280, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Center icon
    ctx.fillStyle = '#ffffff';
    if (zone === 'video_theater') {
      // Play triangle
      ctx.beginPath();
      ctx.moveTo(490, 240);
      ctx.lineTo(550, 280);
      ctx.lineTo(490, 320);
      ctx.closePath();
      ctx.fill();
    } else if (zone === 'game_zone') {
      // Game controller shape
      ctx.beginPath();
      ctx.roundRect(470, 260, 84, 44, 12);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(490, 282, 6, 0, Math.PI * 2);
      ctx.arc(534, 282, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Doc icon
      ctx.beginPath();
      ctx.roundRect(485, 245, 54, 70, 8);
      ctx.fill();
    }

    // Title & action prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 512, 420);

    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Nhấn vào màn hình để mở tương tác', 512, 480);

    return canvas;
  }

  // ==========================================
  // EMPTY STATE (STRICT REQUIREMENT: NO SAMPLE DATA!)
  // ==========================================
  // Futuristic dark-blue glass canvas
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 640);
  bgGrad.addColorStop(0, '#0c162c');
  bgGrad.addColorStop(0.5, '#0f1e3c');
  bgGrad.addColorStop(1, '#091326');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 640);

  // Subtle grid lines in background
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < 1024; gx += 64) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, 640);
    ctx.stroke();
  }
  for (let gy = 40; gy < 640; gy += 64) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(1024, gy);
    ctx.stroke();
  }

  // Elegant dashed border
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 12]);
  ctx.strokeRect(28, 28, 968, 584);
  ctx.restore();

  // Corner neon accents
  ctx.fillStyle = color;
  const cornerSize = 24;
  ctx.fillRect(24, 24, cornerSize, 6);
  ctx.fillRect(24, 24, 6, cornerSize);
  ctx.fillRect(1000 - cornerSize, 24, cornerSize, 6);
  ctx.fillRect(994, 24, 6, cornerSize);
  ctx.fillRect(24, 610, cornerSize, 6);
  ctx.fillRect(24, 616 - cornerSize, 6, cornerSize);
  ctx.fillRect(1000 - cornerSize, 610, cornerSize, 6);
  ctx.fillRect(994, 616 - cornerSize, 6, cornerSize);

  // Soft glowing circle for the "+" icon
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.beginPath();
  ctx.arc(512, 270, 75, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Plus icon
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(512, 235);
  ctx.lineTo(512, 305);
  ctx.moveTo(477, 270);
  ctx.lineTo(547, 270);
  ctx.stroke();

  // Primary text: "+ Thêm nội dung"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+ Thêm nội dung', 512, 400);

  // Subtitle with title
  ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(title, 512, 455);

  // Zone pill tag
  let zoneLabel = 'Bảng thông minh';
  if (zone === 'image_gallery') zoneLabel = 'Kho hình ảnh';
  if (zone === 'video_theater') zoneLabel = 'Rạp chiếu video';
  if (zone === 'game_zone') zoneLabel = 'Khu vực trò chơi';
  if (zone === 'resource_library') zoneLabel = 'Học liệu số';

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(512 - 120, 500, 240, 44, 22);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(zoneLabel, 512, 522);

  return canvas;
}
