import { SignIn, SignUp } from "@clerk/nextjs";
import { Wordmark } from "@/components/wordmark";

const authAppearance = {
  variables: {
    colorPrimary: "#22D3EE",
    colorBackground: "#18181B",
    colorText: "#FAFAFA",
    colorTextSecondary: "#A1A1AA",
    colorInputBackground: "#09090B",
    colorInputText: "#FAFAFA",
    colorNeutral: "#27272A",
    borderRadius: "8px",
    fontFamily: "var(--font-inter), sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full border border-[#27272A] bg-[#18181B] shadow-none",
    headerTitle: "text-[#FAFAFA]",
    headerSubtitle: "text-[#A1A1AA]",
    socialButtonsBlockButton: "border border-[#27272A] text-[#FAFAFA]",
    formButtonPrimary: "bg-[#22D3EE] text-[#09090B] shadow-none hover:bg-[#22D3EE]/80",
    footerActionLink: "text-[#22D3EE]",
    formFieldInput: "border-[#27272A] bg-[#09090B] text-[#FAFAFA]",
    dividerLine: "bg-[#27272A]",
    footer: "bg-transparent",
  },
};

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Wordmark href="/" />
        </div>
        {mode === "sign-in" ? (
          <SignIn appearance={authAppearance} />
        ) : (
          <SignUp appearance={authAppearance} />
        )}
      </div>
    </main>
  );
}
