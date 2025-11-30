import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/auth_store";

interface User {
    name: string;
    mobile: string;
    otp?: string;
}

const BASE_URL = 'http://37.60.242.176:8001/';

export async function createOrUpdate(user: User): Promise<boolean> {
    try {
        const response = await fetch(BASE_URL+'auth/request-otp', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: user.name,
                mobile: user.mobile,
            }),
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        return true; 
    } catch (error) {
        console.error("Error creating/updating user:", error);
        throw error;
    }
}





export async function verifyOtp(user: User): Promise<boolean> {
    try {
        const response = await fetch(BASE_URL + "auth/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: user.name,
                mobile: user.mobile,
                otp: user.otp,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OTP verification failed:", data);
            return false;
        }

        if (data.token) {
            await AsyncStorage.setItem("token", data.token);

            // ---- 🔥 Update Zustand store ----
            const authStore = useAuthStore.getState();
            authStore.setAuthenticated(true);

            console.log("Token saved + auth state updated");
            return true;
        }

        console.error("No token found in response");
        return false;

    } catch (error) {
        console.error("Error verifying user:", error);
        throw error;
    }
}

function decodeJwt(token: string) {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return decoded;
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
}

export async function checkAuthStatus(): Promise<boolean> {
    try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
            // No token → definitely not authenticated
            useAuthStore.getState().setAuthenticated(false);
            return false;
        }

        const payload = decodeJwt(token);
        if (!payload || !payload.exp) {
            useAuthStore.getState().setAuthenticated(false);
            return false;
        }

        const currentTime = Math.floor(Date.now() / 1000); // seconds

        // Check if token is expired
        const isValid = payload.exp > currentTime;

        // Update Zustand
        useAuthStore.getState().setAuthenticated(isValid);

        return isValid;
    } catch (error) {
        console.error("Error checking auth:", error);
        useAuthStore.getState().setAuthenticated(false);
        return false;
    }
}