"use client";
import { Button } from "~/components/ui/button";
import { signInWithGoogle } from "~/lib/auth-actions";
import React from "react";

const SignUpWithGoogleButton = () => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        signInWithGoogle();
      }}
    >
      Sign up with Google
    </Button>
  );
};

export default SignUpWithGoogleButton;
