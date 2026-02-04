import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useStorageUrl(storageId: Id<"_storage"> | null | undefined) {
  const getUrl = useQuery(api.files.getFileUrl, storageId ? { storageId } : "skip");
  return getUrl;
}
