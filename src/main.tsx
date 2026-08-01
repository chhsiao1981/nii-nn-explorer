import { createRoot } from "react-dom/client";
import "./main.css";
import { StrictMode } from "react";
import { registerThunk } from "use-thunk";
import App from "./components/App.tsx";
import * as DoApp from "./thunks/app";

registerThunk(DoApp);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
