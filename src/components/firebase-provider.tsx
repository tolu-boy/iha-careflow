"use client";

import * as React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { buildAuthUser } from "@/lib/auth-profile";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);

      try {
        const userSnapshot = await getDoc(userRef);

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
      } catch {
        setUser(buildAuthUser(firebaseUser));
      }
    });

    return unsubscribe;
  }, [setUser]);

  return <>{children}</>;
}
