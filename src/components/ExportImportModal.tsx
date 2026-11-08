import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  Check,
  AlertTriangle,
  FileArchive,
  FileJson,
  Loader2,
  FolderArchive,
  Sparkles
} from 'lucide-react';
import { ClassroomFrame, ClassroomSpace } from '../types/classroom';
import {
  exportClassroomJson,
  exportClassroomZip,
  importClassroomZipOrJson,
  resetClassroomFrames
} from '../services/storageService';
import { soundService } from '../services/audioService';

interface ExportImportModalProps {
  frames: ClassroomFrame[];
  spaces?: ClassroomSpace[];
  currentSpaceName?: string;
  onImportFrames: (importedFrames: ClassroomFrame[]) => void;
  onImportSpaces?: (importedSpaces: ClassroomSpace[]) => void;
  onResetFrames: (defaultFrames: ClassroomFrame[]) => void;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  frames,
  spaces,
  currentSpaceName,
  onImportFrames,
  onImportSpaces,
  onResetFrames,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [downloadZipSuccess, setDownloadZipSuccess] = useState(false);
  const [downloadJsonSuccess, setDownloadJsonSuccess] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Export full .ZIP package (includes JSON data, extracted images & README)
  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      setImportError(null);
      soundService.playSuccess();

      // Export all spaces if available, otherwise frames
      const dataToExport = spaces && spaces.length > 0 ? spaces : frames;
      const zipBlob = await exportClassroomZip(dataToExport, currentSpaceName);

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `lop-hoc-ao-3d-backup-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadZipSuccess(true);
      setTimeout(() => setDownloadZipSuccess(false), 3500);
    } catch (err: unknown) {
      soundService.playDelete();
      setImportError(err instanceof Error ? err.message : 'Lỗi khi tạo tệp .zip');
    } finally {
      setIsExportingZip(false);
    }
  };

  // Export lightweight .JSON file
  const handleExportJson = () => {
    try {
      soundService.playSuccess();
      const dataToExport = spaces && spaces.length > 0 ? spaces : frames;
      const jsonStr = exportClassroomJson(dataToExport);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `lop-hoc-ao-3d-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadJsonSuccess(true);
      setTimeout(() => setDownloadJsonSuccess(false), 3000);
    } catch (err: unknown) {
      soundService.playDelete();
      setImportError(err instanceof Error ? err.message : 'Lỗi khi xuất tệp .json');
    }
  };

  // Import either .ZIP or .JSON file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccessMsg(null);

      const imported = await importClassroomZipOrJson(file);
      soundService.playSuccess();

      if (Array.isArray(imported) && imported.length > 0) {
        if ('frames' in imported[0]) {
          // It's a list of ClassroomSpace
          const spacesList = imported as ClassroomSpace[];
          if (onImportSpaces) {
            onImportSpaces(spacesList);
          } else {
            onImportFrames(spacesList[0].frames);
          }
          setImportSuccessMsg(
            `✓ Đã khôi phục thành công ${spacesList.length} không gian phòng học từ tệp "${file.name}"!`
          );
        } else {
          // List of ClassroomFrame
          const framesList = imported as ClassroomFrame[];
          onImportFrames(framesList);
          setImportSuccessMsg(
            `✓ Đã khôi phục thành công ${framesList.length} khung học liệu từ tệp "${file.name}"!`
          );
        }
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      soundService.playDelete();
      setImportError(
        err instanceof Error ? err.message : 'Tệp tải lên không hợp lệ hoặc bị lỗi.'
      );
    } finally {
      setIsImporting(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = async () => {
    soundService.playDelete();
    const defaults = await resetClassroomFrames();
    onResetFrames(defaults);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-slate-950 flex items-center justify-center shadow-md">
              <FolderArchive className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Sao Lưu & Khôi Phục Dữ Liệu
              </h2>
              <p className="text-xs text-slate-400">
                Xuất hoặc nhập toàn bộ phòng học dưới dạng tệp nén .ZIP hoặc .JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {importError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Đã xảy ra lỗi:</p>
              <p className="mt-0.5">{importError}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {importSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{importSuccessMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* 1. Export as Full .ZIP package (Recommended) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-sky-400 shrink-0" />
                <h4 className="text-sm font-bold text-white truncate">
                  Xuất gói đầy đủ (.ZIP)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Khuyên dùng
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Đóng gói toàn bộ cấu hình 3D, bài giảng, tệp ảnh trích xuất và hướng dẫn khôi phục.
              </p>
            </div>

            <button
              onClick={handleExportZip}
              disabled={isExportingZip}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:brightness-110 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
              title="Tải về gói nén .zip chứa đầy đủ bài học và tài nguyên"
            >
              {isExportingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang nén ZIP...</span>
                </>
              ) : downloadZipSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Đã tải .ZIP!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải về .ZIP</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Export as Lightweight .JSON */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-400 shrink-0" />
                <h4 className="text-sm font-bold text-white truncate">
                  Xuất tệp nhanh (.JSON)
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chỉ xuất văn bản JSON nhẹ để lưu trữ hoặc truyền tải nhanh.
              </p>
            </div>

            <button
              onClick={handleExportJson}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer shrink-0"
              title="Tải về tệp cấu hình JSON"
            >
              {downloadJsonSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã tải JSON!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải JSON</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Import from .ZIP or .JSON */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
                <h4 className="text-sm font-bold text-white">
                  Khôi phục phòng học (.ZIP hoặc .JSON)
                </h4>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang nạp...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn tệp .ZIP / .JSON</span>
                  </>
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".zip,.json,application/zip,application/x-zip-compressed,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-slate-400">
              Chọn tệp sao lưu <strong className="text-slate-300">.zip</strong> hoặc <strong className="text-slate-300">.json</strong> để nạp lại đầy đủ các khu vực và bài giảng 3D.
            </p>
          </div>

          {/* 4. Reset Classroom to Original Blank State */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-rose-300">Đặt lại phòng học ban đầu</h4>
                <p className="text-xs text-slate-400">
                  Xóa các nội dung tùy chỉnh về trạng thái trống gốc
                </p>
              </div>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer"
                >
                  Đặt lại
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleReset}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Xác nhận
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tip footer */}
        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Tệp .ZIP tương thích hoàn toàn để chuyển đổi giữa các thiết bị
          </span>
          <span className="text-sky-400 font-semibold">Tự động nén</span>
        </div>
      </div>
    </div>
  );
};
