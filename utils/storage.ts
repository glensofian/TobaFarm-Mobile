import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function save(key: string, value: any) {
    console.log("Saving to SecureStore:", key, value);
    try {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (Platform.OS === "web") {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(key, stringValue);
                }
            } catch (e) {
                console.error("Local storage is unavailable:", e);
            }
        } else {
            await SecureStore.setItemAsync(key, stringValue);
        }
    } catch (err) {
        console.error("Failed to save data to secure store:", err);
    }
}

export async function getValueFor(key: string) {
    try {
        let result: string | null = null;
        if (Platform.OS === "web") {
            try {
                if (typeof localStorage !== 'undefined') {
                    result = localStorage.getItem(key);
                }
            } catch (e) {
                console.error("Local storage is unavailable:", e);
            }
        } else {
            result = await SecureStore.getItemAsync(key);
        }

        if (result) {
            return result;
        } else {
            console.log("No values stored under key:", key);
            return null;
        }
    } catch (err) {
        console.error("Failed to get data from secure store:", err);
        return null;
    }
}

export async function removeValueFor(key: string) {
    try {
        if (Platform.OS === "web") {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                console.error("Local storage is unavailable:", e);
            }
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (err) {
        console.error("Failed to delete data from secure store:", err);
    }
}
