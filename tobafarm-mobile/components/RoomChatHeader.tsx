import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../styles';

export default function RoomChatHeader() {
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

      <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 16 }}>
        TobaFarm
      </Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Ionicons name="create-outline" size={20} color={Colors.white} />
        <Ionicons name="settings-outline" size={20} color={Colors.white} />
      </View>
    </View>
  );
}
