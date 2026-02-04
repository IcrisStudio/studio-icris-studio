import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Key, User, Shield, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const PREDEFINED_ROLES = [
    "Content Creator",
    "Digital Marketer",
    "Animator",
    "Video Editor",
    "Cameraman",
    "Model",
    "Web Developer",
];

interface StaffSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: any | null; // If null, creating new
}

export function StaffSheet({ open, onOpenChange, staff }: StaffSheetProps) {
    const createUser = useMutation(api.users.create);
    const updateUser = useMutation(api.users.update);
    const updateProfile = useMutation(api.users.updateStaffProfile);

    const isEditing = !!staff;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        full_name: "",
        role_name: PREDEFINED_ROLES[0],
        status: "active",
    });

    useEffect(() => {
        if (staff) {
            setFormData({
                username: staff.username || "",
                password: "", // Don't show hashed password
                full_name: staff.full_name || "",
                role_name: staff.role_name || PREDEFINED_ROLES[0],
                status: staff.status || "active",
            });
        } else {
            setFormData({
                username: "",
                password: "",
                full_name: "",
                role_name: PREDEFINED_ROLES[0],
                status: "active",
            });
        }
    }, [staff, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing) {
                // Update user core info
                await updateUser({
                    userId: staff.id,
                    username: formData.username,
                    full_name: formData.full_name,
                    status: formData.status,
                    ...(formData.password ? { password: formData.password } : {}),
                });

                // Update profile role
                await updateProfile({
                    user_id: staff.id,
                    role_name: formData.role_name,
                    payment_method: staff.payment_method || "bank_transfer", // Keep existing or default
                });

                toast.success("Staff updated successfully");
            } else {
                const result = await createUser({
                    username: formData.username,
                    password: formData.password,
                    full_name: formData.full_name,
                    role: "staff",
                });

                // Create initial profile with role
                await updateProfile({
                    user_id: result.userId,
                    role_name: formData.role_name,
                    payment_method: "bank_transfer",
                });

                toast.success("Staff created successfully");
            }
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[500px] w-full p-0 bg-background/95 backdrop-blur-xl border-l shadow-none">
                <ScrollArea className="h-full">
                    <div className="p-6 space-y-8">
                        <SheetHeader>
                            <SheetTitle className="text-2xl font-bold">
                                {isEditing ? "Edit Team Member" : "Add Team Member"}
                            </SheetTitle>
                            <SheetDescription>
                                {isEditing ? "Modify account details and access levels." : "Create a new account for a studio staff member."}
                            </SheetDescription>
                        </SheetHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Profile Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <User className="h-4 w-4" />
                                    <h3 className="text-sm font-semibold uppercase tracking-wider">Personal Information</h3>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="e.g. Amrit Subedi"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Username / Email</Label>
                                        <Input
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="username or email"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Security Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <Shield className="h-4 w-4" />
                                    <h3 className="text-sm font-semibold uppercase tracking-wider">Access & Role</h3>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Expertise / Role</Label>
                                        <Select
                                            value={formData.role_name}
                                            onValueChange={(v) => setFormData({ ...formData, role_name: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PREDEFINED_ROLES.map(role => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {isEditing && (
                                        <div className="space-y-2">
                                            <Label>Account Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(v) => setFormData({ ...formData, status: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="disabled">Disabled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Password Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <Key className="h-4 w-4" />
                                    <h3 className="text-sm font-semibold uppercase tracking-wider">Password Management</h3>
                                </div>
                                <div className="space-y-2">
                                    <Label>{isEditing ? "Reset Password (optional)" : "Initial Password"}</Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={isEditing ? "Leave blank to keep current" : "Set login password"}
                                        required={!isEditing}
                                    />
                                    {isEditing && (
                                        <p className="text-[10px] text-muted-foreground italic">Admin can reset passwords but cannot see the current one due to encryption.</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 pb-12">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg shadow-none"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> saving...</>
                                    ) : (
                                        isEditing ? "Update Staff" : "Register Member"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
