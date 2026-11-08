import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ClassroomFrame, CameraPreset, ClassroomTheme } from '../types/classroom';
import { THEME_CONFIGS } from '../data/defaultClassroom';
import { buildClassroomEnvironment, ClassroomMeshes } from './classroomModels';
import { ScreenUnit } from './ScreenUnit';

// Pre-allocated vectors for zero-garbage collection in tick loop
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

export interface ClassroomSceneCallbacks {
  onSelectFrame: (frame: ClassroomFrame) => void;
  onHoverFrame: (frame: ClassroomFrame | null) => void;
}

export class ClassroomScene {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  private isSoftwareGl: boolean;
  private animFrameId: number = 0;
  private clock: THREE.Clock;
  private environmentMeshes: ClassroomMeshes;
  private screenUnits: Map<string, ScreenUnit> = new Map();
  private callbacks: ClassroomSceneCallbacks;

  // Camera & Navigation state
  private isMouseDown: boolean = false;
  private mousePrevX: number = 0;
  private mousePrevY: number = 0;
  private camYaw: number = 0;
  private camPitch: number = 0;
  private camTargetLook: THREE.Vector3 = new THREE.Vector3(0, 2.8, -1.0);
  private keysPressed: Record<string, boolean> = {};

  private selectedFrameId: string | null = null;
  private hoveredScreenUnit: ScreenUnit | null = null;
  private lastRaycastTime: number = 0;

