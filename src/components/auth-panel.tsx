"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconHeartbeat, IconShieldLock } from "@tabler/icons-react";
import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildAuthUser } from "@/lib/auth-profile";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";

type AuthPanelProps = {
  mode: "login" | "register";
};

export function AuthPanel({ mode }: AuthPanelProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const authStatus = useAuthStore((state) => state.status);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/admin/dashboard");
    }
  }, [authStatus, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isRegister && !name.trim()) {
      setError("Enter the admin name for this account.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isRegister) {
        const fullName = name.trim();
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        await updateProfile(credential.user, {
          displayName: fullName,
        });

        const userProfile = {
          uid: credential.user.uid,
          userId: credential.user.uid,
          fullName,
          displayName: fullName,
          email: credential.user.email ?? email,
          role: "admin",
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "users", credential.user.uid), userProfile);

        setAuthUser(buildAuthUser(credential.user, userProfile));
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userSnapshot = await getDoc(doc(db, "users", credential.user.uid));

        setAuthUser(
          buildAuthUser(
            credential.user,
            userSnapshot.exists() ? userSnapshot.data() : undefined,
          ),
        );
      }

      router.replace("/admin/dashboard");
    } catch (authError) {
      if (isRegister && auth.currentUser) {
        await signOut(auth);
        setAuthUser(null);
      }

      setError(getAuthErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[1fr_0.82fr]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconHeartbeat className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold">IHA CareFlow</p>
              <p className="text-muted-foreground text-sm">
                Admin operations workspace
              </p>
            </div>
          </div>

          <Card className="rounded-lg shadow-xs">
            <CardHeader>
              <CardTitle className="text-2xl">
                {isRegister ? "Create admin account" : "Admin login"}
              </CardTitle>
              <CardDescription>
                {isRegister
                  ? "Set up access for the care operations dashboard."
                  : "Sign in to manage onboarding, billing, notes, messaging, and scheduling."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                {isRegister ? (
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      placeholder="Care team member"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@integrativehealthcarealliance.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">Password</Label>
                    {!isRegister ? (
                      <Link
                        href="#"
                        className="text-muted-foreground text-sm hover:text-foreground"
                      >
                        Forgot password?
                      </Link>
                    ) : null}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {isRegister ? (
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      required
                      minLength={6}
                    />
                  </div>
                ) : null}
                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                <Button className="mt-2 w-full" disabled={isSubmitting}>
                  {isSubmitting
                    ? isRegister
                      ? "Creating account..."
                      : "Signing in..."
                    : isRegister
                      ? "Create account"
                      : "Sign in"}
                  <IconArrowRight />
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center border-t text-sm">
              {isRegister ? (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link className="font-medium text-primary" href="/login">
                    Login
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Not a member?{" "}
                  <Link className="font-medium text-primary" href="/register">
                    Register
                  </Link>
                </p>
              )}
            </CardFooter>
          </Card>
        </div>
      </section>

      <aside className="hidden min-h-svh border-l bg-[linear-gradient(145deg,var(--primary),var(--chart-2))] p-10 text-primary-foreground lg:flex">
        <div className="flex h-full max-w-lg flex-col justify-between">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm">
            <IconShieldLock className="size-4" />
            Care team access
          </div>
          <div className="space-y-5">
            <p className="text-4xl font-semibold leading-tight">
              A calmer control room for whole-person care operations.
            </p>
            <p className="max-w-md text-base leading-7 text-white/80">
              Track intake readiness, insurance follow-ups, clinical
              documentation, patient messages, and provider schedules from one
              focused workspace.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-white/20 bg-white/10 p-3">
              <p className="text-2xl font-semibold">18</p>
              <p className="text-white/75">Onboarding</p>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 p-3">
              <p className="text-2xl font-semibold">7</p>
              <p className="text-white/75">Billing</p>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 p-3">
              <p className="text-2xl font-semibold">86%</p>
              <p className="text-white/75">Schedule</p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with that email.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in Firebase yet.";
    case "permission-denied":
    case "firestore/permission-denied":
      return "Firestore denied the profile save/read. Update and deploy the Firestore rules first.";
    default:
      return "Unable to complete authentication. Please try again.";
  }
}
