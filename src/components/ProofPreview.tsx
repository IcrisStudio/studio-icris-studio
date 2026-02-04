import { useState } from "react";
import { useStorageUrl } from "@/hooks/useStorageUrl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Eye } from "lucide-react";

export function ProofPreview({ storageId }: { storageId: any }) {
    const url = useStorageUrl(storageId);
    const [isOpen, setIsOpen] = useState(false);

    if (!storageId || !url) return null;

    return (
        <>
            <div
                className="group relative h-10 w-10 sm:h-12 sm:w-12 rounded-lg border bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
            >
                <img src={url} alt="Proof" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="h-4 w-4 text-white" />
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-3xl p-0 bg-transparent border-none shadow-none text-center sm:text-left backdrop-blur-sm">
                    <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black/50 border border-white/10 p-1">
                        <img src={url} alt="Proof Full" className="max-h-[85vh] w-auto mx-auto rounded-lg" />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
