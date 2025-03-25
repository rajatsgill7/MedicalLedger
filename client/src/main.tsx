import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="medivault-theme">
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);
