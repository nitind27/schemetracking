import { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | Scheme Tracking System",
  description: "Reset your password",
};

export default function ForgotPassword() {
  return <ForgotPasswordForm />;
}

