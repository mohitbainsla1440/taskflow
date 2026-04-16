import { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { TaskBoard } from "./components/TaskBoard";
import { useAuth } from "./hooks/useAuth";

type AuthView = "login" | "register";

export function App() {
  const auth = useAuth();
  const [view, setView] = useState<AuthView>("login");

  if (auth.isAuthenticated) {
    return <TaskBoard auth={auth} />;
  }

  function switchTo(next: AuthView) {
    auth.clearError();
    setView(next);
  }

  if (view === "register") {
    return (
      <RegisterForm auth={auth} onSwitchToLogin={() => switchTo("login")} />
    );
  }

  return (
    <LoginForm auth={auth} onSwitchToRegister={() => switchTo("register")} />
  );
}
