import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Upload, X, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ProofPreview } from "@/components/ProofPreview";

interface PaymentSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: any | null; // The payment record to process
}

export function PaymentSheet({ open, onOpenChange, payment }: PaymentSheetProps) {
    const processPayment = useMutation(api.payments.processPayment);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [notes, setNotes] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            setNotes("");
            setFile(null);
            setPreview("");
            setIsProcessing(false);
        }
    }, [open, payment]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleProcess = async () => {
        if (!payment) return;
        setIsProcessing(true);
        try {
            let storageId: string | null = null;

            if (file) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                if (!result.ok) throw new Error("Upload failed");
                const json = await result.json();
                storageId = json.storageId;
            }

            await processPayment({
                paymentId: payment._id,
                payment_proof: storageId as any,
                notes: notes,
            });

            toast.success("Payment processed successfully");
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to process payment");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!payment) return null;

    const staff = payment.staff_profile || {};
    const isBank = staff.payment_method === "bank_transfer";
    const isCompleted = payment.status === "completed";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[550px] w-full p-0 bg-background/95 backdrop-blur-xl border-l shadow-none">
                <ScrollArea className="h-full">
                    <div className="p-6 space-y-8">
                        <SheetHeader>
                            <SheetTitle className="text-2xl font-bold">
                                {isCompleted ? "Payment Record" : "Process Payment"}
                            </SheetTitle>
                            <SheetDescription>
                                {isCompleted ? "Details of this completed transaction." : "Review details and confirm transaction."}
                            </SheetDescription>
                        </SheetHeader>

                        {/* Amount Card */}
                        <div className="bg-primary/5 rounded-2xl p-6 text-center border shadow-none border-primary/10">
                            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-2">Total Amount</p>
                            <div className="text-5xl font-black text-primary tracking-tight">
                                <span className="text-2xl align-top mr-1">NPR</span>
                                {payment.amount.toLocaleString()}
                            </div>
                        </div>

                        {/* Staff Details */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recipient</h4>
                            <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-none">
                                <Avatar className="h-12 w-12 border shadow-none">
                                    <AvatarImage src={staff.profile_picture} />
                                    <AvatarFallback className="font-bold">{payment.staff_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold text-lg leading-none">{payment.staff_name}</div>
                                    <div className="text-sm text-muted-foreground mt-1">{staff.role_name}</div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border bg-card shadow-none space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{isBank ? "Bank Transfer" : "Digital Wallet"}</span>
                                </div>

                                {isBank ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-tighter opacity-70">Bank Name</p>
                                                <p className="font-bold text-base">{staff.bank_name || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-tighter opacity-70">Account Holder</p>
                                                <p className="font-bold text-base">{staff.account_holder_name || "N/A"}</p>
                                            </div>
                                            <div className="col-span-2 bg-muted/30 p-4 rounded-xl border-border/50 border">
                                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-tighter opacity-70 mb-1">Account Number</p>
                                                <p className="font-mono text-xl font-black tracking-tight select-all">{staff.account_number || "N/A"}</p>
                                            </div>
                                        </div>

                                        {/* QR Code Section */}
                                        <div className="pt-2">
                                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3">Scan-to-Pay QR</p>
                                            {staff.bank_qr_code ? (
                                                <div className="bg-white p-3 rounded-2xl border w-fit shadow-xl shadow-black/5 mx-auto sm:mx-0 ring-1 ring-border">
                                                    <div className="h-40 w-40 overflow-hidden rounded-xl">
                                                        <ProofPreview storageId={staff.bank_qr_code} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 border-dashed text-center">
                                                    <p className="text-xs font-bold text-orange-700">No QR Code Available</p>
                                                    <p className="text-[10px] text-orange-600 font-medium mt-1">
                                                        Staff QR codes are highly suggested for faster processing.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-4 text-sm">
                                            <div className="bg-muted/30 p-4 rounded-xl border-border/50 border">
                                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-tighter opacity-70 mb-1">{staff.wallet_name || "Wallet"} Number</p>
                                                <p className="font-mono text-xl font-black tracking-tight select-all">{staff.wallet_number || "N/A"}</p>
                                            </div>
                                        </div>

                                        {/* QR Code Section */}
                                        <div className="pt-2">
                                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3">Wallet QR Preview</p>
                                            {staff.wallet_qr_code ? (
                                                <div className="bg-white p-3 rounded-2xl border w-fit shadow-xl shadow-black/5 mx-auto sm:mx-0 ring-1 ring-border">
                                                    <div className="h-40 w-40 overflow-hidden rounded-xl">
                                                        <ProofPreview storageId={staff.wallet_qr_code} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 border-dashed text-center">
                                                    <p className="text-xs font-bold text-orange-700">No Digital QR Provided</p>
                                                    <p className="text-[10px] text-orange-600 font-medium mt-1">
                                                        Suggest the staff to upload a QR for instant processing.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions or Record Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                {isCompleted ? "Transaction Detail" : "Transaction Record"}
                            </h4>

                            {isCompleted ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl border bg-muted/30 shadow-none">
                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Reference ID</p>
                                        <p className="font-mono text-base break-all select-all">{payment.notes || "No reference provided"}</p>
                                    </div>

                                    {payment.payment_proof && (
                                        <div className="space-y-2">
                                            <Label>Payment Receipt</Label>
                                            <div className="rounded-xl border overflow-hidden p-1 bg-card">
                                                <ProofPreview storageId={payment.payment_proof} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-sm pt-4 border-t">
                                        <span className="text-muted-foreground">Processed On</span>
                                        <span className="font-medium">{format(payment.paid_at || payment.created_at, "PPP p")}</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>Transaction Reference / ID</Label>
                                        <Input
                                            placeholder="e.g. 238290382092"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="shadow-none border-muted-foreground/20"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Payment Proof (Optional)</Label>
                                        <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                            />
                                            {preview ? (
                                                <div className="relative">
                                                    <img src={preview} alt="Proof" className="max-h-32 mx-auto rounded-lg" />
                                                    <Button
                                                        variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-none"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setFile(null);
                                                            setPreview("");
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="py-4">
                                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground">Click to upload receipt image</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 pb-8">
                                        <Button
                                            className="w-full text-lg h-12 shadow-none"
                                            onClick={handleProcess}
                                            disabled={isProcessing || !notes}
                                        >
                                            {isProcessing ? (
                                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                                            ) : (
                                                <><CheckCircle className="mr-2 h-5 w-5" /> Confirm Payment</>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
