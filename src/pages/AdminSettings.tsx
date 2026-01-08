import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Upload, Save, User } from "lucide-react";
import { getUserData } from "@/lib/rbac";

export default function AdminSettings() {
  const userData = getUserData();
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }
      setSignatureFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!signatureFile) {
      toast({
        title: "Error",
        description: "Please select a signature image",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('signature', signatureFile);

      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/auth/upload-signature', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        // Update user data in localStorage
        const currentUser = getUserData();
        if (currentUser) {
          localStorage.setItem('userData', JSON.stringify({
            ...currentUser,
            signature: result.data.signature,
          }));
        }

        toast({
          title: "Success",
          description: "Signature uploaded successfully",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload signature",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-8 w-8" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your admin profile and signature
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={userData?.name || ''} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={userData?.email || ''} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={userData?.role || ''} disabled />
              </div>
            </CardContent>
          </Card>

          {/* E-Signature Upload */}
          <Card>
            <CardHeader>
              <CardTitle>E-Signature</CardTitle>
              <CardDescription>Upload your digital signature for forms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="signature">Signature Image</Label>
                <Input
                  id="signature"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: PNG or JPG with transparent background, 200x80px
                </p>
              </div>

              {previewUrl && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <img 
                    src={previewUrl} 
                    alt="Signature preview" 
                    className="max-h-20 border border-border"
                  />
                </div>
              )}

              <Button onClick={handleUpload} disabled={!signatureFile}>
                <Save className="mr-2 h-4 w-4" />
                Upload Signature
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
