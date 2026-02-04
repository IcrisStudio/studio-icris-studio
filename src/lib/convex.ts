"use client";

import { createConvexClient } from "convex/react";

export const convex = createConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
