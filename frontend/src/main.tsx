import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

/**
 * React 앱이 시작되는 진입점.
 * index.html 의 #root 에 App 컴포넌트를 그려 넣습니다.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
