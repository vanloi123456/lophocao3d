import JSZip from 'jszip';
import { ClassroomFrame, ClassroomSpace } from '../types/classroom';
import { DEFAULT_CLASSROOM_FRAMES, DEFAULT_CLASSROOM_SPACES } from '../data/defaultClassroom';

const DB_NAME = 'LopHocAo3D_DB_v2';
const DB_VERSION = 1;
const STORE_NAME = 'classroom_store';
const KEY_FRAMES = 'classroom_frames_persistent';
const KEY_SPACES = 'classroom_spaces_persistent';
const LOCAL_STORAGE_KEY = 'lop_hoc_ao_frames_persistent_v2';
const LOCAL_STORAGE_SPACES_KEY = 'lop_hoc_ao_spaces_persistent_v2';
const LOCAL_STORAGE_ACTIVE_SPACE_KEY = 'lop_hoc_ao_active_space_id_v2';

let dbInstance: IDBDatabase | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB không được hỗ trợ trên trình duyệt này.'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onerror = () => {
        reject(request.error || new Error('Không thể mở cơ sở dữ liệu IndexedDB'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Loads all virtual classroom spaces
 */
export async function loadClassroomSpaces(): Promise<ClassroomSpace[]> {
  // 1. Try loading spaces from IndexedDB
  try {
    const db = await openDatabase();
    const idbResult = await new Promise<ClassroomSpace[] | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(KEY_SPACES);

        req.onsuccess = () => {
          if (req.result && Array.isArray(req.result) && req.result.length > 0) {
            resolve(req.result as ClassroomSpace[]);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (idbResult && idbResult.length > 0) {
      return idbResult;
    }
  } catch (err) {
    console.warn('Lỗi đọc spaces từ IndexedDB, chuyển sang localStorage:', err);
  }

  // 2. Try loading from localStorage
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_SPACES_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        saveClassroomSpaces(parsed).catch(() => {});
        return parsed as ClassroomSpace[];
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc spaces từ localStorage:', err);
  }

  // 3. Check if single-room legacy frames exist and migrate them into Space 1
  try {
    const legacyFrames = await loadClassroomFrames();
    if (legacyFrames && legacyFrames.length > 0) {
      const migratedSpaces: ClassroomSpace[] = [
        {
          id: 'space-future-01',
          name: 'Phòng 1: Lớp Học Sáng Tạo',
          description: 'Không gian công nghệ tương lai với bảng tương tác hiện đại',
          theme: 'future_blue',
          bannerText: 'LỚP HỌC ẢO 3D – GIÁO VIÊN SÁNG TẠO',
          frames: legacyFrames,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        ...DEFAULT_CLASSROOM_SPACES.slice(1),
      ];
      saveClassroomSpaces(migratedSpaces).catch(() => {});
      return migratedSpaces;
    }
  } catch {
    // Ignored
  }

  // 4. Default preset spaces
  return DEFAULT_CLASSROOM_SPACES;
}

/**
 * Saves all virtual classroom spaces permanently
 */
export async function saveClassroomSpaces(spaces: ClassroomSpace[]): Promise<boolean> {
  let savedToIndexedDB = false;
  let savedToLocalStorage = false;

  // 1. Save to IndexedDB
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(spaces, KEY_SPACES);
        req.onsuccess = () => {
          savedToIndexedDB = true;
          resolve();
        };
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  } catch (err) {
    console.warn('Lỗi lưu spaces vào IndexedDB:', err);
  }

  // 2. Also save to localStorage
  try {
    const lightSpaces = spaces.map(sp => ({
      ...sp,
      frames: sp.frames.map(f => {
        if (f.content.videoUrl && f.content.videoUrl.startsWith('data:') && f.content.videoUrl.length > 800000) {
          return {
            ...f,
            content: {
              ...f.content,
              videoUrl: savedToIndexedDB ? f.content.videoUrl : '',
            }
          };
        }
        return f;
      })
    }));

    localStorage.setItem(LOCAL_STORAGE_SPACES_KEY, JSON.stringify(lightSpaces));
    savedToLocalStorage = true;
  } catch (err) {
    console.warn('LocalStorage limit, IndexedDB used:', err);
  }

  return savedToIndexedDB || savedToLocalStorage;
}

/**
 * Active Space ID management
 */
export function getSavedActiveSpaceId(): string {
  try {
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_SPACE_KEY) || 'space-future-01';
  } catch {
    return 'space-future-01';
  }
}

export function saveActiveSpaceId(spaceId: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SPACE_KEY, spaceId);
  } catch {
    // Ignored
  }
}

/**
 * Backward compatibility functions
 */
export async function loadClassroomFrames(): Promise<ClassroomFrame[]> {
  try {
    const db = await openDatabase();
    const idbResult = await new Promise<ClassroomFrame[] | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(KEY_FRAMES);
        req.onsuccess = () => {
          if (req.result && Array.isArray(req.result) && req.result.length > 0) {
            resolve(req.result as ClassroomFrame[]);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    if (idbResult && idbResult.length > 0) return idbResult;
  } catch {
    // ignore
  }

  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_CLASSROOM_FRAMES;
}

export async function saveClassroomFrames(frames: ClassroomFrame[]): Promise<boolean> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(frames, KEY_FRAMES);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
    return true;
  } catch {
    return false;
  }
}

export async function resetClassroomFrames(): Promise<ClassroomFrame[]> {
  await saveClassroomFrames(DEFAULT_CLASSROOM_FRAMES);
  return DEFAULT_CLASSROOM_FRAMES;
}

