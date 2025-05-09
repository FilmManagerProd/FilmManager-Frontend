import axios from "axios";
import Constants from "expo-constants";

const { BASE_URL, API_KEY } = Constants.expoConfig.extra;

const instance = axios.create({
    baseURL: BASE_URL,
});

instance.interceptors.request.use(
    (config) => {
        config.headers["Content-Type"] = "application/json";
        config.headers["API_KEY"] = API_KEY;
        config.headers["bypass-tunnel-reminder"] = "true";
        config.headers["ngrok-skip-browser-warning"] = "true";

        return config;
    },
    (err) => Promise.reject(err)
);

export default instance;