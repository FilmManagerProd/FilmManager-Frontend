import axios from "axios";
import Constants from "expo-constants";
import { auth } from "@/firebase/firebase";

const { BASE_URL, API_KEY } = Constants.expoConfig.extra;

const instance = axios.create({
    baseURL: BASE_URL,
});

instance.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers["Authorization"] = `Bearer ${token}`;
            config.headers["bypass-tunnel-reminder"] = "true";
            config.headers["API_KEY"] = API_KEY;
        }

        config.headers["content-type"] = "application/json";
        config.headers["ngrok-skip-browser-warning"] = "true";

        return config;
    },
    (err) => Promise.reject(err)
);

export default instance;