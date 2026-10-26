import * as THREE from "three";

export interface ParadiseTextures {
  runwayTile: THREE.CanvasTexture;
  barrierStripe: THREE.CanvasTexture;
  quiltedLeather: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  sparkleSprite: THREE.CanvasTexture;
  dispose: () => void;
}

export function createParadiseTextures(
  renderer: THREE.WebGLRenderer
): ParadiseTextures {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // 1. Pearlescent Rose-Quartz Runway Tile Texture (3 lanes with shimmering gold lane lines)
  const runwayCanvas = document.createElement("canvas");
  runwayCanvas.width = 512;
  runwayCanvas.height = 512;
  const rCtx = runwayCanvas.getContext("2d")!;

  const baseGrad = rCtx.createLinearGradient(0, 0, 512, 0);
  baseGrad.addColorStop(0, "#f48fb9");
  baseGrad.addColorStop(0.5, "#fbd0e5");
  baseGrad.addColorStop(1, "#f48fb9");
  rCtx.fillStyle = baseGrad;
  rCtx.fillRect(0, 0, 512, 512);

  // Subtle alternating pastel terrazzo / marble tiles
  const rows = 8;
  const cols = 3;
  const cellW = 512 / cols;
  const cellH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const alt = (r + c) % 2 === 0;
      rCtx.fillStyle = alt
        ? "rgba(255, 245, 250, 0.42)"
        : "rgba(219, 39, 119, 0.14)";
      rCtx.fillRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8);

      // Subtle diamond center motif on every second tile
      if ((r + c) % 2 === 0) {
        const cx = c * cellW + cellW * 0.5;
        const cy = r * cellH + cellH * 0.5;
        rCtx.fillStyle = "rgba(219, 39, 119, 0.2)";
        rCtx.beginPath();
        rCtx.moveTo(cx, cy - 12);
        rCtx.lineTo(cx + 12, cy);
        rCtx.lineTo(cx, cy + 12);
        rCtx.lineTo(cx - 12, cy);
        rCtx.closePath();
        rCtx.fill();
      }
    }
  }

  // Crisp hot-pink & rose-gold lane divider stripes at 1/3 and 2/3 width
  [cellW, cellW * 2].forEach((xPos) => {
    rCtx.fillStyle = "#db2777";
    rCtx.fillRect(xPos - 9, 0, 18, 512);
    rCtx.fillStyle = "#fde68a";
    rCtx.fillRect(xPos - 3, 0, 6, 512);
  });

  // Outer runway border trim
  rCtx.fillStyle = "#be185d";
  rCtx.fillRect(0, 0, 14, 512);
  rCtx.fillRect(498, 0, 14, 512);

  const runwayTile = new THREE.CanvasTexture(runwayCanvas);
  runwayTile.colorSpace = THREE.SRGBColorSpace;
  runwayTile.wrapS = THREE.ClampToEdgeWrapping;
  runwayTile.wrapT = THREE.RepeatWrapping;
  runwayTile.repeat.set(1, 22);
  runwayTile.anisotropy = maxAniso;

  // 2. Diagonal Satin Pink & Pearl Ribbon Stripe for Slide Barriers
  const stripeCanvas = document.createElement("canvas");
  stripeCanvas.width = 256;
  stripeCanvas.height = 128;
  const sCtx = stripeCanvas.getContext("2d")!;
  sCtx.fillStyle = "#fff5f9";
  sCtx.fillRect(0, 0, 256, 128);
  sCtx.fillStyle = "#ec4899";
  for (let i = -128; i < 384; i += 48) {
    sCtx.beginPath();
    sCtx.moveTo(i, 0);
    sCtx.lineTo(i + 24, 0);
    sCtx.lineTo(i - 24, 128);
    sCtx.lineTo(i - 48, 128);
    sCtx.closePath();
    sCtx.fill();
  }
  // Gold top/bottom trim
  sCtx.fillStyle = "#f6c453";
  sCtx.fillRect(0, 0, 256, 12);
  sCtx.fillRect(0, 116, 256, 12);

  const barrierStripe = new THREE.CanvasTexture(stripeCanvas);
  barrierStripe.colorSpace = THREE.SRGBColorSpace;
  barrierStripe.wrapS = THREE.RepeatWrapping;
  barrierStripe.wrapT = THREE.ClampToEdgeWrapping;
  barrierStripe.anisotropy = maxAniso;

  // 3. Quilted Blush Cosmetic Leather Texture for Makeup Bags
  const quiltCanvas = document.createElement("canvas");
  quiltCanvas.width = 256;
  quiltCanvas.height = 256;
  const qCtx = quiltCanvas.getContext("2d")!;
  qCtx.fillStyle = "#ff5ca8";
  qCtx.fillRect(0, 0, 256, 256);

  qCtx.strokeStyle = "rgba(157, 23, 77, 0.45)";
  qCtx.lineWidth = 3;
  const step = 32;
  for (let i = -256; i < 512; i += step) {
    qCtx.beginPath();
    qCtx.moveTo(i, 0);
    qCtx.lineTo(i + 256, 256);
    qCtx.stroke();

    qCtx.beginPath();
    qCtx.moveTo(i + 256, 0);
    qCtx.lineTo(i, 256);
    qCtx.stroke();
  }

  const quiltedLeather = new THREE.CanvasTexture(quiltCanvas);
  quiltedLeather.colorSpace = THREE.SRGBColorSpace;
  quiltedLeather.wrapS = THREE.RepeatWrapping;
  quiltedLeather.wrapT = THREE.RepeatWrapping;
  quiltedLeather.anisotropy = maxAniso;

  // 4. Soft Radial Contact Shadow Texture
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shCtx = shadowCanvas.getContext("2d")!;
  const radGrad = shCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  radGrad.addColorStop(0, "rgba(88, 12, 52, 0.52)");
  radGrad.addColorStop(0.55, "rgba(88, 12, 52, 0.22)");
  radGrad.addColorStop(1, "rgba(88, 12, 52, 0)");
  shCtx.fillStyle = radGrad;
  shCtx.fillRect(0, 0, 128, 128);

  const contactShadow = new THREE.CanvasTexture(shadowCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;

  // 5. Four-Point Star Sparkle Particle Texture
  const spCanvas = document.createElement("canvas");
  spCanvas.width = 64;
  spCanvas.height = 64;
  const spCtx = spCanvas.getContext("2d")!;
  const glow = spCtx.createRadialGradient(32, 32, 1, 32, 32, 30);
  glow.addColorStop(0, "rgba(255, 255, 255, 1)");
  glow.addColorStop(0.35, "rgba(255, 196, 229, 0.85)");
  glow.addColorStop(1, "rgba(255, 105, 180, 0)");
  spCtx.fillStyle = glow;
  spCtx.fillRect(0, 0, 64, 64);

  spCtx.fillStyle = "#ffffff";
  spCtx.beginPath();
  spCtx.moveTo(32, 4);
  spCtx.quadraticCurveTo(35, 29, 60, 32);
  spCtx.quadraticCurveTo(35, 35, 32, 60);
  spCtx.quadraticCurveTo(29, 35, 4, 32);
  spCtx.quadraticCurveTo(29, 29, 32, 4);
  spCtx.closePath();
  spCtx.fill();

  const sparkleSprite = new THREE.CanvasTexture(spCanvas);
  sparkleSprite.colorSpace = THREE.SRGBColorSpace;

  return {
    runwayTile,
    barrierStripe,
    quiltedLeather,
    contactShadow,
    sparkleSprite,
    dispose: () => {
      runwayTile.dispose();
      barrierStripe.dispose();
      quiltedLeather.dispose();
      contactShadow.dispose();
      sparkleSprite.dispose();
    },
  };
}
