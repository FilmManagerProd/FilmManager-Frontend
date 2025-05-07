import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";
import LanguageDetector from "i18next-react-native-language-detector";

import en from "./locales/en.json";
import cn from "./locales/cn.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    resources: {
      en: { translation: en },
      cn: { translation: cn },
    },
    fallbackLng: "cn",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
