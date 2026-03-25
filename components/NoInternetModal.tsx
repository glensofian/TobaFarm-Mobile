import { Modal, Text, View, TouchableOpacity, TouchableWithoutFeedback } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function NoInternetModal({ visible, onClose }: Props) {
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
                        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>No Internet</Text>
                        <Text style={{ textAlign: 'center', color: '#666' }}>Please check your connection and try again.</Text>
                        
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