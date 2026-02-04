"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    CheckCircle2,
    Loader2,
    Upload,
    Copy,
    Building2,
    Smartphone,
    CreditCard,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ProofPreview } from "@/components/ProofPreview";
import { useStorageUrl } from "@/hooks/useStorageUrl";

interface PaymentSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: any | null;
}

export function PaymentSheet({ open, onOpenChange, payment }: PaymentSheetProps) {
    const processPayment = useMutation(api.payments.processPayment);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const directProfile = useQuery(
        api.users.getStaffProfile,
        payment ? { user_id: payment.staff_id } : "skip"
    );

    const [notes, setNotes] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);

    const staff = directProfile || payment?.staff_profile || {};
    const profileImageUrl = useStorageUrl(staff.profile_picture);
    const bankQrUrl = useStorageUrl(staff.bank_qr_code);
    const walletQrUrl = useStorageUrl(staff.wallet_qr_code);

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

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
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
            toast.success("Payment completed successfully");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to process payment");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!payment) return null;

    const isBank = (staff.payment_method || "bank_transfer") === "bank_transfer";
    const isCompleted = payment.status === "completed";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 overflow-hidden">
                <SheetHeader className="px-6 py-6 border-b">
                    <div className="flex items-center justify-between mb-2">
                        <SheetTitle>Payment Details</SheetTitle>
                        <Badge variant={isCompleted ? "secondary" : "outline"}>
                            {isCompleted ? "Completed" : "Pending"}
                        </Badge>
                    </div>
                    <SheetDescription>
                        Transaction #{payment._id.slice(-8)}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-140px)]">
                    <div className="px-6 py-6 space-y-6">

                        {/* Amount Card */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-medium">Payment Amount</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    NPR {payment.amount.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recipient Info */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-medium">Recipient</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={profileImageUrl || ""} />
                                        <AvatarFallback>{payment.staff_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold">{payment.staff_name}</p>
                                        <p className="text-sm text-muted-foreground">{staff.role_name || "Staff"}</p>
                                    </div>
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Method Details */}
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">
                                        {isBank ? "Bank Transfer" : "Digital Wallet"}
                                    </CardTitle>
                                    {isBank ? <Building2 className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isBank ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Bank Name</Label>
                                                <p className="font-medium">{staff.bank_name || "—"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Account Holder</Label>
                                                <p className="font-medium">{staff.account_holder_name || "—"}</p>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Account Number</Label>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-mono font-semibold">{staff.account_number || "—"}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopy(staff.account_number)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {staff.bank_qr_code && bankQrUrl && (
                                            <>
                                                <Separator />
                                                <div className="space-y-3">
                                                    <Label className="text-xs text-muted-foreground">Payment QR Code</Label>
                                                    <div className="w-full p-6 bg-muted rounded-lg">
                                                        <div className="w-full aspect-square max-w-sm mx-auto">
                                                            <img
                                                                src={bankQrUrl}
                                                                alt="Bank QR Code"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">{staff.wallet_name} Number</Label>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-mono font-semibold">{staff.wallet_number || "—"}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopy(staff.wallet_number)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {staff.wallet_qr_code && walletQrUrl && (
                                            <>
                                                <Separator />
                                                <div className="space-y-3">
                                                    <Label className="text-xs text-muted-foreground">Wallet QR Code</Label>
                                                    <div className="w-full p-6 bg-muted rounded-lg">
                                                        <div className="w-full aspect-square max-w-sm mx-auto">
                                                            <img
                                                                src={walletQrUrl}
                                                                alt="Wallet QR Code"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Authorization Section */}
                        {isCompleted ? (
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Completed
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Reference</Label>
                                        <p className="font-mono text-sm">{payment.notes || "—"}</p>
                                    </div>

                                    {payment.payment_proof && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Receipt</Label>
                                                <div className="rounded-lg overflow-hidden border">
                                                    <div className="h-48">
                                                        <ProofPreview storageId={payment.payment_proof} />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <Separator />

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Completed at</span>
                                        <span className="font-medium">
                                            {format(payment.paid_at || payment.created_at, "MMM d, yyyy HH:mm")}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-sm font-medium">Complete Payment</CardTitle>
                                    <CardDescription>Enter transaction details to finalize</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reference">Transaction Reference *</Label>
                                        <Input
                                            id="reference"
                                            placeholder="Enter reference number"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="proof">Payment Proof (Optional)</Label>
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                                            <input
                                                id="proof"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            <label htmlFor="proof" className="cursor-pointer">
                                                {preview ? (
                                                    <div className="space-y-2">
                                                        <img src={preview} alt="Preview" className="h-32 mx-auto rounded" />
                                                        <p className="text-sm text-muted-foreground">Click to change</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Click to upload receipt
                                                        </p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <Separator />

                                    <Button
                                        className="w-full"
                                        disabled={isProcessing || !notes}
                                        onClick={handleProcess}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Complete Transaction"
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
