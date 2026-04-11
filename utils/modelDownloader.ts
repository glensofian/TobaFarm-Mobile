import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, LlamaContext } from 'llama.rn';
import { MODEL_CONFIG } from '../constants/modelConfig';

export const ensureModelsDirectory = async () => {
  const localPath = MODEL_CONFIG.getLocalModelPath();
  // Extract directory part from the full file path
  const dirPath = localPath.substring(0, localPath.lastIndexOf('/'));
  
  const dirInfo = await FileSystem.getInfoAsync(dirPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
};

let activeDownload: FileSystem.DownloadResumable | null = null;
let wasNetworkAborted = false;

export const isDownloadingModel = () => activeDownload !== null;

export const consumeNetworkAborted = () => {
  if (wasNetworkAborted) {
    wasNetworkAborted = false;
    return true;
  }
  return false;
};

export const cancelDownload = async () => {
  if (activeDownload) {
    const downloadCopy = activeDownload;
    // Set to null IMMEDIATELY so we're no longer in a "downloading" state globally
    activeDownload = null;

    try {
      await downloadCopy.cancelAsync();
    } catch (e) {
      console.log('Error cancelling download:', e);
    }

    // Bersihkan file yang baru setengah terdownload agar tidak dianggap selesai
    try {
      const localPath = MODEL_CONFIG.getLocalModelPath();
      await FileSystem.deleteAsync(localPath, { idempotent: true });
    } catch (e) {
      console.log('Error deleting partial download:', e);
    }
  }
};

export const downloadModel = async (
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    await ensureModelsDirectory();
    
    const downloadUrl = MODEL_CONFIG.getDownloadUrl();
    const localPath = MODEL_CONFIG.getLocalModelPath();

    console.log('Downloading model to:', localPath);
    activeDownload = FileSystem.createDownloadResumable(
      downloadUrl,
      localPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(Math.round(progress * 100));
      }
    );

    const result = await activeDownload.downloadAsync();
    activeDownload = null;
    console.log('Download result:', result?.uri, 'status:', result?.status);
    
    if (result && result.status === 200) {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) {
        console.log('Final file size:', info.size, 'bytes');
        if (info.size < 1024 * 1024) { // Less than 1MB
           console.warn('File size is suspiciously small. Might be an error page.');
           await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(()=>{});
           return { success: false, error: 'Downloaded file is unexpectedly small. Check the URL.' };
        }
      }
      return { success: true };
    } else {
      activeDownload = null;
      wasNetworkAborted = true;
      await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(()=>{});
      return { success: false, error: 'NETWORK_ERROR' };
    }
  } catch (error: any) {
    activeDownload = null;
    wasNetworkAborted = true;
    console.error('Download model error:', error);
    try {
      const localPath = MODEL_CONFIG.getLocalModelPath();
      await FileSystem.deleteAsync(localPath, { idempotent: true });
    } catch (cleanupErr) {}
    return { success: false, error: 'NETWORK_ERROR' };
  }
};

export const loadLocalModel = async (
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; context?: LlamaContext; error?: string }> => {
  try {
    const localPath = MODEL_CONFIG.getLocalModelPath();
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    
    if (!fileInfo.exists) {
      return { success: false, error: 'Model file not found. Download first.' };
    }

    // Initialize llama.cpp context with mmap enabled (default)
    const context = await initLlama({
      model: localPath,
      use_mlock: false,      
      use_mmap: true,        
      n_ctx: 4096,           
      n_gpu_layers: 0,       
      n_threads: 4,          
    }, (progress) => {
      onProgress?.(progress);
    });

    return { success: true, context };
  } catch (error: any) {
    console.error('Model load error:', error);
    return { success: false, error: error.message || 'Failed to load model' };
  }
};