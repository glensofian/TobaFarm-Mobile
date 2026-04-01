import { Modal, Text, View, TouchableOpacity, TouchableWithoutFeedback } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

export default function NotificationModal({ visible, onClose, title = "No Internet", message = "Please check your connection and try again." }: Props) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableWithoutFeedback>
                    <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, alignItems: 'center', width: '80%' }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: "center" }}>{title}</Text>
                        <Text style={{ textAlign: 'center', color: '#666', lineHeight: 20 }}>{message}</Text>
                        
                        <TouchableOpacity 
                            onPress={onClose}
                            style={{ 
                                marginTop: 24, 
                                backgroundColor: '#f0f0f0', 
                                paddingVertical: 10, 
                                paddingHorizontal: 32, 
                                borderRadius: 12 
                            }}
                        >
                            <Text style={{ fontWeight: '600', color: '#333' }}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
}