import { LoginForm } from "./components/LoginForm"
import ThemeToggle from "~/components/ThemeToggle"

const LoginPage = () => {
    return (
        <div className="flex h-svh items-center bg-background relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <LoginForm />
        </div>
    )
}

export default LoginPage