import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "VanSampada",
  description:
    "VanSampada",

};

export default function SignIn() {
  return <SignInForm />;
}
