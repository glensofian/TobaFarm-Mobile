import { FlatList } from 'react-native';
import ChatBubble from './ChatBubble';

export default function ChatList({ data }: any) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ChatBubble type={item.type} text={item.text} />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, }}
    />
  );
}
