import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { ComponentStyles, ComponentTextStyles } from "../styles/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/colors";
import { downloadModel } from '../utils/modelDownloader';

interface DownloadModelProps {
    visible: boolean;
    onClose: () => void;
    onDownloadSuccess?: () => void;
}

export default function DownloadModel({ visible, onClose, onDownloadSuccess }: DownloadModelProps) {

    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    const handleDownloadRequest = async () => {
        if (isDownloading) return;
        
        setIsDownloading(true);
        setDownloadError(null);
        setDownloadSuccess(false);
        setDownloadProgress(0);

        const result = await downloadModel((progress) => {
            setDownloadProgress(progress);
        });

        setIsDownloading(false);
        if (result.success) {
            setDownloadSuccess(true);
            onDownloadSuccess?.();
        } else {
            setDownloadError(result.error || "Download failed");
        }
    };


    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
                if (!isDownloading) onClose();
            }}
        >
            <View style={ComponentStyles.modalOverlay}>
                <View style={ComponentStyles.modalContent}>

                    {/* Title and Description */}
                    <Text style={ComponentTextStyles.modalTitle}>
                        {downloadSuccess ? "Ready to Use" : "Download Model"}
                    </Text>
                    <Text style={ComponentTextStyles.modalDescription}>
                        {downloadSuccess 
                            ? "The model has been successfully downloaded and is ready for use."
                            : "This model is not yet available on your device. Would you like to download it now?"
                        }
                    </Text>

                    {/* Progress Bar Section */}
                    {isDownloading && (
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <View style={ComponentStyles.modalProgressBar}>
                                <View style={[ComponentStyles.modalProgressBarFill, { width: `${downloadProgress}%` }]} />
                            </View>
                            <Text style={[ComponentTextStyles.modalDescription, { marginTop: 4, fontWeight: '600' }]}>
                                Downloading... {downloadProgress}%
                            </Text>
                        </View>
                    )}

                    {downloadError && (
                        <Text style={[ComponentTextStyles.modalDescription, { color: '#F44336', marginTop: 12 }]}>
                            {downloadError}
                        </Text>
                    )}

                    {/* Action Buttons */}
                    <View style={ComponentStyles.modalButtonGroup}>
                        {!downloadSuccess ? (
                            <>
                                <TouchableOpacity 
                                    style={[
                                        ComponentStyles.modalButton, 
                                        ComponentStyles.modalButtonSecondary,
                                        isDownloading && { opacity: 0.5 }
                                    ]} 
                                    onPress={onClose}
                                    activeOpacity={0.7}
                                    disabled={isDownloading}
                                >
                                    <Text style={ComponentTextStyles.modalButtonTextSecondary}>Later</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[
                                        ComponentStyles.modalButton, 
                                        ComponentStyles.modalButtonPrimary,
                                        isDownloading && { opacity: 0.7 }
                                    ]} 
                                    onPress={handleDownloadRequest}
                                    activeOpacity={0.8}
                                    disabled={isDownloading}
                                >
                                    <Text style={ComponentTextStyles.modalButtonTextPrimary}>
                                        {isDownloading ? "Downloading..." : "Download"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity 
                                style={[ComponentStyles.modalButton, ComponentStyles.modalButtonPrimary]} 
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={ComponentTextStyles.modalButtonTextPrimary}>Start Chatting</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
