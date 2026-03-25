import * as FileSystem from 'expo-file-system';
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

export const downloadModel = async (
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    await ensureModelsDirectory();
    
    const downloadUrl = MODEL_CONFIG.getDownloadUrl();
    const localPath = MODEL_CONFIG.getLocalModelPath();

    console.log('Downloading model to:', localPath);
    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      localPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(Math.round(progress * 100));
      }
    );

    const result = await downloadResumable.downloadAsync();
    console.log('Download result:', result?.uri, 'status:', result?.status);
    
    if (result && result.status === 200) {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) {
        console.log('Final file size:', info.size, 'bytes');
        if (info.size < 1024 * 1024) { // Less than 1MB
           console.warn('File size is suspiciously small. Might be an error page.');
           return { success: false, error: 'Downloaded file is unexpectedly small. Check the URL.' };
        }
      }
      return { success: true };
    } else {
      return { success: false, error: 'Download failed with status ' + (result?.status || 'unknown') };
    }
  } catch (error: any) {
    console.error('Download model error:', error);
    return { success: false, error: error.message || 'Failed to download model' };
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