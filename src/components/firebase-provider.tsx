"use client";

import * as React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import { buildAuthUser } from "@/lib/auth-profile";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);

  React.useEffect(() => {
    let unsubscribeUserProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeUserProfile?.();

      if (!firebaseUser) {
        setUser(null);
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);

      unsubscribeUserProfile = onSnapshot(
        userRef,
        async (userSnapshot) => {
          if (userSnapshot.exists()) {
            setUser(buildAuthUser(firebaseUser, userSnapshot.data()));
            return;
          }

          const fallbackUser = buildAuthUser(firebaseUser);

          await setDoc(
            userRef,
            {
              uid: fallbackUser.uid,
              userId: fallbackUser.userId,
              fullName: fallbackUser.fullName,
              displayName: fallbackUser.displayName,
              email: fallbackUser.email,
              role: fallbackUser.role,
              active: fallbackUser.active,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );

          setUser(fallbackUser);
        },
        () => {
          setUser(buildAuthUser(firebaseUser));
        },
      );
    });

    return () => {
      unsubscribeUserProfile?.();
      unsubscribeAuth();
    };
  }, [setUser]);

  return <>{children}</>;
}
