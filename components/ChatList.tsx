import { useRef, useEffect } from "react";
import { FlatList } from "react-native";
import ChatBubble from "./ChatBubble";

export default function ChatList({ data }: any) {
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (data.length > 0) {
      scrollToBottom();
    }
  }, [data]);

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ChatBubble type={item.type} text={item.text} />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 20,
      }}
      onContentSizeChange={scrollToBottom}
      onLayout={scrollToBottom}
    />
  );
}
