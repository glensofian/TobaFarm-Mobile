import React, { useState, useRef } from "react";
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { ComponentStyles, ComponentTextStyles } from "../styles/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/colors";
import { downloadModel, cancelDownload } from '../utils/modelDownloader';
import { useLanguage } from "../context/LanguageContext";
import { useNetwork } from "../context/NetworkContext";
import { useEffect } from "react";

interface DownloadModelProps {
    visible: boolean;
    onClose: () => void;
    onDownloadSuccess?: () => void;
    onDownloadFailed?: (error: string) => void;
}

export default function DownloadModel({ visible, onClose, onDownloadSuccess, onDownloadFailed }: DownloadModelProps) {
    const { t } = useLanguage();
    const chatT = t.roomChat as any;

    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const isCancelledRef = useRef(false);

    // Membongkar potensi "deadlock" state kalau promise downloadModel nyangkut selamanya
    useEffect(() => {
        if (!visible) {
            setIsDownloading(false);
            setDownloadProgress(0);
            setDownloadError(null);
            isCancelledRef.current = true; // Batalkan interupsi ghaib
        }
    }, [visible]);

    const handleDownloadRequest = async () => {
        if (isDownloading) return;
        
        isCancelledRef.current = false;
        setIsDownloading(true);
        setDownloadError(null);
        setDownloadSuccess(false);
        setDownloadProgress(0);

        const result = await downloadModel((progress) => {
            setDownloadProgress(progress);
        });

        setIsDownloading(false);
        
        // Lewati set error jika pembatalan murni dari user
        if (isCancelledRef.current) {
            return;
        }

        if (result.success) {
            setDownloadSuccess(true);
            onDownloadSuccess?.();
        } else {
            // Karena ChatContext sekarang melibas koneksi internet yang putus secara instan beserta notifikasinya, 
            // modal DownloadModel cukup diam jika status errornya karena NETWORK_ERROR.
            if (result.error === 'NETWORK_ERROR') {
                return;
            }
            
            setDownloadError(null);
            onDownloadFailed?.(result.error || "Download failed");
            onClose();
        }
    };


    const handleCancelDownload = async () => {
        isCancelledRef.current = true;
        await cancelDownload();
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadError(null); // Tidak usah tampilkan tulisan gagal
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={ComponentStyles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={ComponentStyles.modalContent}>

                            {/* Title and Description */}
                            <Text style={ComponentTextStyles.modalTitle}>
                                {downloadSuccess ? (chatT.downloadReady || "Ready to Use") 
                                 : isDownloading ? (chatT.downloading || "Downloading...") 
                                 : (chatT.downloadModel || "Download Model")}
                            </Text>
                            <Text style={ComponentTextStyles.modalDescription}>
                                {downloadSuccess 
                                    ? (chatT.downloadReadyMsg || "The model has been successfully downloaded and is ready for use.")
                                    : isDownloading 
                                        ? (chatT.downloadWarning || "Model is downloading. Please ensure you do not exit the ToFa app until the download is complete.")
                                        : (chatT.downloadPrompt || "This model is not yet available on your device. Would you like to download it now?")
                                }
                            </Text>

                            {/* Progress Bar Section */}
                            {isDownloading && (
                                <View style={{ width: '100%', alignItems: 'center' }}>
                                    <View style={ComponentStyles.modalProgressBar}>
                                        <View style={[ComponentStyles.modalProgressBarFill, { width: `${downloadProgress}%` }]} />
                                    </View>
                                    <Text style={[ComponentTextStyles.modalDescription, { marginTop: 4, fontWeight: '600' }]}>
                                        {chatT.downloading || "Downloading..."} {downloadProgress}%
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
                                        {isDownloading ? (
                                            <>
                                                <TouchableOpacity 
                                                    style={[ComponentStyles.modalButton, ComponentStyles.modalButtonSecondary]} 
                                                    onPress={handleCancelDownload}
                                                >
                                                    <Text style={[ComponentTextStyles.modalButtonTextSecondary, { color: '#F44336' }]}>
                                                        {chatT.cancel || "Batal"}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity 
                                                    style={[ComponentStyles.modalButton, ComponentStyles.modalButtonPrimary]} 
                                                    onPress={onClose}
                                                >
                                                    <Text style={ComponentTextStyles.modalButtonTextPrimary}>
                                                        {chatT.hide || "Sembunyikan"}
                                                    </Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <>
                                                <TouchableOpacity 
                                                    style={[ComponentStyles.modalButton, ComponentStyles.modalButtonSecondary]} 
                                                    onPress={onClose}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={ComponentTextStyles.modalButtonTextSecondary}>
                                                        {chatT.later || "Nanti"}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity 
                                                    style={[ComponentStyles.modalButton, ComponentStyles.modalButtonPrimary]} 
                                                    onPress={handleDownloadRequest}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={ComponentTextStyles.modalButtonTextPrimary}>
                                                        {chatT.downloadModel || "Download"}
                                                    </Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <TouchableOpacity 
                                        style={[ComponentStyles.modalButton, ComponentStyles.modalButtonPrimary]} 
                                        onPress={onClose}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={ComponentTextStyles.modalButtonTextPrimary}>
                                            {chatT.startChatting || "Start Chatting"}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
