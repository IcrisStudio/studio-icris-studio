import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TASK_TYPES = [
    "Video Production",
    "Photography",
    "Animation",
    "Digital Marketing",
    "Web Development",
    "Graphic Design",
];

interface TaskSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: any | null; // If null, we are creating a new task
}

export function TaskSheet({ open, onOpenChange, task }: TaskSheetProps) {
    const createTask = useMutation(api.tasks.create);
    const updateTask = useMutation(api.tasks.update);
    const assignStaff = useMutation(api.tasks.assignStaff);
    const removeAssignment = useMutation(api.tasks.removeAssignment);
    const activeStaff = useQuery(api.users.listActiveStaff);

    const isEditing = !!task;

    // Form State
    const [formData, setFormData] = useState({
        project_name: "",
        client_name: "",
        task_type: TASK_TYPES[0],
        deadline: "",
        received_date: new Date().toISOString().split("T")[0],
        total_budget: "",
        payment_status: "pending",
        payment_received_amount: "0",
        income_status: "pending",
    });

    // Assignment State (only for editing)
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [assignForm, setAssignForm] = useState({
        staff_id: "",
        assigned_role: "",
        assigned_salary: "",
    });

    useEffect(() => {
        if (task) {
            setFormData({
                project_name: task.project_name,
                client_name: task.client_name,
                task_type: task.task_type,
                deadline: new Date(task.deadline).toISOString().split("T")[0],
                received_date: new Date(task.received_date).toISOString().split("T")[0],
                total_budget: task.total_budget.toString(),
                payment_status: task.payment_status,
                payment_received_amount: task.payment_received_amount?.toString() || "0",
                income_status: task.income_status || "pending",
            });
        } else {
            // Reset defaults for create
            setFormData({
                project_name: "",
                client_name: "",
                task_type: TASK_TYPES[0],
                deadline: "",
                received_date: new Date().toISOString().split("T")[0],
                total_budget: "",
                payment_status: "pending",
                payment_received_amount: "0",
                income_status: "pending",
            });
        }
        setShowAssignForm(false);
    }, [task, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const totalBudget = parseFloat(formData.total_budget);
            const paymentReceived = parseFloat(formData.payment_received_amount);
            const remaining = totalBudget - paymentReceived;

            const payload = {
                project_name: formData.project_name,
                client_name: formData.client_name,
                task_type: formData.task_type,
                deadline: new Date(formData.deadline).getTime(),
                received_date: new Date(formData.received_date).getTime(),
                total_budget: totalBudget,
                payment_status: formData.payment_status,
                payment_received_amount: paymentReceived,
                remaining_amount: remaining,
                income_status: formData.income_status,
            };

            if (isEditing) {
                await updateTask({
                    taskId: task._id,
                    ...payload,
                });
                toast.success("Task updated successfully");
                onOpenChange(false);
            } else {
                await createTask(payload);
                toast.success("Task created successfully");
                onOpenChange(false);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save task");
        }
    };

    const handleAssignSubmit = async () => {
        if (!task) return;
        try {
            await assignStaff({
                task_id: task._id,
                staff_id: assignForm.staff_id as any,
                assigned_role: assignForm.assigned_role,
                assigned_salary: parseFloat(assignForm.assigned_salary),
            });
            toast.success("Staff assigned");
            setShowAssignForm(false);
            setAssignForm({ staff_id: "", assigned_role: "", assigned_salary: "" });
        } catch (error: any) {
            toast.error("Failed to assign staff");
        }
    };

    // Helper to load assignments if editing
    // Note: 'task' prop might not have assignments if it comes from the list query
    // We should ideally fetch task details or if the parent passes enriched task.
    // The parent (TasksPage) is fetching the list, which currently DOES NOT return assignments in the simple list query.
    // Wait, the `list` query inside `convex/tasks.ts` is simple.
    // But `getById` returns assignments.
    // Maybe I should fetch the specific task details inside this sheet if we are editing?

    const taskDetails = useQuery(api.tasks.getById, isEditing ? { taskId: task._id } : "skip");

    const assignments = taskDetails?.assignments || [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] w-full p-0 gap-0 bg-background/95 backdrop-blur-xl">
                <ScrollArea className="h-full">
                    <div className="p-6">
                        <SheetHeader className="mb-6">
                            <SheetTitle className="text-2xl font-semibold tracking-tight">
                                {isEditing ? "Edit Task" : "Create New Task"}
                            </SheetTitle>
                            <SheetDescription>
                                {isEditing ? "Update task details, payments, and staff assignments." : "Fill in the details to register a new project."}
                            </SheetDescription>
                        </SheetHeader>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Project Info Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Project Details</h3>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Project Name</Label>
                                            <Input
                                                value={formData.project_name}
                                                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                                                placeholder="e.g. Wedding Shoot"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Client Name</Label>
                                            <Input
                                                value={formData.client_name}
                                                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                                placeholder="e.g. John Doe"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Task Type</Label>
                                            <Select
                                                value={formData.task_type}
                                                onValueChange={(v) => setFormData({ ...formData, task_type: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Deadline</Label>
                                            <Input
                                                type="date"
                                                value={formData.deadline}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Financials Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Financials</h3>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Total Budget (NPR)</Label>
                                            <Input
                                                type="number"
                                                value={formData.total_budget}
                                                onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Received Amount (NPR)</Label>
                                            <Input
                                                type="number"
                                                value={formData.payment_received_amount}
                                                onChange={(e) => setFormData({ ...formData, payment_received_amount: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Payment Status</Label>
                                            <Select
                                                value={formData.payment_status}
                                                onValueChange={(v) => {
                                                    setFormData({
                                                        ...formData,
                                                        payment_status: v,
                                                        income_status: v === 'paid' ? 'received' : (v === 'partial' ? 'partial' : 'pending')
                                                    });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="partial">Partial</SelectItem>
                                                    <SelectItem value="paid">Paid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Income Status</Label>
                                            <Select
                                                value={formData.income_status}
                                                onValueChange={(v) => setFormData({ ...formData, income_status: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Awaiting</SelectItem>
                                                    <SelectItem value="partial">Partial</SelectItem>
                                                    <SelectItem value="received">Received</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Received Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.received_date}
                                            onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" size="lg" className="w-full sm:w-auto">
                                    {isEditing ? "Save Changes" : "Create Task"}
                                </Button>
                            </div>
                        </form>

                        {isEditing && (
                            <>
                                <Separator className="my-8" />
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Staff Assignments</h3>
                                        {!showAssignForm && (
                                            <Button variant="outline" size="sm" onClick={() => setShowAssignForm(true)}>
                                                <UserPlus className="h-4 w-4 mr-2" /> Assign Staff
                                            </Button>
                                        )}
                                    </div>

                                    {showAssignForm && (
                                        <Card className="bg-muted/50 border-dashed">
                                            <CardContent className="p-4 space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Select Staff</Label>
                                                    <Select
                                                        value={assignForm.staff_id}
                                                        onValueChange={(v) => setAssignForm({ ...assignForm, staff_id: v })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a staff member" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(activeStaff as any[])?.map((s) => (
                                                                <SelectItem key={s._id} value={s._id}>{s.full_name || s.username}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Input
                                                        placeholder="Role (e.g. Editor)"
                                                        value={assignForm.assigned_role}
                                                        onChange={(e) => setAssignForm({ ...assignForm, assigned_role: e.target.value })}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Salary (NPR)"
                                                        value={assignForm.assigned_salary}
                                                        onChange={(e) => setAssignForm({ ...assignForm, assigned_salary: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setShowAssignForm(false)}>Cancel</Button>
                                                    <Button size="sm" onClick={handleAssignSubmit}>Assign</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="space-y-3">
                                        {assignments.map((assignment: any) => (
                                            <div key={assignment._id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {assignment.staff_name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{assignment.staff_name}</div>
                                                        <div className="text-xs text-muted-foreground">{assignment.assigned_role}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold">NPR {assignment.assigned_salary.toLocaleString()}</div>
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1">{assignment.payment_status}</Badge>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeAssignment({ assignmentId: assignment._id })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {assignments.length === 0 && !showAssignForm && (
                                            <p className="text-sm text-center text-muted-foreground py-4">No staff assigned yet.</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="h-10" /> {/* Spacer */}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
