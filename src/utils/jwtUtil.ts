import { useAuthStore } from "../store/auth_store";

export function saveUserFromToken(token: string) {
    try {
      const payloadBase64 = token.split(".")[1];
      const decoded = JSON.parse(atob(payloadBase64)); // decode payload
  
      const userId = decoded.sub;
  
      if (userId) {
        const { setAuthenticated, setUserId } = useAuthStore.getState();
        console.log(`saving user id: ${userId}`);
        setUserId(userId);
        setAuthenticated(true);
      }
  
      return userId;
    } catch (err) {
      console.error("Invalid JWT", err);
      return null;
    }
  }
  