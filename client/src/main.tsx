// Import Buffer polyfill trước tất cả để đảm bảo nó có sẵn
import './lib/polyfill/buffer';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
