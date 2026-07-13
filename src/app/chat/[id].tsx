import { useLocalSearchParams } from 'expo-router';
import { ChatRoomScreen } from '../../features/chat/screens/ChatRoomScreen';

export default function ChatRoomRoute() {
  const { id } = useLocalSearchParams();
  return <ChatRoomScreen chatId={String(id)} />;
}
