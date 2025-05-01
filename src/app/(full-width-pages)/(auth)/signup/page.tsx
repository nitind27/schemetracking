import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scheme Monitoring & Tracking System",
  description:
    "Scheme Monitoring & Tracking System",
};

export default function SignUp() {
  return <SignUpForm />;
}
