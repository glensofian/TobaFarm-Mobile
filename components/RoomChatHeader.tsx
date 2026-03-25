import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../styles';
import { useNetwork } from '@/context/NetworkContext';

export default function RoomChatHeader() {
  const { isInternetReachable, isConnected } = useNetwork();
  const testConnectivity = () => {
    console.log('test connectivity');
    console.log('isInternetReachable', isInternetReachable);
    console.log('isConnected', isConnected);
  };
  return (
    <View
      style={{
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: Colors.backgroundPrimary,
      }}
    >
      <TouchableOpacity>
        <Ionicons name="menu" size={22} color={Colors.white} />
      </TouchableOpacity>

      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 16 }}>
          TobaFarm
        </Text>
        {isInternetReachable === false && (
          <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '700' }}>
            OFFLINE
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Ionicons name="create-outline" size={20} color={Colors.white} />
        <Ionicons name="settings-outline" size={20} color={Colors.white} 

        />
      </View>
    </View>
  );
}
