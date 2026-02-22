import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { User, KeyRound } from "lucide-react";

export default function Profile() {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const updatePasswordMutation = useMutation({
        mutationFn: () => authAPI.updatePassword({ currentPassword, newPassword }),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Your password has been updated successfully.",
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({
                title: t('common.error'),
                description: "New password and confirm password do not match.",
                variant: "destructive",
            });
            return;
        }

        if (newPassword.length < 8) {
            toast({
                title: t('common.error'),
                description: "New password must be at least 8 characters long.",
                variant: "destructive",
            });
            return;
        }

        updatePasswordMutation.mutate();
    };

    return (
        <DashboardLayout>
            <div className="max-w-xl mx-auto space-y-6 mt-8">
                <div className="flex items-center gap-3">
                    <User className="h-8 w-8" />
                    <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5" />
                            Update Password
                        </CardTitle>
                        <CardDescription>
                            Ensure your account is using a long, random password to stay secure.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={updatePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                                    className="w-full sm:w-auto"
                                >
                                    {updatePasswordMutation.isPending ? t('common.loading') : "Update Password"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
