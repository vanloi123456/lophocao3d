import * as THREE from 'three';
import { ClassroomFrame } from '../types/classroom';
import { ZONE_CONFIGS } from '../data/defaultClassroom';
import { renderScreenCanvas } from './proceduralTextures';

export class ScreenUnit {
  public group: THREE.Group;
  public frame: ClassroomFrame;
  public screenMesh: THREE.Mesh;
  public bezelMesh: THREE.Mesh;
  public glowMesh: THREE.Mesh;
  public hitProxyMesh: THREE.Mesh;

  private canvasTexture: THREE.CanvasTexture;
  private videoElement: HTMLVideoElement | null = null;
  private videoTexture: THREE.VideoTexture | null = null;
  private imageElement: HTMLImageElement | null = null;
  private isHovered: boolean = false;
  private isSelected: boolean = false;
  private baseColor: THREE.Color;

  constructor(frame: ClassroomFrame) {
    this.frame = frame;
    this.group = new THREE.Group();
    this.group.name = `ScreenUnit_${frame.id}`;
    this.group.position.set(...frame.position);
    this.group.rotation.set(...frame.rotation);

    const zoneCfg = ZONE_CONFIGS[frame.zone] || ZONE_CONFIGS.smart_board;
    this.baseColor = new THREE.Color(zoneCfg.color);

    const [w, h, d] = frame.scale;

    // 1. Sleek metallic titanium bezel
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    this.bezelMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bezelMat);
    this.bezelMesh.castShadow = true;
    this.bezelMesh.receiveShadow = true;
    this.group.add(this.bezelMesh);