export function exportClassroomJson(spacesOrFrames: ClassroomSpace[] | ClassroomFrame[]): string {
  const exportPayload = {
    app: 'LopHocAo3D_GiaoVienSangTao',
    version: '3.0',
    exportedAt: new Date().toISOString(),
    data: spacesOrFrames,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importClassroomJson(jsonString: string): ClassroomSpace[] | ClassroomFrame[] {
  try {
    const data = JSON.parse(jsonString);
    if (!data) throw new Error('Dữ liệu không hợp lệ.');
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.frames)) return data.frames;
    throw new Error('Tệp không đúng định dạng phòng học ảo 3D.');
  } catch (err: unknown) {
    throw new Error(err instanceof Error ? err.message : 'Tệp tải lên không hợp lệ');
  }
}

/**
 * Export full classroom spaces or frames into a compressed .zip archive
 */
export async function exportClassroomZip(
  spacesOrFrames: ClassroomSpace[] | ClassroomFrame[],
  spaceName?: string
): Promise<Blob> {
  const zip = new JSZip();

  const exportPayload = {
    app: 'LopHocAo3D_GiaoVienSangTao',
    version: '3.0',
    exportedAt: new Date().toISOString(),
    data: spacesOrFrames,
  };

  // 1. Primary data JSON
  zip.file('lop-hoc-ao-3d-data.json', JSON.stringify(exportPayload, null, 2));

  // 2. Readme guide in Vietnamese
  const isSpaces =
    Array.isArray(spacesOrFrames) &&
    spacesOrFrames.length > 0 &&
    'frames' in spacesOrFrames[0];
  const roomCount = isSpaces ? (spacesOrFrames as ClassroomSpace[]).length : 1;
  const readmeContent = `==========================================================
LỚP HỌC ẢO 3D – GIÁO VIÊN SÁNG TẠO
TỆP SAO LƯU GÓI PHÒNG HỌC (.ZIP)
==========================================================

Thời gian xuất tệp: ${new Date().toLocaleString('vi-VN')}
Số lượng không gian phòng học: ${roomCount}
${spaceName ? `Phòng đang chọn: ${spaceName}\n` : ''}

NỘI DUNG TỆP NÉN:
1. lop-hoc-ao-3d-data.json:
   Chứa toàn bộ cấu hình 3D, danh sách phòng học, các khung học liệu, hình ảnh, video, mã nhúng bài tập và sách số.
2. assets/hinh-anh/:
   Chứa các tệp ảnh được trích xuất (nếu có bài học có ảnh minh họa).

HƯỚNG DẪN KHÔI PHỤC TRÊN ỨNG DỤNG:
1. Mở ứng dụng "Lớp Học Ảo 3D - Giáo Viên Sáng Tạo".
2. Nhấn nút "Sao lưu" trên thanh công cụ hoặc menu bên trái.
3. Chọn "Nhập tệp sao lưu" và chọn trực tiếp tệp .zip này (hoặc tệp .json bên trong).
4. Ứng dụng sẽ tự động giải nén và nạp lại toàn bộ bài học và không gian 3D của bạn!
==========================================================
`;
  zip.file('README-huong-dan.txt', readmeContent);

  // 3. Extract any base64 images into separate files inside assets folder
  const assetsFolder = zip.folder('assets/hinh-anh');
  let imageIndex = 1;

  const extractImagesFromFrames = (framesList: ClassroomFrame[]) => {
    for (const f of framesList) {
      if (f.content.imageUrl && f.content.imageUrl.startsWith('data:image/')) {
        try {
          const match = f.content.imageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (match && match[2]) {
            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            const base64Data = match[2];
            const cleanTitle = (f.title || `khung-${f.id}`)
              .replace(/[^a-zA-Z0-9-_]/g, '_')
              .slice(0, 30);
            assetsFolder?.file(`${imageIndex}_${cleanTitle}.${ext}`, base64Data, { base64: true });
            imageIndex++;
          }
        } catch {
          // ignore individual image extraction failure, main JSON still has full data
        }
      }
    }
  };

  if (isSpaces) {
    for (const sp of spacesOrFrames as ClassroomSpace[]) {
      extractImagesFromFrames(sp.frames);
    }
  } else {
    extractImagesFromFrames(spacesOrFrames as ClassroomFrame[]);
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Import from either .zip or .json file
 */
export async function importClassroomZipOrJson(
  file: File
): Promise<ClassroomSpace[] | ClassroomFrame[]> {
  const fileName = file.name.toLowerCase();

  // If file is a ZIP archive
  if (fileName.endsWith('.zip') || file.type.includes('zip')) {
    try {
      const zip = await JSZip.loadAsync(file);
      // Look for lop-hoc-ao-3d-data.json or any .json file inside
      let jsonFile = zip.file('lop-hoc-ao-3d-data.json');
      if (!jsonFile) {
        const jsonFiles = zip.file(/\.json$/i);
        if (jsonFiles && jsonFiles.length > 0) {
          jsonFile = jsonFiles[0];
        }
      }

      if (!jsonFile) {
        throw new Error('Tệp .zip không chứa tệp cấu hình lop-hoc-ao-3d-data.json.');
      }

      const jsonText = await jsonFile.async('text');
      return importClassroomJson(jsonText);
    } catch (err: unknown) {
      throw new Error(
        err instanceof Error
          ? `Lỗi khi giải nén tệp .zip: ${err.message}`
          : 'Không thể giải nén tệp .zip này.'
      );
    }
  }

  // Otherwise, read as JSON text
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = importClassroomJson(text);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp này.'));
    reader.readAsText(file);
  });
}
