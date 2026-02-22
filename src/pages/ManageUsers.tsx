import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { UserPlus, UserCog, UserMinus, UserCheck, Search, Shield, UserPen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usersAPI } from "@/lib/api";
import { type UserRole } from "@/lib/rbac";

export default function ManageUsers() {
    const { t, i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "MANAGER" as UserRole,
        signature: null as File | null,
    });

    // Fetch users
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersAPI.getAll(),
    });

    const users = usersData?.data || [];

    // Create user mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => usersAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: t('users.createSuccess') });
            setIsAddOpen(false);
            setFormData({ name: "", email: "", password: "", role: "MANAGER", signature: null });
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.message,
                variant: "destructive"
            });
        }
    });

    // Update user mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => usersAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: t('users.updateSuccess') });
            setIsEditOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();

        let submitData: any = formData;

        // Use FormData if there is a signature upload
        if (formData.signature || formData.role === 'ADMIN') {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('email', formData.email);
            fd.append('password', formData.password);
            fd.append('role', formData.role);
            if (formData.signature) {
                fd.append('signature', formData.signature);
            }
            submitData = fd;
        }

        createMutation.mutate(submitData);
    };

    const handleUpdateStatus = (user: any) => {
        updateMutation.mutate({
            id: user.id,
            data: { isActive: !user.isActive }
        });
    };

    const filteredUsers = users.filter((user: any) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
                        <p className="text-muted-foreground">{t('approvals.reviewUsersDescription', 'Manage system users and their roles')}</p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                {t('users.addUser')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('users.addUser')}</DialogTitle>
                                <DialogDescription></DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('users.name')}</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('users.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('users.password')}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">{t('users.role')}</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.role === 'ADMIN' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="signature">{t('printableForms.signature')} (Optional)</Label>
                                        <Input
                                            id="signature"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setFormData({ ...formData, signature: e.target.files ? e.target.files[0] : null })}
                                        />
                                        <p className="text-xs text-muted-foreground">Upload a signature image for approving forms and vouchers.</p>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? t('common.loading') : t('common.save')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{t('nav.users')}</CardTitle>
                                <CardDescription>{t('common.allRecords', 'View all registered users')}</CardDescription>
                            </div>
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('common.search')}
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('users.name')}</TableHead>
                                        <TableHead>{t('users.email')}</TableHead>
                                        <TableHead>{t('users.role')}</TableHead>
                                        <TableHead>{t('users.status')}</TableHead>
                                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                {t('common.loading')}
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                {t('common.noData')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user: any) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'MANAGER' ? 'secondary' : 'outline'}>
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={user.isActive ? 'default' : 'destructive'}
                                                        className={user.isActive ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : ''}
                                                    >
                                                        {user.isActive ? t('users.active') : t('users.inactive')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleUpdateStatus(user)}
                                                        title={user.isActive ? t('users.deactivate') : t('users.activate')}
                                                    >
                                                        {user.isActive ? <UserMinus className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout >
    );
}
