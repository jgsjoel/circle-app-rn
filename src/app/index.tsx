import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth_store';

export default function Index() {

  const isLoggedIn = useAuthStore((state) => state.isAuthenticated);
  if (isLoggedIn) {
    return <Redirect href="/protected" />;
  }
  
  return <Redirect href="/landing" />;
}
