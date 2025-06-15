'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import ThemeToggle from "~/components/ThemeToggle";

const LogoutPage = () => {
    const router = useRouter();
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Separate effect for navigation when countdown reaches 0
    useEffect(() => {
        if (countdown === 0) {
            router.push("/");
        }
    }, [countdown, router]);

    const handleRedirectNow = () => {
        router.push("/");
    };

    return (
        <div className="flex h-svh items-center justify-center bg-background relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <Card className="w-full max-w-md mx-4">
                <CardContent className="flex flex-col items-center space-y-6 p-8">
                    {/* Checkmark Icon */}
                    <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                        <svg
                            className="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    {/* Success Message */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-semibold text-foreground">
                            Logged Out Successfully
                        </h2>
                        <p className="text-muted-foreground">
                            You have been safely logged out of your account.
                        </p>
                    </div>

                    {/* Countdown and Loading */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                            <span className="text-sm text-muted-foreground">
                                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                                className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Manual Redirect Button */}
                    <Button 
                        onClick={handleRedirectNow}
                        variant="outline"
                        className="w-full"
                    >
                        Go to Home Now
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default LogoutPage;