import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { MemoryVectorStore } from 'react-native-rag';

export const loadKnowledgeBase = async (vectorStore: MemoryVectorStore): Promise<void> => {
  try {
    console.log("Loading offline knowledge base...");
    
    // 0. Ensure store is loaded (initializes embeddingDim)
    await vectorStore.load();
    
    // 1. Get the asset
    // We use .db to avoid Metro trying to parse 42MB of JSON as a JS module
    const asset = Asset.fromModule(require('../assets/mobile_rag_data.db'));
    
    if (!asset.localUri) {
      await asset.downloadAsync();
    }

    const uri = asset.localUri || asset.uri;
    
    // 2. Read the file
    const content = await FileSystem.readAsStringAsync(uri);
    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      throw new Error("Invalid knowledge base format: expected an array.");
    }

    console.log(`Knowledge base loaded: ${data.length} items. Seeding vector store...`);

    // 3. Batch add to vector store
    // Use the existing .add() method for each item
    // Note: react-native-rag MemoryVectorStore might not have addBatch, 
    // so we loop. If it's too slow, we can optimize later.
    for (const item of data) {
      await vectorStore.add({
        id: item.id,
        document: item.document,
        metadata: item.metadata,
        embedding: item.embedding
      });
    }

    console.log("✅ Offline knowledge base seeded successfully.");
  } catch (error) {
    console.error("Failed to load knowledge base:", error);
    throw error;
  }
};
