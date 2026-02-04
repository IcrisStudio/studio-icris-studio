"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  Smartphone,
  QrCode,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ProofPreview } from "@/components/ProofPreview";

export default function PaymentMethodsPage() {
  const { user, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeType, setActiveType] = useState<"bank" | "wallet">("bank");

  const [bankDetails, setBankDetails] = useState({
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    qr_id: "" as any,
  });

  const [walletDetails, setWalletDetails] = useState({
    wallet_name: "Khalti",
    wallet_number: "",
    qr_id: "" as any,
  });

  const [bankQrFile, setBankQrFile] = useState<File | null>(null);
  const [walletQrFile, setWalletQrFile] = useState<File | null>(null);
  const [bankQrPreview, setBankQrPreview] = useState("");
  const [walletQrPreview, setWalletQrPreview] = useState("");

  const staffProfile = useQuery(api.users.getStaffProfile, {
    user_id: user?.id as any,
  });

  const updateStaffProfile = useMutation(api.users.updateStaffProfile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  useEffect(() => {
    if (staffProfile) {
      setBankDetails({
        bank_name: staffProfile.bank_name || "",
        account_holder_name: staffProfile.account_holder_name || "",
        account_number: staffProfile.account_number || "",
        qr_id: staffProfile.bank_qr_code || "",
      });

      setWalletDetails({
        wallet_name: staffProfile.wallet_name || "Khalti",
        wallet_number: staffProfile.wallet_number || "",
        qr_id: staffProfile.wallet_qr_code || "",
      });

      setActiveType(staffProfile.payment_method === "digital_wallet" ? "wallet" : "bank");
    }
  }, [staffProfile]);

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
          Administrative accounts manage payments through the Payroll dashboard.
        </div>
      </DashboardLayout>
    );
  }

  const handleFileChange = (type: "bank" | "wallet", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "bank") {
          setBankQrFile(file);
          setBankQrPreview(reader.result as string);
        } else {
          setWalletQrFile(file);
          setWalletQrPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (type: "bank" | "wallet") => {
    setIsSubmitting(true);
    try {
      let finalBankQr = bankDetails.qr_id;
      let finalWalletQr = walletDetails.qr_id;

      if (type === "bank" && bankQrFile) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": bankQrFile.type },
          body: bankQrFile,
        });
        const { storageId } = await result.json();
        finalBankQr = storageId;
      }

      if (type === "wallet" && walletQrFile) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": walletQrFile.type },
          body: walletQrFile,
        });
        const { storageId } = await result.json();
        finalWalletQr = storageId;
      }

      await updateStaffProfile({
        user_id: user!.id,
        role_name: staffProfile?.role_name || "Staff",
        payment_method: type === "bank" ? "bank_transfer" : "digital_wallet",
        bank_name: bankDetails.bank_name,
        account_holder_name: bankDetails.account_holder_name,
        account_number: bankDetails.account_number,
        bank_qr_code: finalBankQr,
        wallet_name: walletDetails.wallet_name,
        wallet_number: walletDetails.wallet_number,
        wallet_qr_code: finalWalletQr,
      });

      toast.success("Settings updated successfully");
      setBankQrFile(null);
      setWalletQrFile(null);
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl space-y-6 py-6 animate-in fade-in duration-500">
        <div className="text-left space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Payment Methods</h1>
          <p className="text-sm text-muted-foreground">Manage your payout settings for salary disbursements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4 space-y-2">
            <Button
              variant={activeType === "bank" ? "secondary" : "ghost"}
              className="w-full justify-start text-xs h-9 rounded-md px-4 shadow-none"
              onClick={() => setActiveType("bank")}
            >
              <Building2 className="mr-2 h-4 w-4" /> Bank Account
            </Button>
            <Button
              variant={activeType === "wallet" ? "secondary" : "ghost"}
              className="w-full justify-start text-xs h-9 rounded-md px-4 shadow-none"
              onClick={() => setActiveType("wallet")}
            >
              <Smartphone className="mr-2 h-4 w-4" /> Digital Wallet
            </Button>
          </div>

          <div className="md:col-span-8">
            <Card className="rounded-lg border shadow-none">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <CardTitle className="text-sm font-semibold">{activeType === "bank" ? "Bank Details" : "Wallet Details"}</CardTitle>
                <CardDescription className="text-xs">
                  Fill in your active {activeType === "bank" ? "bank account" : "mobile wallet"} information.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {activeType === "bank" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Bank Name</Label>
                        <Input
                          value={bankDetails.bank_name}
                          onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                          className="h-8 text-xs rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Account Holder</Label>
                        <Input
                          value={bankDetails.account_holder_name}
                          onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                          className="h-8 text-xs rounded-md shadow-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Account Number</Label>
                      <Input
                        value={bankDetails.account_number}
                        onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                        className="h-8 text-xs font-mono rounded-md shadow-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Provider</Label>
                        <Select
                          value={walletDetails.wallet_name}
                          onValueChange={(v) => setWalletDetails({ ...walletDetails, wallet_name: v })}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-md shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="shadow-none rounded-md">
                            <SelectItem value="Khalti" className="text-xs">Khalti</SelectItem>
                            <SelectItem value="eSewa" className="text-xs">eSewa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Number</Label>
                        <Input
                          value={walletDetails.wallet_number}
                          onChange={(e) => setWalletDetails({ ...walletDetails, wallet_number: e.target.value })}
                          className="h-8 text-xs font-bold rounded-md shadow-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">QR Code (Optional)</Label>
                  <div className="flex items-start gap-4">
                    {(activeType === "bank" ? (bankQrPreview || bankDetails.qr_id) : (walletQrPreview || walletDetails.qr_id)) ? (
                      <div className="relative h-24 w-24 rounded-md border p-1 bg-white ring-1 ring-border group">
                        {activeType === "bank" ? (
                          bankQrPreview ? <img src={bankQrPreview} className="h-full w-full object-contain" /> : <ProofPreview storageId={bankDetails.qr_id} />
                        ) : (
                          walletQrPreview ? <img src={walletQrPreview} className="h-full w-full object-contain" /> : <ProofPreview storageId={walletDetails.qr_id} />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            if (activeType === "bank") { setBankQrFile(null); setBankQrPreview(""); setBankDetails({ ...bankDetails, qr_id: "" }); }
                            else { setWalletQrFile(null); setWalletQrPreview(""); setWalletDetails({ ...walletDetails, qr_id: "" }); }
                          }}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-md border border-dashed flex flex-col items-center justify-center relative hover:bg-muted/50 cursor-pointer text-muted-foreground">
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(activeType, e)} />
                        <QrCode size={16} />
                        <span className="text-[8px] font-bold mt-1 uppercase tracking-tighter">Click to add</span>
                      </div>
                    )}
                    <div className="flex-1 space-y-1 text-left">
                      <p className="text-xs font-semibold">Instant Processing</p>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Suggested: Uploading your QR code helps our finance team process your payment without manual input errors.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => handleSave(activeType)}
                    disabled={isSubmitting}
                    size="sm"
                    className="w-full text-xs font-semibold rounded-md shadow-none h-9"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save {activeType === "bank" ? "Bank" : "Wallet"} Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
