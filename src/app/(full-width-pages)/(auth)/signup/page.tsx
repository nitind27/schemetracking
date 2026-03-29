import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "VanSampada",
  description:
    "VanSampada",

};

export default function SignUp() {
  return <SignUpForm />;
}