  constructor(container: HTMLElement, initialFrames: ClassroomFrame[], callbacks: ClassroomSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Detect software WebGL as per guidelines
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    // WebXR preparation
    if ('xr' in navigator) {
      this.renderer.xr.enabled = true;
    }

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdbeafe);
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 4.8, 9.5);
    _targetCamPos.copy(this.camera.position);
    _targetLookAt.set(0, 2.8, -1.0);
    _currentLookAt.copy(_targetLookAt);
    this.camera.lookAt(_currentLookAt);

    // 4. Room Environment Reflection
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 5. Studio Lighting Rig
    this.setupLighting();

    // 6. Build Classroom Architecture & Props
    this.environmentMeshes = buildClassroomEnvironment(this.renderer);
    this.scene.add(this.environmentMeshes.rootGroup);

    // 7. Add Screen Units for all frames
    this.setFrames(initialFrames);

    // 8. Event listeners
    this.attachEventListeners();

    // 9. Start render loop
    this.tick = this.tick.bind(this);
    this.tick();
  }

  private setupLighting() {
    // Warm Key Light coming from left classroom windows
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    keyLight.position.set(-10, 8, 2);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      const d = 14;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // Cool Sky / Warm Ground Hemisphere fill
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xfef08a, 0.75);
    hemiLight.position.set(0, 7, 0);
    this.scene.add(hemiLight);

    // Subtle Spotlights on key areas
    const boardSpot = new THREE.SpotLight(0x38bdf8, 1.2, 14, Math.PI / 4, 0.4);
    boardSpot.position.set(0, 6.8, -8.0);
    boardSpot.target.position.set(0, 3.2, -11.6);
    this.scene.add(boardSpot);
    this.scene.add(boardSpot.target);

    const gallerySpot = new THREE.SpotLight(0xf472b6, 0.9, 14, Math.PI / 4, 0.4);
    gallerySpot.position.set(-8.0, 6.8, -2.5);
    gallerySpot.target.position.set(-11.6, 3.0, -2.5);
    this.scene.add(gallerySpot);
    this.scene.add(gallerySpot.target);

    const gameSpot = new THREE.SpotLight(0x34d399, 0.9, 14, Math.PI / 4, 0.4);
    gameSpot.position.set(8.0, 6.8, -3.2);
    gameSpot.target.position.set(11.6, 3.0, -3.2);
    this.scene.add(gameSpot);
    this.scene.add(gameSpot.target);
  }

  public setFrames(frames: ClassroomFrame[]) {
    // Retain or create screen units
    const currentIds = new Set(frames.map(f => f.id));

    // Remove deleted
    for (const [id, unit] of this.screenUnits.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(unit.group);
        unit.dispose();
        this.screenUnits.delete(id);
      }
    }

    // Add or update
    frames.forEach(frame => {
      const existing = this.screenUnits.get(frame.id);
      if (existing) {
        existing.updateContent(frame);
        existing.updateTransform(frame.position, frame.rotation, frame.scale);
      } else {
        const unit = new ScreenUnit(frame);
        this.screenUnits.set(frame.id, unit);
        this.scene.add(unit.group);
      }
    });
  }

  public selectFrame(frameId: string | null) {
    this.selectedFrameId = frameId;
    for (const [id, unit] of this.screenUnits.entries()) {
      unit.setSelected(id === frameId);
    }

    if (frameId) {
      const unit = this.screenUnits.get(frameId);
      if (unit) {
        // Smoothly position camera in front of the screen
        const [fx, fy, fz] = unit.frame.position;
        const [rx, ry, rz] = unit.frame.rotation;

        // Calculate offset vector based on rotation
        const forward = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(rx, ry, rz));
        const dist = Math.max(unit.frame.scale[0], unit.frame.scale[1]) * 1.35;

        _targetCamPos.set(fx + forward.x * dist, Math.max(1.8, fy), fz + forward.z * dist);
        _targetLookAt.set(fx, fy, fz);
      }
    }
  }

  public updateTheme(theme: ClassroomTheme, bannerText?: string) {
    const themeCfg = THEME_CONFIGS[theme] || THEME_CONFIGS.future_blue;
    if (themeCfg) {
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.setHex(themeCfg.fogColorHex);
      } else {
        this.scene.background = new THREE.Color(themeCfg.fogColorHex);
      }
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.setHex(themeCfg.fogColorHex);
      }
    }
    this.environmentMeshes.updateTheme(theme, bannerText);
  }

  public setCameraPreset(preset: CameraPreset) {
    switch (preset) {
      case 'overview':
        _targetCamPos.set(0, 5.0, 9.5);
        _targetLookAt.set(0, 2.8, -1.0);
        break;
      case 'smart_board':
        _targetCamPos.set(0, 3.2, -4.5);
        _targetLookAt.set(0, 3.2, -11.6);
        break;
      case 'image_gallery':
        _targetCamPos.set(-6.5, 3.0, -2.5);
        _targetLookAt.set(-11.6, 3.0, -2.5);
        break;
      case 'video_theater':
        _targetCamPos.set(5.5, 3.0, 5.5);
        _targetLookAt.set(10.5, 3.2, 7.5);
        break;
      case 'game_zone':
        _targetCamPos.set(6.5, 3.0, -3.2);
        _targetLookAt.set(11.6, 3.0, -3.2);
        break;
      case 'resource_library':
        _targetCamPos.set(-5.6, 3.0, 6.0);
        _targetLookAt.set(-5.6, 3.0, 11.6);
        break;
      case 'teacher_podium':
        _targetCamPos.set(2.8, 2.5, -7.0);
        _targetLookAt.set(0, 2.2, 0);
        break;
    }
  }

  private attachEventListeners() {
    const el = this.renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.mousePrevX = e.clientX;
        this.mousePrevY = e.clientY;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      // Raycasting hover check (throttled to 25ms)
      const now = performance.now();
      if (now - this.lastRaycastTime > 25) {
        this.lastRaycastTime = now;
        const rect = el.getBoundingClientRect();
        _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        _raycaster.setFromCamera(_mouse, this.camera);
        const hitTargets: THREE.Object3D[] = [];
        this.screenUnits.forEach(u => hitTargets.push(u.hitProxyMesh));

        const intersects = _raycaster.intersectObjects(hitTargets, false);
        if (intersects.length > 0) {
          const unit = (intersects[0].object.userData as { screenUnit: ScreenUnit }).screenUnit;
          if (this.hoveredScreenUnit !== unit) {
            if (this.hoveredScreenUnit) this.hoveredScreenUnit.setHovered(false);
            this.hoveredScreenUnit = unit;
            unit.setHovered(true);
            el.style.cursor = 'pointer';
            this.callbacks.onHoverFrame(unit.frame);
          }
        } else {
          if (this.hoveredScreenUnit) {
            this.hoveredScreenUnit.setHovered(false);
            this.hoveredScreenUnit = null;
            el.style.cursor = 'default';
            this.callbacks.onHoverFrame(null);
          }
        }
      }

      if (!this.isMouseDown) return;

      const dx = e.clientX - this.mousePrevX;
      const dy = e.clientY - this.mousePrevY;
      this.mousePrevX = e.clientX;
      this.mousePrevY = e.clientY;

      // Orbit rotation around current lookAt
      const rotSpeed = 0.005;
      const offset = new THREE.Vector3().subVectors(this.camera.position, _currentLookAt);

      const radius = offset.length();
      let theta = Math.atan2(offset.x, offset.z);
      let phi = Math.acos(Math.min(Math.max(offset.y / radius, -1), 1));

      theta -= dx * rotSpeed;
      phi -= dy * rotSpeed;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi));

      offset.x = radius * Math.sin(phi) * Math.sin(theta);
      offset.y = radius * Math.cos(phi);
      offset.z = radius * Math.sin(phi) * Math.cos(theta);

      _targetCamPos.copy(_currentLookAt).add(offset);
      // Clamp bounds
      _targetCamPos.x = Math.max(-10.5, Math.min(10.5, _targetCamPos.x));
      _targetCamPos.z = Math.max(-10.5, Math.min(10.5, _targetCamPos.z));
      _targetCamPos.y = Math.max(1.2, Math.min(6.2, _targetCamPos.y));
    };

    const onMouseUp = (e: MouseEvent) => {
      if (this.isMouseDown && Math.abs(e.clientX - this.mousePrevX) < 4 && Math.abs(e.clientY - this.mousePrevY) < 4) {
        // Click raycasting
        const rect = el.getBoundingClientRect();
        _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        _raycaster.setFromCamera(_mouse, this.camera);
        const hitTargets: THREE.Object3D[] = [];
        this.screenUnits.forEach(u => hitTargets.push(u.hitProxyMesh));

        const intersects = _raycaster.intersectObjects(hitTargets, false);
        if (intersects.length > 0) {
          const unit = (intersects[0].object.userData as { screenUnit: ScreenUnit }).screenUnit;
          this.selectFrame(unit.frame.id);
          this.callbacks.onSelectFrame(unit.frame);
        }
      }
      this.isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDir = new THREE.Vector3().subVectors(_currentLookAt, this.camera.position).normalize();
      const zoomDist = e.deltaY * 0.005;
      _targetCamPos.addScaledVector(zoomDir, zoomDist);

      // Clamp distance
      _targetCamPos.x = Math.max(-10.5, Math.min(10.5, _targetCamPos.x));
      _targetCamPos.z = Math.max(-10.5, Math.min(10.5, _targetCamPos.z));
      _targetCamPos.y = Math.max(1.2, Math.min(6.2, _targetCamPos.y));
    };

    // Keyboard WASD walk controls
    const onKeyDown = (e: KeyboardEvent) => {
      this.keysPressed[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keysPressed[e.key.toLowerCase()] = false;
    };

    const onResize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);

    // Save cleanup references
    (this as unknown as { _cleanup: () => void })._cleanup = () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
    };
  }

  private handleKeyboardWalk(delta: number) {
    const moveSpeed = 6.0 * delta;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();

    let moved = false;
    if (this.keysPressed['w'] || this.keysPressed['arrowup']) {
      _targetCamPos.addScaledVector(forward, moveSpeed);
      _targetLookAt.addScaledVector(forward, moveSpeed);
      moved = true;
    }
    if (this.keysPressed['s'] || this.keysPressed['arrowdown']) {
      _targetCamPos.addScaledVector(forward, -moveSpeed);
      _targetLookAt.addScaledVector(forward, -moveSpeed);
      moved = true;
    }
    if (this.keysPressed['a'] || this.keysPressed['arrowleft']) {
      _targetCamPos.addScaledVector(right, -moveSpeed);
      _targetLookAt.addScaledVector(right, -moveSpeed);
      moved = true;
    }
    if (this.keysPressed['d'] || this.keysPressed['arrowright']) {
      _targetCamPos.addScaledVector(right, moveSpeed);
      _targetLookAt.addScaledVector(right, moveSpeed);
      moved = true;
    }

    if (moved) {
      _targetCamPos.x = Math.max(-10.5, Math.min(10.5, _targetCamPos.x));
      _targetCamPos.z = Math.max(-10.5, Math.min(10.5, _targetCamPos.z));
      _targetCamPos.y = Math.max(1.2, Math.min(6.2, _targetCamPos.y));
    }
  }

  public tick() {
    this.animFrameId = requestAnimationFrame(this.tick);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Keyboard walk movement
    this.handleKeyboardWalk(delta);

    // 2. Exponential smooth damping for camera position & lookAt
    const dampLambda = 7.0;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _targetCamPos.x, dampLambda, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _targetCamPos.y, dampLambda, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _targetCamPos.z, dampLambda, delta);

    _currentLookAt.x = THREE.MathUtils.damp(_currentLookAt.x, _targetLookAt.x, dampLambda, delta);
    _currentLookAt.y = THREE.MathUtils.damp(_currentLookAt.y, _targetLookAt.y, dampLambda, delta);
    _currentLookAt.z = THREE.MathUtils.damp(_currentLookAt.z, _targetLookAt.z, dampLambda, delta);

    this.camera.lookAt(_currentLookAt);

    // 3. Subtle dynamic animations
    // Rotate 3D globe slowly
    if (this.environmentMeshes.globeGroup) {
      this.environmentMeshes.globeGroup.rotation.y += delta * 0.25;
    }
    // Rotate hanging planetary mobile slowly
    if (this.environmentMeshes.planetaryGroup) {
      this.environmentMeshes.planetaryGroup.rotation.y += delta * 0.15;
    }

    // 4. Update wall clock every 1 second
    const now = new Date();
    this.environmentMeshes.updateClock(now.getHours(), now.getMinutes(), now.getSeconds());

    // 5. Render WebGL scene
    this.renderer.render(this.scene, this.camera);
  }

  public toggleVR() {
    if (!('xr' in navigator)) {
      alert('Thiết bị hoặc trình duyệt hiện tại chưa hỗ trợ WebXR VR.');
      return;
    }
    // Check if session supported
    (navigator as unknown as { xr: { isSessionSupported: (mode: string) => Promise<boolean> } }).xr
      .isSessionSupported('immersive-vr')
      .then(supported => {
        if (supported) {
          // Request VR session
          (navigator as unknown as { xr: { requestSession: (mode: string) => Promise<XRSession> } }).xr
            .requestSession('immersive-vr')
            .then(session => {
              this.renderer.xr.setSession(session);
            })
            .catch(err => {
              console.error('Không thể bắt đầu phiên VR:', err);
            });
        } else {
          alert('Thiết bị không hỗ trợ phiên VR thực tế ảo (Immersive VR).');
        }
      })
      .catch(() => {
        alert('Trình duyệt chưa bật tính năng WebXR VR.');
      });
  }

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    if ((this as unknown as { _cleanup?: () => void })._cleanup) {
      (this as unknown as { _cleanup: () => void })._cleanup();
    }
    this.screenUnits.forEach(u => u.dispose());
    this.screenUnits.clear();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
