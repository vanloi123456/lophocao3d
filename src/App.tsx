import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ClassroomScene } from './three/ClassroomScene';
import { ClassroomFrame, ClassroomSpace, CameraPreset, UserRole, ZoneType } from './types/classroom';
import {
  loadClassroomSpaces,
  saveClassroomSpaces,
  getSavedActiveSpaceId,
  saveActiveSpaceId
} from './services/storageService';
import { soundService } from './services/audioService';
import { ZONE_CONFIGS } from './data/defaultClassroom';
import { TopHeader } from './components/TopHeader';
import { LeftMenu } from './components/LeftMenu';
import { RoomSpacesModal } from './components/RoomSpacesModal';
import { FrameEditorModal } from './components/FrameEditorModal';
import { FrameViewerModal } from './components/FrameViewerModal';
import { NewFrameModal } from './components/NewFrameModal';
import { ExportImportModal } from './components/ExportImportModal';
import { ControlsHelpModal } from './components/ControlsHelpModal';
import {
  Sliders,
  Maximize2,
  Eraser,
  Trash2,
  X,
  Plus
} from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ClassroomScene | null>(null);

  // Classroom spaces state
  const [spaces, setSpaces] = useState<ClassroomSpace[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [role, setRole] = useState<UserRole>('teacher');
  const roleRef = useRef<UserRole>(role);
  roleRef.current = role;

  // Derive current space and its frames
  const activeSpace = spaces.find((s) => s.id === activeSpaceId) || spaces[0];
  const frames = activeSpace ? activeSpace.frames : [];

  // Interactive selection
  const [selectedFrame, setSelectedFrame] = useState<ClassroomFrame | null>(null);
  const [hoveredFrame, setHoveredFrame] = useState<ClassroomFrame | null>(null);
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>('overview');
  const [selectedZone, setSelectedZone] = useState<ZoneType | 'all'>('all');

  // Modals & HUD state
  const [isSpacesModalOpen, setIsSpacesModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isNewFrameOpen, setIsNewFrameOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  }, []);

  // Initialize and load saved classroom spaces from IndexedDB
  useEffect(() => {
    let active = true;
    loadClassroomSpaces().then((loadedSpaces) => {
      if (!active) return;
      setSpaces(loadedSpaces);
      const savedId = getSavedActiveSpaceId();
      const initialId =
        loadedSpaces.find((s) => s.id === savedId)?.id || loadedSpaces[0]?.id || 'space-1';
      setActiveSpaceId(initialId);
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Initialize Three.js WebGL Scene once mounted and initial space loaded
  useEffect(() => {
    if (!isLoaded || !mountRef.current || !activeSpace) return;

    const scene = new ClassroomScene(mountRef.current, activeSpace.frames, {
      onSelectFrame: (frame) => {
        soundService.playSelect();
        setSelectedFrame(frame);

        const currentRole = roleRef.current;
        const hasContent = Boolean(
          frame.content.imageUrl ||
          frame.content.videoUrl ||
          frame.content.embedCode ||
          frame.content.docUrl
        );

        if (currentRole === 'teacher') {
          // If frame is empty, open editor immediately so teacher can add content right away!
          if (!hasContent) {
            setIsEditorOpen(true);
          }
        } else {
          // Student clicks: open interactive viewer modal!
          setIsViewerOpen(true);
        }
      },
      onHoverFrame: (frame) => {
        setHoveredFrame(frame);
      },
    });

    // Apply the active room's theme and banner text
    scene.updateTheme(activeSpace.theme, activeSpace.bannerText);
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [isLoaded]); // Only run on mount when isLoaded becomes true

  // Switch 3D scene data and theme when active room changes
  useEffect(() => {
    if (!sceneRef.current || !activeSpace) return;
    sceneRef.current.setFrames(activeSpace.frames);
    sceneRef.current.updateTheme(activeSpace.theme, activeSpace.bannerText);
    setSelectedFrame(null);
    sceneRef.current.selectFrame(null);
  }, [activeSpaceId]);

  // Keyboard shortcut listener ('h' to toggle menu, 'Escape' to clear selection)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'h') {
        setIsCollapsed((c) => !c);
      }
      if (e.key === 'Escape') {
        setSelectedFrame(null);
        if (sceneRef.current) {
          sceneRef.current.selectFrame(null);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Camera presets & Navigation handlers
  const handleSelectPreset = useCallback((preset: CameraPreset) => {
    setCurrentPreset(preset);
    if (sceneRef.current) {
      sceneRef.current.setCameraPreset(preset);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    handleSelectPreset('overview');
    setSelectedFrame(null);
    if (sceneRef.current) {
      sceneRef.current.selectFrame(null);
    }
  }, [handleSelectPreset]);

  const handleToggleVR = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.toggleVR();
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    soundService.setMuted(next);
  }, [isMuted]);

  // Helper to update frames in the active space and persist
  const updateActiveSpaceFrames = useCallback(
    (updater: (prevFrames: ClassroomFrame[]) => ClassroomFrame[]) => {
      setSpaces((prevSpaces) => {
        const nextSpaces = prevSpaces.map((sp) => {
          if (sp.id === activeSpaceId) {
            const nextFrames = updater(sp.frames);
            if (sceneRef.current) {
              sceneRef.current.setFrames(nextFrames);
            }
            return {
              ...sp,
              frames: nextFrames,
              updatedAt: Date.now(),
            };
          }
          return sp;
        });
        saveClassroomSpaces(nextSpaces);
        return nextSpaces;
      });
    },
    [activeSpaceId]
  );

  // Frame editing handlers with immediate permanent storage
  const handleSaveFrame = useCallback(
    (updatedFrame: ClassroomFrame) => {
      updateActiveSpaceFrames((prev) =>
        prev.map((f) => (f.id === updatedFrame.id ? updatedFrame : f))
      );
      setSelectedFrame(updatedFrame);
      showToast(`✓ Đã lưu thành công nội dung cho "${updatedFrame.title}"!`);
    },
    [updateActiveSpaceFrames, showToast]
  );

  const handleDeleteFrame = useCallback(
    (frameId: string) => {
      soundService.playDelete();
      updateActiveSpaceFrames((prev) => prev.filter((f) => f.id !== frameId));
      setSelectedFrame(null);
      if (sceneRef.current) {
        sceneRef.current.selectFrame(null);
      }
      showToast('✓ Đã xóa khung khỏi phòng học và cập nhật dữ liệu!');
    },
    [updateActiveSpaceFrames, showToast]
  );

  // Clear content of a frame (reset to empty state)
  const handleClearFrameContent = useCallback(
    (frameId: string) => {
      soundService.playDelete();
      setShowClearConfirm(false);
      updateActiveSpaceFrames((prev) =>
        prev.map((f) => {
          if (f.id === frameId) {
            return {
              ...f,
              content: {},
              updatedAt: Date.now(),
            };
          }
          return f;
        })
      );
      setSelectedFrame((prev) =>
        prev && prev.id === frameId ? { ...prev, content: {} } : prev
      );
      showToast('✓ Đã làm trống nội dung khung và lưu lại!');
    },
    [updateActiveSpaceFrames, showToast]
  );

  const handleAddNewFrame = useCallback(
    (newFrame: ClassroomFrame) => {
      updateActiveSpaceFrames((prev) => [...prev, newFrame]);
      setSelectedFrame(newFrame);
      if (sceneRef.current) {
        sceneRef.current.selectFrame(newFrame.id);
      }
      setIsEditorOpen(true);
      showToast('✓ Đã tạo khung 3D mới và lưu lại!');
    },
    [updateActiveSpaceFrames, showToast]
  );

  // Space management handlers
  const handleSelectSpace = useCallback(
    (spaceId: string) => {
      setActiveSpaceId(spaceId);
      saveActiveSpaceId(spaceId);
      const targetSpace = spaces.find((s) => s.id === spaceId);
      showToast(`✓ Đã chuyển sang: "${targetSpace?.name || 'Phòng học ảo'}"!`);
    },
    [spaces, showToast]
  );

  const handleAddSpace = useCallback(
    (newSpace: ClassroomSpace) => {
      setSpaces((prev) => {
        const next = [...prev, newSpace];
        saveClassroomSpaces(next);
        return next;
      });
      setActiveSpaceId(newSpace.id);
      saveActiveSpaceId(newSpace.id);
      showToast(`✓ Đã tạo không gian phòng học ảo mới: "${newSpace.name}"!`);
    },
    [showToast]
  );

  const handleUpdateSpace = useCallback(
    (updatedSpace: ClassroomSpace) => {
      setSpaces((prev) => {
        const next = prev.map((s) => (s.id === updatedSpace.id ? updatedSpace : s));
        saveClassroomSpaces(next);
        return next;
      });
      if (sceneRef.current && updatedSpace.id === activeSpaceId) {
        sceneRef.current.updateTheme(updatedSpace.theme, updatedSpace.bannerText);
      }
      showToast(`✓ Đã cập nhật thông tin phòng học "${updatedSpace.name}"!`);
    },
    [activeSpaceId, showToast]
  );

  const handleDeleteSpace = useCallback(
    (spaceId: string) => {
      setSpaces((prev) => {
        const next = prev.filter((s) => s.id !== spaceId);
        saveClassroomSpaces(next);
        return next;
      });
      if (activeSpaceId === spaceId) {
        const remaining = spaces.filter((s) => s.id !== spaceId);
        if (remaining.length > 0) {
          setActiveSpaceId(remaining[0].id);
          saveActiveSpaceId(remaining[0].id);
        }
      }
      showToast('✓ Đã xóa không gian phòng học!');
    },
    [activeSpaceId, spaces, showToast]
  );

  // Manual save trigger for the teacher
  const handleManualSave = useCallback(async () => {
    const success = await saveClassroomSpaces(spaces);
    if (success) {
      showToast('✓ Toàn bộ dữ liệu tất cả phòng học ảo đã được lưu vĩnh viễn!');
    } else {
      showToast('Đã lưu dữ liệu vào bộ nhớ dự phòng.');
    }
  }, [spaces, showToast]);

  const handleImportFrames = useCallback(
    (imported: ClassroomFrame[]) => {
      updateActiveSpaceFrames(() => imported);
      setSelectedFrame(null);
      if (sceneRef.current) {
        sceneRef.current.selectFrame(null);
        sceneRef.current.setCameraPreset('overview');
      }
    },
    [updateActiveSpaceFrames]
  );

  const handleImportSpaces = useCallback(
    (importedSpaces: ClassroomSpace[]) => {
      setSpaces(importedSpaces);
      saveClassroomSpaces(importedSpaces);
      if (importedSpaces.length > 0) {
        setActiveSpaceId(importedSpaces[0].id);
        saveActiveSpaceId(importedSpaces[0].id);
      }
      setSelectedFrame(null);
      if (sceneRef.current) {
        sceneRef.current.selectFrame(null);
        sceneRef.current.setCameraPreset('overview');
      }
      showToast(`✓ Đã nạp thành công ${importedSpaces.length} không gian phòng học!`);
    },
    [showToast]
  );

  const handleResetFrames = useCallback(
    (defaults: ClassroomFrame[]) => {
      updateActiveSpaceFrames(() => defaults);
      setSelectedFrame(null);
      if (sceneRef.current) {
        sceneRef.current.selectFrame(null);
        sceneRef.current.setCameraPreset('overview');
      }
    },
    [updateActiveSpaceFrames]
  );

  const selectedZoneCfg = selectedFrame ? ZONE_CONFIGS[selectedFrame.zone] : null;
  const selectedHasContent = Boolean(
    selectedFrame?.content.imageUrl ||
    selectedFrame?.content.videoUrl ||
    selectedFrame?.content.embedCode ||
    selectedFrame?.content.docUrl
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 1. Dedicated WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2. Top Header Overlay */}
      <TopHeader
        role={role}
        onRoleChange={setRole}
        onOpenNewFrame={() => setIsNewFrameOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onResetCamera={handleResetCamera}
        onToggleVR={handleToggleVR}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        selectedZone={selectedZone}
        onFilterZone={setSelectedZone}
        isLeftMenuCollapsed={isCollapsed}
        onToggleLeftMenu={() => setIsCollapsed(!isCollapsed)}
        onManualSave={handleManualSave}
        activeSpaceName={activeSpace?.name}
        onOpenSpacesModal={() => setIsSpacesModalOpen(true)}
      />

      {/* Floating Save Notification Toast */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm font-semibold shadow-2xl shadow-emerald-950/80 backdrop-blur-md">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 3. Left Side Navigation & Action Menu */}
      <LeftMenu
        currentPreset={currentPreset}
        onSelectPreset={handleSelectPreset}
        selectedFrame={selectedFrame}
        hoveredFrame={hoveredFrame}
        onEditSelectedFrame={() => setIsEditorOpen(true)}
        onViewSelectedFrame={() => setIsViewerOpen(true)}
        onDeleteSelectedFrame={() => {
          if (selectedFrame) {
            handleDeleteFrame(selectedFrame.id);
          }
        }}
        onClearSelectedFrameContent={() => {
          if (selectedFrame) {
            handleClearFrameContent(selectedFrame.id);
          }
        }}
        onClearSelection={() => {
          setSelectedFrame(null);
          if (sceneRef.current) {
            sceneRef.current.selectFrame(null);
          }
        }}
        onOpenNewFrame={() => setIsNewFrameOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onResetCamera={handleResetCamera}
        onToggleVR={handleToggleVR}
        onOpenHelp={() => setIsHelpOpen(true)}
        onManualSave={handleManualSave}
        role={role}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        activeSpaceName={activeSpace?.name}
        onOpenSpacesModal={() => setIsSpacesModalOpen(true)}
      />

      {/* 4. Floating Quick Actions Bar for Selected Frame in 3D */}
      {selectedFrame && !isEditorOpen && !isViewerOpen && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl border border-sky-500/50 rounded-2xl p-2 px-3.5 shadow-2xl shadow-sky-950/60 max-w-[94vw] overflow-x-auto">
          {/* Frame Label */}
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700/80 shrink-0">
            <span
              className="w-3 h-3 rounded-full shadow-md shrink-0"
              style={{ backgroundColor: selectedZoneCfg?.color || '#38bdf8' }}
            />
            <div className="truncate max-w-[150px] sm:max-w-[220px]">
              <p className="text-xs font-bold text-white truncate">{selectedFrame.title}</p>
              <p className="text-[10px] text-sky-400 truncate">{selectedZoneCfg?.name}</p>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {role === 'teacher' ? (
              <>
                <button
                  onClick={() => {
                    soundService.playSelect();
                    setIsEditorOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md transition-all cursor-pointer"
                  title="Thêm hoặc sửa nội dung hình ảnh, video, mã nhúng"
                >
                  {selectedHasContent ? (
                    <Sliders className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                  <span>{selectedHasContent ? 'Sửa nội dung' : '+ Thêm nội dung'}</span>
                </button>

                {selectedHasContent && (
                  <button
                    onClick={() => {
                      soundService.playSelect();
                      setIsViewerOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs border border-slate-700 transition-all cursor-pointer"
                    title="Mở xem toàn màn hình"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Xem</span>
                  </button>
                )}

                {selectedHasContent && (
                  <>
                    {!showClearConfirm ? (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all cursor-pointer"
                        title="Xóa nội dung trong khung, trả về trạng thái trống"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Xóa nội dung</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-amber-950/70 p-1 rounded-xl border border-amber-500/40">
                        <button
                          onClick={() => handleClearFrameContent(selectedFrame.id)}
                          className="px-2 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-1.5 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={() => {
                    soundService.playDelete();
                    handleDeleteFrame(selectedFrame.id);
                  }}
                  className="flex items-center gap-1 p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                  title="Xóa khung này khỏi phòng học 3D"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  soundService.playSelect();
                  setIsViewerOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Mở bài học / Tương tác</span>
              </button>
            )}

            {/* Close Selection Button */}
            <button
              onClick={() => {
                setSelectedFrame(null);
                if (sceneRef.current) {
                  sceneRef.current.selectFrame(null);
                }
              }}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer ml-1"
              title="Bỏ chọn khung"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Virtual Classroom Spaces Modal */}
      {isSpacesModalOpen && (
        <RoomSpacesModal
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          onSelectSpace={handleSelectSpace}
          onAddSpace={handleAddSpace}
          onUpdateSpace={handleUpdateSpace}
          onDeleteSpace={handleDeleteSpace}
          onClose={() => setIsSpacesModalOpen(false)}
          isTeacher={role === 'teacher'}
        />
      )}

      {/* 6. Frame Editor Modal (Teacher Mode) */}
      {isEditorOpen && selectedFrame && (
        <FrameEditorModal
          frame={selectedFrame}
          onSave={handleSaveFrame}
          onDelete={handleDeleteFrame}
          onClose={() => setIsEditorOpen(false)}
          onOpenViewer={() => {
            setIsEditorOpen(false);
            setIsViewerOpen(true);
          }}
        />
      )}

      {/* 7. Frame Interactive Viewer Modal (Teacher & Student) */}
      {isViewerOpen && selectedFrame && (
        <FrameViewerModal
          frame={selectedFrame}
          onClose={() => setIsViewerOpen(false)}
          onEditIfTeacher={() => {
            setIsViewerOpen(false);
            setIsEditorOpen(true);
          }}
          onClearContentIfTeacher={() => {
            handleClearFrameContent(selectedFrame.id);
          }}
          isTeacher={role === 'teacher'}
        />
      )}

      {/* 8. New Frame Modal */}
      {isNewFrameOpen && (
        <NewFrameModal
          existingFrames={frames}
          onAddFrame={handleAddNewFrame}
          onClose={() => setIsNewFrameOpen(false)}
        />
      )}

      {/* 9. Export / Import Modal */}
      {isExportImportOpen && (
        <ExportImportModal
          frames={frames}
          spaces={spaces}
          currentSpaceName={activeSpace?.name}
          onImportFrames={handleImportFrames}
          onImportSpaces={handleImportSpaces}
          onResetFrames={handleResetFrames}
          onClose={() => setIsExportImportOpen(false)}
        />
      )}

      {/* 10. Controls & VR Help Modal */}
      {isHelpOpen && <ControlsHelpModal onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
}
