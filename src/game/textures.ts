import * as THREE from 'three';
import stoneTileUrl from '../assets/images/stone_pathway_tile_1793878367335.jpg';

export interface AcademyTextureLibrary {
  stoneColor: THREE.Texture;
  stoneBump: THREE.CanvasTexture;
  grassColor: THREE.CanvasTexture;
  grassBump: THREE.CanvasTexture;
  wallPlasterColor: THREE.CanvasTexture;
  wallPlasterBump: THREE.CanvasTexture;
  roofTileColor: THREE.CanvasTexture;
  roofTileBump: THREE.CanvasTexture;
  woodGrainColor: THREE.CanvasTexture;
  barkColor: THREE.CanvasTexture;
  animeEyeLeft: THREE.CanvasTexture;
  animeEyeRight: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  toonGradient: THREE.DataTexture;
  dispose: () => void;
}

function configureRepeat(tex: THREE.Texture, repeatX: number, repeatY: number, maxAnisotropy: number, isColor: boolean) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
}

export function createAcademyTextureLibrary(renderer: THREE.WebGLRenderer): AcademyTextureLibrary {
  const maxAniso = renderer.capabilities.getMaxAnisotropy() || 4;
  const allTextures: THREE.Texture[] = [];

  // 1. Stone Pathway Bump & Procedural Fallback + High-Res Image Map
  const stoneBumpCanvas = document.createElement('canvas');
  stoneBumpCanvas.width = 256;
  stoneBumpCanvas.height = 256;
  const sbCtx = stoneBumpCanvas.getContext('2d')!;
  sbCtx.fillStyle = '#909090';
  sbCtx.fillRect(0, 0, 256, 256);
  // Ashlar stone mortar grid
  sbCtx.strokeStyle = '#2a2a2a';
  sbCtx.lineWidth = 4;
  for (let y = 0; y < 256; y += 64) {
    sbCtx.beginPath();
    sbCtx.moveTo(0, y);
    sbCtx.lineTo(256, y);
    sbCtx.stroke();
    const offset = (y / 64) % 2 === 0 ? 0 : 64;
    for (let x = offset; x < 256; x += 128) {
      sbCtx.beginPath();
      sbCtx.moveTo(x, y);
      sbCtx.lineTo(x, y + 64);
      sbCtx.stroke();
    }
  }
  const stoneBump = new THREE.CanvasTexture(stoneBumpCanvas);
  configureRepeat(stoneBump, 6, 18, maxAniso, false);
  allTextures.push(stoneBump);

  // Initial procedural stone color canvas at 512x512 while image loads
  const stoneFallbackCanvas = document.createElement('canvas');
  stoneFallbackCanvas.width = 512;
  stoneFallbackCanvas.height = 512;
  const sfCtx = stoneFallbackCanvas.getContext('2d')!;
  sfCtx.fillStyle = '#b9b4aa';
  sfCtx.fillRect(0, 0, 512, 512);
  const blockTones = ['#c4bfb5', '#b2ada3', '#bab5ab', '#aba69c'];
  for (let row = 0; row < 4; row++) {
    const y = row * 128;
    const offset = row % 2 === 0 ? 0 : 128;
    for (let col = -1; col < 3; col++) {
      const x = col * 256 + offset;
      sfCtx.fillStyle = blockTones[(row + col + 4) % blockTones.length];
      sfCtx.fillRect(x + 4, y + 4, 248, 120);
    }
  }
  const stoneColor = new THREE.CanvasTexture(stoneFallbackCanvas);
  configureRepeat(stoneColor, 5, 16, maxAniso, true);
  allTextures.push(stoneColor);

  // Load generated seamless stone pathway tile into the same 512x512 canvas texture
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const ctx = stoneFallbackCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, 512, 512);
      stoneColor.needsUpdate = true;
    }
  };
  img.src = stoneTileUrl;

  // 2. Courtyard Lawn Grass Color & Bump
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = 256;
  grassCanvas.height = 256;
  const gCtx = grassCanvas.getContext('2d')!;
  gCtx.fillStyle = '#4d7c43';
  gCtx.fillRect(0, 0, 256, 256);
  const bladeColors = ['#588b4c', '#436e3a', '#649956', '#3d6634'];
  for (let i = 0; i < 1800; i++) {
    const gx = (i * 73) % 256;
    const gy = (i * 137) % 256;
    gCtx.fillStyle = bladeColors[i % bladeColors.length];
    gCtx.fillRect(gx, gy, 2, 5);
  }
  // Subtle fallen sakura petals on the grass
  gCtx.fillStyle = '#fbcfe8';
  for (let i = 0; i < 42; i++) {
    const px = (i * 193 + 17) % 250;
    const py = (i * 109 + 31) % 250;
    gCtx.beginPath();
    gCtx.ellipse(px, py, 2.5, 1.4, (i * 0.7) % Math.PI, 0, Math.PI * 2);
    gCtx.fill();
  }
  const grassColor = new THREE.CanvasTexture(grassCanvas);
  configureRepeat(grassColor, 18, 18, maxAniso, true);
  allTextures.push(grassColor);

  const grassBumpCanvas = document.createElement('canvas');
  grassBumpCanvas.width = 128;
  grassBumpCanvas.height = 128;
  const gbCtx = grassBumpCanvas.getContext('2d')!;
  gbCtx.fillStyle = '#808080';
  gbCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    gbCtx.fillStyle = i % 2 === 0 ? '#a8a8a8' : '#585858';
    gbCtx.fillRect((i * 53) % 128, (i * 97) % 128, 2, 3);
  }
  const grassBump = new THREE.CanvasTexture(grassBumpCanvas);
  configureRepeat(grassBump, 24, 24, maxAniso, false);
  allTextures.push(grassBump);

  // 3. Academy Architectural Wall Stucco Plaster
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 256;
  wallCanvas.height = 256;
  const wCtx = wallCanvas.getContext('2d')!;
  wCtx.fillStyle = '#f4EFE6';
  wCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    wCtx.fillStyle = i % 2 === 0 ? 'rgba(225, 216, 200, 0.35)' : 'rgba(255, 252, 247, 0.35)';
    wCtx.fillRect((i * 67) % 256, (i * 113) % 256, 3, 3);
  }
  wCtx.strokeStyle = 'rgba(195, 185, 168, 0.45)';
  wCtx.lineWidth = 1.5;
  for (let y = 0; y < 256; y += 64) {
    wCtx.beginPath();
    wCtx.moveTo(0, y);
    wCtx.lineTo(256, y);
    wCtx.stroke();
  }
  const wallPlasterColor = new THREE.CanvasTexture(wallCanvas);
  configureRepeat(wallPlasterColor, 6, 3, maxAniso, true);
  allTextures.push(wallPlasterColor);

  const wallPlasterBump = new THREE.CanvasTexture(wallCanvas);
  configureRepeat(wallPlasterBump, 6, 3, maxAniso, false);
  allTextures.push(wallPlasterBump);

  // 4. Japanese Academy Slate Roof Tiles (Kawara)
  const roofCanvas = document.createElement('canvas');
  roofCanvas.width = 256;
  roofCanvas.height = 256;
  const rCtx = roofCanvas.getContext('2d')!;
  rCtx.fillStyle = '#273244';
  rCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    const grad = rCtx.createLinearGradient(0, y, 0, y + 32);
    grad.addColorStop(0, '#1e2736');
    grad.addColorStop(0.5, '#334155');
    grad.addColorStop(1, '#1a2230');
    rCtx.fillStyle = grad;
    rCtx.fillRect(0, y, 256, 31);
  }
  rCtx.strokeStyle = '#141b26';
  rCtx.lineWidth = 3;
  for (let x = 0; x < 256; x += 32) {
    rCtx.beginPath();
    rCtx.moveTo(x, 0);
    rCtx.lineTo(x, 256);
    rCtx.stroke();
  }
  const roofTileColor = new THREE.CanvasTexture(roofCanvas);
  configureRepeat(roofTileColor, 10, 4, maxAniso, true);
  allTextures.push(roofTileColor);

  const roofTileBump = new THREE.CanvasTexture(roofCanvas);
  configureRepeat(roofTileBump, 10, 4, maxAniso, false);
  allTextures.push(roofTileBump);

  // 5. Warm Cedar Wood Grain (Benches & Walkway Beams)
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 256;
  woodCanvas.height = 256;
  const wdCtx = woodCanvas.getContext('2d')!;
  wdCtx.fillStyle = '#8c583a';
  wdCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 4) {
    wdCtx.fillStyle = y % 8 === 0 ? 'rgba(62, 35, 20, 0.22)' : 'rgba(168, 112, 76, 0.16)';
    wdCtx.fillRect(0, y, 256, 2);
  }
  const woodGrainColor = new THREE.CanvasTexture(woodCanvas);
  configureRepeat(woodGrainColor, 2, 2, maxAniso, true);
  allTextures.push(woodGrainColor);

  // 6. Cherry Blossom Tree Bark
  const barkCanvas = document.createElement('canvas');
  barkCanvas.width = 128;
  barkCanvas.height = 128;
  const bkCtx = barkCanvas.getContext('2d')!;
  bkCtx.fillStyle = '#4a3731';
  bkCtx.fillRect(0, 0, 128, 128);
  // Horizontal cherry bark lenticels
  for (let i = 0; i < 140; i++) {
    bkCtx.fillStyle = i % 3 === 0 ? '#694e46' : '#362722';
    bkCtx.fillRect((i * 29) % 120, (i * 19) % 128, 14, 2);
  }
  const barkColor = new THREE.CanvasTexture(barkCanvas);
  configureRepeat(barkColor, 2, 4, maxAniso, true);
  allTextures.push(barkColor);

  // 7. Expressive Anime Eye Iris Textures (Left & Right)
  function createAnimeEyeCanvas(isLeft: boolean): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    // Sclera white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);

    // Outer iris ring (deep sapphire-violet anime gradient)
    const cx = 128;
    const cy = 132;
    const irisGrad = ctx.createRadialGradient(cx, cy - 20, 15, cx, cy + 25, 86);
    irisGrad.addColorStop(0, '#1e1b4b');
    irisGrad.addColorStop(0.45, '#3b82f6');
    irisGrad.addColorStop(0.8, '#60a5fa');
    irisGrad.addColorStop(1, '#1e3a8a');

    ctx.beginPath();
    ctx.ellipse(cx, cy, 74, 84, 0, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // Lower luminous crescent highlight inside iris
    ctx.beginPath();
    ctx.arc(cx, cy + 16, 52, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Deep pupil
    ctx.beginPath();
    ctx.ellipse(cx, cy, 28, 34, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Primary anime specular catchlight (upper outer)
    const hlX = isLeft ? cx - 28 : cx - 28;
    ctx.beginPath();
    ctx.ellipse(hlX, cy - 32, 18, 22, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Secondary micro catchlight (lower opposite)
    ctx.beginPath();
    ctx.arc(cx + 26, cy + 28, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Bold upper eyelash arch
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 86, 1.12 * Math.PI, 1.88 * Math.PI);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.stroke();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    tex.needsUpdate = true;
    allTextures.push(tex);
    return tex;
  }

  const animeEyeLeft = createAnimeEyeCanvas(true);
  const animeEyeRight = createAnimeEyeCanvas(false);

  // 8. Soft Radial Contact Shadow Disc
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shCtx = shadowCanvas.getContext('2d')!;
  const shGrad = shCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  shGrad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
  shGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.25)');
  shGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  shCtx.fillStyle = shGrad;
  shCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shadowCanvas);
  allTextures.push(contactShadow);

  // 9. 4-step Anime Cel-Shading Gradient Map
  const toonData = new Uint8Array([95, 165, 225, 255]);
  const toonGradient = new THREE.DataTexture(toonData, 4, 1, THREE.RedFormat);
  toonGradient.minFilter = THREE.NearestFilter;
  toonGradient.magFilter = THREE.NearestFilter;
  toonGradient.needsUpdate = true;
  allTextures.push(toonGradient);

  return {
    stoneColor,
    stoneBump,
    grassColor,
    grassBump,
    wallPlasterColor,
    wallPlasterBump,
    roofTileColor,
    roofTileBump,
    woodGrainColor,
    barkColor,
    animeEyeLeft,
    animeEyeRight,
    contactShadow,
    toonGradient,
    dispose: () => {
      allTextures.forEach((t) => t.dispose());
    },
  };
}
