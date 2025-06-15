import { SignUpForm } from "./components/SignUpForm"
import ThemeToggle from "~/components/ThemeToggle"

const SignUpPage = () => {
    return (
        <div className="flex h-svh items-center bg-background relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <SignUpForm />
        </div>
    )
}

export default SignUpPage