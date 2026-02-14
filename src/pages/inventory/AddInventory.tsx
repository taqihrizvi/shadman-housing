import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PackagePlus, Save, RotateCcw } from "lucide-react";
import { inventoryAPI } from "@/lib/api";
import { useTranslation } from "react-i18next";

const projects = ["SHADMAN_GREENS"];
const sizes = ["FIVE_MARLA", "SEVEN_MARLA", "TEN_MARLA", "ONE_KANAL", "TWO_KANAL"];
const blocks = ["Block A", "Block B", "Block C", "Block D"];

const formatEnum = (value: string) => {
  return value
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const formatSize = (value: string) => {
  if (!value) return "";
  const sizeMap: { [key: string]: string } = {
    'FIVE_MARLA': '5 Marla',
    'SEVEN_MARLA': '7 Marla',
    'TEN_MARLA': '10 Marla',
    'ONE_KANAL': '1 Kanal',
    'TWO_KANAL': '2 Kanal',
  };
  return sizeMap[value] || formatEnum(value);
};

export default function AddInventory() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();

  // Helper function to format project names
  const formatProjectName = (value: string) => {
    if (!value) return "";
    // Check for translation first
    if (value === 'SHADMAN_GREENS') {
      const translated = t('projects.shadmanGreens');
      if (translated && !translated.startsWith('projects.')) return translated;
    }
    // Fallback to formatting the enum value
    return formatEnum(value);
  };

  const [formData, setFormData] = useState({
    plotNo: "",
    project: "",
    size: "",
    price: "",
    description: "",
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await inventoryAPI.create(data);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Inventory Added",
        description: `Plot ${data.plotNo} has been added successfully.`,
      });
      handleReset();
      navigate('/inventory/unsold');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add inventory",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert form data to API format
    const inventoryData = {
      plotNo: formData.plotNo,
      project: formData.project,
      size: formData.size,
      price: parseFloat(formData.price),
      description: formData.description || undefined,
      status: "AVAILABLE",
    };
    
    createInventoryMutation.mutate(inventoryData);
  };

  const handleReset = () => {
    setFormData({
      plotNo: "",
      project: "",
      size: "",
      price: "",
      description: "",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl" dir={isUrdu ? 'rtl' : 'ltr'}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('inventory.addInventory')}</h1>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <PackagePlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{t('inventory.title')}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plotNo">{t('inventory.plotNo')} *</Label>
                  <Input
                    id="plotNo"
                    placeholder="e.g., A-101"
                    value={formData.plotNo}
                    onChange={(e) => setFormData({ ...formData, plotNo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">{t('inventory.project')} *</Label>
                  <Select
                    value={formData.project}
                    onValueChange={(value) => setFormData({ ...formData, project: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('forms.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project} value={project}>
                          {formatProjectName(project)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">{t('inventory.size')} *</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => setFormData({ ...formData, size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('forms.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {formatSize(size)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="price">{t('inventory.price')} *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 2500000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">{t('inventory.description')}</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter any additional information about the property..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={createInventoryMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createInventoryMutation.isPending ? t('common.loading') : t('common.add')}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t('forms.resetForm')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
