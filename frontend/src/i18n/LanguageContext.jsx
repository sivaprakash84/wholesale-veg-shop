import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  translations,
} from "./translations";

import {
  defaultLanguage,
} from "./languages";

const LanguageContext =
  createContext(null);

export function LanguageProvider({
  children,
}) {
  const [
    language,
    setLanguageState,
  ] = useState(() => {
    return (
      localStorage.getItem(
        "customerLanguage"
      ) || defaultLanguage
    );
  });

  useEffect(() => {
    localStorage.setItem(
      "customerLanguage",
      language
    );

    document.documentElement.lang =
      language;
  }, [language]);

  const setLanguage = (newLanguage) => {
    if (
      translations[newLanguage]
    ) {
      setLanguageState(
        newLanguage
      );
    }
  };

  const t = (key) => {
    return (
      translations[language]?.[key] ||
      translations[defaultLanguage]?.[
        key
      ] ||
      key
    );
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}