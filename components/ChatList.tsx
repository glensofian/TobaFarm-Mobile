import { useRef, useEffect } from "react";
import { FlatList } from "react-native";
import ChatBubble from "./ChatBubble";

export default function ChatList({ data }: any) {
  const flatListRef = useRef<FlatList>(null);
  const isAtBottomRef = useRef(true);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Check if the user is within 100 pixels of the bottom
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    isAtBottomRef.current = isAtBottom;
  };

  const handleContentSizeChange = () => {
    if (isAtBottomRef.current) {
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (data.length > 0 && isAtBottomRef.current) {
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
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 20,
      }}
      onContentSizeChange={handleContentSizeChange}
      onLayout={() => {
        if (isAtBottomRef.current) scrollToBottom();
      }}
    />
  );
}