    // 2. LED Edge rim glow
    const glowMat = new THREE.MeshBasicMaterial({
      color: this.baseColor,
      transparent: true,
      opacity: 0.4,
    });
    this.glowMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, d * 0.5), glowMat);
    this.glowMesh.position.z = -0.02;
    this.group.add(this.glowMesh);

    // 3. Screen display quad
    const initialCanvas = renderScreenCanvas(frame.title, frame.zone, zoneCfg.color, false);
    this.canvasTexture = new THREE.CanvasTexture(initialCanvas);
    this.canvasTexture.colorSpace = THREE.SRGBColorSpace;

    const screenMat = new THREE.MeshBasicMaterial({
      map: this.canvasTexture,
    });
    // Offset screen quad slightly forward so there's no Z-fighting
    this.screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.12, h - 0.12), screenMat);
    this.screenMesh.position.z = d / 2 + 0.005;
    this.group.add(this.screenMesh);

    // 4. Invisible hit proxy for raycasting
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitProxyMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, h + 0.2, d + 0.2), hitMat);
    this.hitProxyMesh.userData = { frameId: frame.id, screenUnit: this };
    this.group.add(this.hitProxyMesh);

    // Preload content if available
    this.updateContent(frame);
  }

  public updateContent(newFrame: ClassroomFrame) {
    this.frame = newFrame;
    const zoneCfg = ZONE_CONFIGS[newFrame.zone] || ZONE_CONFIGS.smart_board;
    this.baseColor.set(zoneCfg.color);

    // Clean up previous video if any
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement = null;
    }
    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }

    const hasImage = Boolean(newFrame.content.imageUrl);
    const hasVideo = Boolean(newFrame.content.videoUrl);
    const hasGame = Boolean(newFrame.content.embedCode);
    const hasDoc = Boolean(newFrame.content.docUrl);
    const hasAnyContent = hasImage || hasVideo || hasGame || hasDoc;

    if (hasImage && newFrame.content.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageElement = img;
        const populatedCanvas = renderScreenCanvas(newFrame.title, newFrame.zone, zoneCfg.color, true, {
          imageObj: img,
        });
        this.canvasTexture.image = populatedCanvas;
        this.canvasTexture.needsUpdate = true;
        this.screenMesh.material = new THREE.MeshBasicMaterial({ map: this.canvasTexture });
      };
      img.src = newFrame.content.imageUrl;
    } else if (hasVideo && newFrame.content.videoUrl) {
      // Create HTML5 Video Texture if direct MP4/WebM
      const vUrl = newFrame.content.videoUrl;
      const isDirectVideo = vUrl.startsWith('data:video') || vUrl.endsWith('.mp4') || vUrl.endsWith('.webm') || vUrl.includes('blob:');

      if (isDirectVideo) {
        const vid = document.createElement('video');
        vid.src = vUrl;
        vid.crossOrigin = 'anonymous';
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        vid.autoplay = true;
        vid.play().catch(() => {});
        this.videoElement = vid;

        this.videoTexture = new THREE.VideoTexture(vid);
        this.videoTexture.colorSpace = THREE.SRGBColorSpace;
        this.screenMesh.material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
      } else {
        // Fallback display card for external video links
        const populatedCanvas = renderScreenCanvas(newFrame.title, newFrame.zone, zoneCfg.color, true, {
          videoTitle: newFrame.content.videoName || newFrame.title,
        });
        this.canvasTexture.image = populatedCanvas;
        this.canvasTexture.needsUpdate = true;
        this.screenMesh.material = new THREE.MeshBasicMaterial({ map: this.canvasTexture });
      }
    } else if (hasGame) {
      const populatedCanvas = renderScreenCanvas(newFrame.title, newFrame.zone, zoneCfg.color, true, {
        gameTitle: newFrame.title,
      });
      this.canvasTexture.image = populatedCanvas;
      this.canvasTexture.needsUpdate = true;
      this.screenMesh.material = new THREE.MeshBasicMaterial({ map: this.canvasTexture });
    } else if (hasDoc) {
      const populatedCanvas = renderScreenCanvas(newFrame.title, newFrame.zone, zoneCfg.color, true, {
        docTitle: newFrame.content.docTitle || newFrame.title,
      });
      this.canvasTexture.image = populatedCanvas;
      this.canvasTexture.needsUpdate = true;
      this.screenMesh.material = new THREE.MeshBasicMaterial({ map: this.canvasTexture });
    } else {
      // EMPTY STATE: Strict requirement: render clean "+ Thêm nội dung" canvas!
      const emptyCanvas = renderScreenCanvas(newFrame.title, newFrame.zone, zoneCfg.color, false);
      this.canvasTexture.image = emptyCanvas;
      this.canvasTexture.needsUpdate = true;
      this.screenMesh.material = new THREE.MeshBasicMaterial({ map: this.canvasTexture });
    }
  }

  public setHovered(hovered: boolean) {
    if (this.isHovered === hovered) return;
    this.isHovered = hovered;
    this.updateGlow();
  }

  public setSelected(selected: boolean) {
    if (this.isSelected === selected) return;
    this.isSelected = selected;
    this.updateGlow();
  }

  private updateGlow() {
    const mat = this.glowMesh.material as THREE.MeshBasicMaterial;
    if (this.isSelected) {
      mat.color.set(0x38bdf8); // Bright sky blue highlight
      mat.opacity = 0.9;
    } else if (this.isHovered) {
      mat.color.copy(this.baseColor);
      mat.opacity = 0.75;
    } else {
      mat.color.copy(this.baseColor);
      mat.opacity = 0.35;
    }
  }

  public updateTransform(position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) {
    this.frame.position = position;
    this.frame.rotation = rotation;
    this.frame.scale = scale;

    this.group.position.set(...position);
    this.group.rotation.set(...rotation);

    const [w, h, d] = scale;
    this.bezelMesh.geometry.dispose();
    this.bezelMesh.geometry = new THREE.BoxGeometry(w, h, d);

    this.glowMesh.geometry.dispose();
    this.glowMesh.geometry = new THREE.BoxGeometry(w + 0.08, h + 0.08, d * 0.5);

    this.screenMesh.geometry.dispose();
    this.screenMesh.geometry = new THREE.PlaneGeometry(w - 0.12, h - 0.12);
    this.screenMesh.position.z = d / 2 + 0.005;

    this.hitProxyMesh.geometry.dispose();
    this.hitProxyMesh.geometry = new THREE.BoxGeometry(w + 0.2, h + 0.2, d + 0.2);
  }

  public dispose() {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement = null;
    }
    if (this.videoTexture) {
      this.videoTexture.dispose();
    }
    this.canvasTexture.dispose();
    this.screenMesh.geometry.dispose();
    this.bezelMesh.geometry.dispose();
    this.glowMesh.geometry.dispose();
    this.hitProxyMesh.geometry.dispose();
  }
}
