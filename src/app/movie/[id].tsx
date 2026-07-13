import { useLocalSearchParams } from 'expo-router';
import { MovieScreen } from '../../features/movie/screens/MovieScreen';

export default function MovieDetailsRoute() {
  const { id } = useLocalSearchParams();
  return <MovieScreen movieId={String(id)} />;
}
