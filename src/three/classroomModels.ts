import * as THREE from 'three';
import {
  createParquetFloorTexture,
  createGardenViewTexture,
  createBannerTexture,
  createClockTexture,
} from './proceduralTextures';
import { THEME_CONFIGS } from '../data/defaultClassroom';

export interface ClassroomMeshes {
  rootGroup: THREE.Group;
  clockMesh: THREE.Mesh;
  globeGroup: THREE.Group;
  planetaryGroup: THREE.Group;
  updateClock: (h: number, m: number, s: number) => void;
  updateTheme: (theme: import('../types/classroom').ClassroomTheme, bannerText?: string) => void;
}

/**
 * Builds the complete 3D classroom architectural environment.
 * Complies with Three.js skill: composite 3-12 part groups, varied roughness/metalness, grounded bottom-center pivots.
 */
export function buildClassroomEnvironment(renderer: THREE.WebGLRenderer): ClassroomMeshes {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ClassroomEnvironment';

  const roomW = 24;  // -12 to +12
  const roomL = 24;  // -12 to +12
  const roomH = 7.0; // 0 to 7.0

  // 1. FLOOR
  const floorGeo = new THREE.PlaneGeometry(roomW, roomL);
  const floorTex = createParquetFloorTexture(renderer);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.35,
    metalness: 0.05,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  rootGroup.add(floorMesh);

  // 2. CEILING
  const ceilingGeo = new THREE.PlaneGeometry(roomW, roomL);
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.9,
    metalness: 0.0,
  });
  const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceilingMesh.position.y = roomH;
  ceilingMesh.rotation.x = Math.PI / 2;
  rootGroup.add(ceilingMesh);

  // Modern ceiling LED panels
  const ledPanelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ledFrameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
  for (let x = -6; x <= 6; x += 6) {
    for (let z = -6; z <= 6; z += 6) {
      const ledGroup = new THREE.Group();
      ledGroup.position.set(x, roomH - 0.05, z);

      const panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.2), ledPanelMat);
      panelMesh.rotation.x = Math.PI / 2;
      ledGroup.add(panelMesh);

      const rimMesh = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.08, 1.4), ledFrameMat);
      ledGroup.add(rimMesh);

      rootGroup.add(ledGroup);
    }
  }

  // 3. WALLS
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe, // Soft soothing sky blue
    roughness: 0.85,
    metalness: 0.05,
  });
  const wainscotMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Crisp clean white lower wainscoting
    roughness: 0.5,
  });
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant blue accent baseboard
    roughness: 0.3,
  });

  // FRONT WALL (z = -12)
  const frontWallGroup = new THREE.Group();
  const frontMain = new THREE.Mesh(new THREE.BoxGeometry(roomW, roomH - 1.2, 0.2), wallMat);
  frontMain.position.set(0, (roomH + 1.2) / 2, -roomL / 2);
  frontWallGroup.add(frontMain);

  const frontWainscot = new THREE.Mesh(new THREE.BoxGeometry(roomW, 1.2, 0.22), wainscotMat);
  frontWainscot.position.set(0, 0.6, -roomL / 2);
  frontWallGroup.add(frontWainscot);

  const frontBaseboard = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.2, 0.26), baseboardMat);
  frontBaseboard.position.set(0, 0.1, -roomL / 2);
  frontWallGroup.add(frontBaseboard);
  rootGroup.add(frontWallGroup);

  // REAR WALL (z = +12)
  const rearWallGroup = new THREE.Group();
  const rearMain = new THREE.Mesh(new THREE.BoxGeometry(roomW, roomH - 1.2, 0.2), wallMat);
  rearMain.position.set(0, (roomH + 1.2) / 2, roomL / 2);
  rearWallGroup.add(rearMain);

  const rearWainscot = new THREE.Mesh(new THREE.BoxGeometry(roomW, 1.2, 0.22), wainscotMat);
  rearWainscot.position.set(0, 0.6, roomL / 2);
  rearWallGroup.add(rearWainscot);

  const rearBaseboard = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.2, 0.26), baseboardMat);
  rearBaseboard.position.set(0, 0.1, roomL / 2);
  rearWallGroup.add(rearBaseboard);
  rootGroup.add(rearWallGroup);

  // RIGHT WALL (x = +12)
  const rightWallGroup = new THREE.Group();
  const rightMain = new THREE.Mesh(new THREE.BoxGeometry(0.2, roomH - 1.2, roomL), wallMat);
  rightMain.position.set(roomW / 2, (roomH + 1.2) / 2, 0);
  rightWallGroup.add(rightMain);

  const rightWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.2, roomL), wainscotMat);
  rightWainscot.position.set(roomW / 2, 0.6, 0);
  rightWallGroup.add(rightWainscot);

  const rightBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, roomL), baseboardMat);
  rightBaseboard.position.set(roomW / 2, 0.1, 0);
  rightWallGroup.add(rightBaseboard);
  rootGroup.add(rightWallGroup);

  // LEFT WALL (x = -12) with Large Panoramic Window opening onto garden!
  const leftWallGroup = new THREE.Group();
  // Solid upper and lower sections
  const leftLower = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.2, roomL), wainscotMat);
  leftLower.position.set(-roomW / 2, 0.6, 0);
  leftWallGroup.add(leftLower);

  const leftUpper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, roomL), wallMat);
  leftUpper.position.set(-roomW / 2, roomH - 0.6, 0);
  leftWallGroup.add(leftUpper);

  // Window mullions & frames
  const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const windowGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.1,
  });

  const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(roomL - 2, roomH - 2.6), windowGlassMat);
  winGlass.position.set(-roomW / 2 + 0.05, 3.4, 0);
  winGlass.rotation.y = Math.PI / 2;
  leftWallGroup.add(winGlass);

  // Vertical frame bars
  for (let z = -9; z <= 9; z += 3.6) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.18, roomH - 2.4, 0.12), windowFrameMat);
    bar.position.set(-roomW / 2 + 0.06, 3.4, z);
    leftWallGroup.add(bar);
  }
  rootGroup.add(leftWallGroup);

  // Outside Garden Panorama Backdrop
  const gardenTex = createGardenViewTexture();
  const gardenMat = new THREE.MeshBasicMaterial({ map: gardenTex, side: THREE.DoubleSide });
  const gardenMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomL + 6, 12), gardenMat);
  gardenMesh.position.set(-roomW / 2 - 2.5, 4.5, 0);
  gardenMesh.rotation.y = Math.PI / 2;
  rootGroup.add(gardenMesh);

  // 4. TEACHER'S STAGE & PODIUM
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, 0, -9.8);

  // Raised wooden platform (Primary silhouette)
  const platformGeo = new THREE.BoxGeometry(9.6, 0.25, 3.2);
  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.3,
    metalness: 0.1,
  });
  const platformMesh = new THREE.Mesh(platformGeo, platformMat);
  platformMesh.position.y = 0.125;
  platformMesh.receiveShadow = true;
  platformMesh.castShadow = true;
  stageGroup.add(platformMesh);

  // Teacher's modern curved podium desk (3-12 parts)
  const podiumGroup = new THREE.Group();
  podiumGroup.position.set(2.8, 0.25, 0);

  // Podium base
  const podBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.6, 0.1, 24),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.2 })
  );
  podBase.position.y = 0.05;
  podBase.castShadow = true;
  podiumGroup.add(podBase);

  // Podium pillar
  const podPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 1.05, 24),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  podPillar.position.y = 0.6;
  podPillar.castShadow = true;
  podiumGroup.add(podPillar);

  // Podium desk top
  const podTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.08, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2, metalness: 0.2 })
  );
  podTop.position.set(0, 1.15, 0);
  podTop.rotation.x = 0.15;
  podiumGroup.add(podTop);

  // Tablet device prop on podium
  const tabletMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.02, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 })
  );
  tabletMesh.position.set(0, 1.2, 0);
  tabletMesh.rotation.x = 0.15;
  podiumGroup.add(tabletMesh);

  const tabletScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.27),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  tabletScreen.position.set(0, 1.215, 0);
  tabletScreen.rotation.x = -Math.PI / 2 + 0.15;
  podiumGroup.add(tabletScreen);

  stageGroup.add(podiumGroup);

  // Teacher swivel chair
  const chairGroup = new THREE.Group();
  chairGroup.position.set(2.8, 0.25, -0.9);
  const chairBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.4, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 })
  );
  chairBase.position.y = 0.04;
  chairGroup.add(chairBase);

  const chairSeat = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.1, 0.65),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 })
  );
  chairSeat.position.y = 0.55;
  chairGroup.add(chairSeat);

  const chairBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.6, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 })
  );
  chairBack.position.set(0, 0.9, -0.3);
  chairGroup.add(chairBack);

  stageGroup.add(chairGroup);
  rootGroup.add(stageGroup);

  // 5. STUDENT DESK AND CHAIR CLUSTERS (8 clusters)
  const deskTopMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }); // Cute pastel warm yellow wood
  const deskLegMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4, roughness: 0.3 }); // Sky blue frame
  const studentChairSeatMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.5 });

  const deskPositions: [number, number][] = [
    [-4.5, -4.5], [-1.5, -4.5], [1.5, -4.5], [4.5, -4.5],
    [-4.5, -0.5], [-1.5, -0.5], [1.5, -0.5], [4.5, -0.5],
  ];

  deskPositions.forEach(([dx, dz]) => {
    const cluster = new THREE.Group();
    cluster.position.set(dx, 0, dz);

    // Desk Top (1.1m x 0.65m)
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.7), deskTopMat);
    deskTop.position.y = 0.76;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    cluster.add(deskTop);

    // 4 Steel legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.74, 12);
    const legOffsets = [
      [-0.52, 0.37, -0.27],
      [0.52, 0.37, -0.27],
      [-0.52, 0.37, 0.27],
      [0.52, 0.37, 0.27],
    ];
    legOffsets.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, deskLegMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      cluster.add(leg);
    });

    // Pencil holder prop on desk
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.045, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 })
    );
    pot.position.set(0.4, 0.85, -0.15);
    cluster.add(pot);

    // Mini notebook prop
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.02, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 })
    );
    book.position.set(-0.2, 0.8, 0);
    book.rotation.y = 0.15;
    cluster.add(book);

    // Student Chair tucked in behind desk
    const chair = new THREE.Group();
    chair.position.set(0, 0, 0.65);

    const sSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.45), studentChairSeatMat);
    sSeat.position.y = 0.45;
    chair.add(sSeat);

    const sBack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.05), studentChairSeatMat);
    sBack.position.set(0, 0.72, 0.2);
    chair.add(sBack);

    // Chair legs
    const cLegGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.44, 10);
    const cLegOffsets = [
      [-0.2, 0.22, -0.18],
      [0.2, 0.22, -0.18],
      [-0.2, 0.22, 0.18],
      [0.2, 0.22, 0.18],
    ];
    cLegOffsets.forEach(([cx, cy, cz]) => {
      const leg = new THREE.Mesh(cLegGeo, deskLegMat);
      leg.position.set(cx, cy, cz);
      chair.add(leg);
    });

    cluster.add(chair);
    rootGroup.add(cluster);
  });

  // 6. BOOKSHELF UNIT & PROPS
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(-11.4, 0, 8.0);
  shelfGroup.rotation.y = Math.PI / 2;

  const shelfWoodMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
  // Outer frame
  const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.8, 0.1), shelfWoodMat);
  shelfBack.position.set(0, 1.9, -0.2);
  shelfGroup.add(shelfBack);

  // Shelves horizontal
  for (let y = 0.2; y <= 3.6; y += 0.8) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.06, 0.6), shelfWoodMat);
    plank.position.set(0, y, 0.1);
    shelfGroup.add(plank);
  }

  // Colorful procedural 3D books on shelves
  const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x06b6d4];
  for (let s = 1; s <= 3; s++) {
    const sy = s * 0.8 + 0.03;
    let bx = -1.8;
    while (bx < 1.6) {
      const bW = 0.06 + Math.random() * 0.05;
      const bH = 0.4 + Math.random() * 0.2;
      const bD = 0.35 + Math.random() * 0.08;
      const color = bookColors[Math.floor(Math.random() * bookColors.length)];

      const bookMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bW, bH, bD),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
      );
      bookMesh.position.set(bx, sy + bH / 2, 0.1);
      shelfGroup.add(bookMesh);
      bx += bW + 0.02;
    }
  }

  // Potted indoor plant on top of shelf
  const plantPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.16, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  plantPot.position.set(1.4, 3.75, 0.1);
  shelfGroup.add(plantPot);

  const foliageGeo = new THREE.DodecahedronGeometry(0.3, 1);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
  const foliageMesh = new THREE.Mesh(foliageGeo, foliageMat);
  foliageMesh.position.set(1.4, 4.05, 0.1);
  shelfGroup.add(foliageMesh);

  rootGroup.add(shelfGroup);

  // 7. INTERACTIVE GLOBE ON BRASS STAND
  const globeGroup = new THREE.Group();
  globeGroup.position.set(-6.5, 0, -9.5);

  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
  const globeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 24), brassMat);
  globeBase.position.y = 0.04;
  globeGroup.add(globeBase);

  const globePole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16), brassMat);
  globePole.position.y = 0.44;
  globeGroup.add(globePole);

  const globeSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4, metalness: 0.1 })
  );
  globeSphere.position.set(0, 0.95, 0);
  globeSphere.rotation.z = 0.41; // 23.5 degrees tilt
  globeGroup.add(globeSphere);
  rootGroup.add(globeGroup);

  // 8. HANGING PLANETARY MOBILE
  const planetaryGroup = new THREE.Group();
  planetaryGroup.position.set(0, roomH - 1.2, 0);

  // Brass hanging ring
  const ringMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.03, 12, 32),
    brassMat
  );
  ringMesh.rotation.x = Math.PI / 2;
  planetaryGroup.add(ringMesh);

  // Center Sun
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
  );
  planetaryGroup.add(sunMesh);

  // Orbiting planets
  const planetsData = [
    { r: 0.6, dist: 0.8, color: 0xef4444 }, // Mars-like
    { r: 0.8, dist: 1.2, color: 0x38bdf8 }, // Earth-like
    { r: 1.1, dist: 1.6, color: 0xf59e0b }, // Saturn-like
  ];
  planetsData.forEach((p, idx) => {
    const angle = (idx / planetsData.length) * Math.PI * 2;
    const px = Math.cos(angle) * p.dist;
    const pz = Math.sin(angle) * p.dist;

    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 * p.r, 16, 16),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.3 })
    );
    pMesh.position.set(px, -0.2 * (idx + 1), pz);
    planetaryGroup.add(pMesh);
  });
  rootGroup.add(planetaryGroup);

  // 9. WALL CLOCK (Front Wall)
  const now = new Date();
  const clockTex = createClockTexture(now.getHours(), now.getMinutes(), now.getSeconds());
  const clockMat = new THREE.MeshBasicMaterial({ map: clockTex });
  const clockMesh = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), clockMat);
  clockMesh.position.set(0, 5.8, -11.85);
  rootGroup.add(clockMesh);

  const updateClock = (h: number, m: number, s: number) => {
    const newTex = createClockTexture(h, m, s);
    clockMesh.material = new THREE.MeshBasicMaterial({ map: newTex });
  };

  // 10. MOTIVATIONAL BANNER (Front Wall above board)
  const bannerTex = createBannerTexture();
  const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex });
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.4), bannerMat);
  bannerMesh.position.set(0, 5.7, -11.8);
  // Place clock slightly to right of banner or center above banner
  clockMesh.position.set(6.2, 5.7, -11.85);
  rootGroup.add(bannerMesh);

  const updateTheme = (theme: import('../types/classroom').ClassroomTheme, bannerText?: string) => {
    const themeCfg = (THEME_CONFIGS as Record<string, import('../types/classroom').ThemeConfig>)[theme] || THEME_CONFIGS.future_blue;
    if (themeCfg) {
      wallMat.color.setHex(themeCfg.wallColorHex);
      wainscotMat.color.setHex(themeCfg.wainscotColorHex);
      baseboardMat.color.setHex(themeCfg.baseboardColorHex);
    }

    const newGardenTex = createGardenViewTexture(theme);
    gardenMesh.material = new THREE.MeshBasicMaterial({ map: newGardenTex, side: THREE.DoubleSide });

    const newBannerTex = createBannerTexture(bannerText || 'LỚP HỌC ẢO 3D – GIÁO VIÊN SÁNG TẠO', theme);
    bannerMesh.material = new THREE.MeshBasicMaterial({ map: newBannerTex });
  };

  return {
    rootGroup,
    clockMesh,
    globeGroup,
    planetaryGroup,
    updateClock,
    updateTheme,
  };
}
