import { createContext, useContext } from "react";

export const AppContext = createContext(null);

/** 여러 기능이 함께 쓰는 상태와 동작 (AppProvider에서 제공) */
export const useApp = () => useContext(AppContext);
