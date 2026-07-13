import { useLocalSearchParams } from 'expo-router';
import { FriendProfileScreen } from '../../features/friends/screens/FriendProfileScreen';

export default function FriendProfileRoute() {
  const { id } = useLocalSearchParams();
  return <FriendProfileScreen id={id} />;
}
