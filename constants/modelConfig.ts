import * as FileSystem from 'expo-file-system';

export const MODEL_CONFIG = {
  HF_REPO: 'ToFaAI/Qwen3-VL-2B-Instruct-Q4_K_M.gguf',
  MODEL_FILENAME: 'Qwen3-VL-2B-Instruct-Q4_K_M.gguf',
  
  getDownloadUrl: () => 
    `https://huggingface.co/${MODEL_CONFIG.HF_REPO}/resolve/main/${MODEL_CONFIG.MODEL_FILENAME}`,
  
  getLocalModelPath: () => 
    `${FileSystem.documentDirectory}assets/models/${MODEL_CONFIG.MODEL_FILENAME}`,
};