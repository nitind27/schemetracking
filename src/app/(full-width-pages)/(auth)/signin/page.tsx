import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scheme Monitoring & Tracking System",
  description:
    "Scheme Monitoring & Tracking System",
};

export default function SignIn() {
  return <SignInForm />;
}
