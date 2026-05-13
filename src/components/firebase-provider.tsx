"use client";

import * as React from "react";

import { getFirebaseAnalytics } from "@/lib/firebase";

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void getFirebaseAnalytics();
  }, []);

  return <>{children}</>;
}
