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
import { formatEnum, formatSize, formatProjectName, getMarlaCount, formatPlotNumberInput } from "@/utils/formatters";
import { PROJECTS } from "@/constants/projects";

const sizes = ["FIVE_MARLA", "SEVEN_MARLA", "TEN_MARLA", "ONE_KANAL", "TWO_KANAL"];
const blocks = ["Block A", "Block B", "Block C", "Block D"];

export default function AddInventory() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    plotNo: "",
    project: "",
    size: "",
    perMarlaPrice: "",
    isCornerPlot: "false",
    price: "",
    description: "",
  });

  // Calculate total price automatically when perMarlaPrice, size, or isCornerPlot changes
  const calculateTotalPrice = () => {
    if (!formData.perMarlaPrice || !formData.size) return "";

    const perMarla = parseFloat(formData.perMarlaPrice);
    const marlaCount = getMarlaCount(formData.size);
    const isCorner = formData.isCornerPlot === "true";

    // Add 10% if corner plot
    const adjustedPerMarlaPrice = isCorner ? perMarla * 1.1 : perMarla;
    const totalPrice = adjustedPerMarlaPrice * marlaCount;

    return totalPrice.toFixed(0);
  };

  // Update price whenever perMarlaPrice, size, or isCornerPlot changes
  const handlePerMarlaPriceChange = (value: string) => {
    setFormData(prev => ({ ...prev, perMarlaPrice: value }));
  };

  const handleSizeChange = (value: string) => {
    setFormData(prev => ({ ...prev, size: value }));
  };

  const handleCornerPlotChange = (value: string) => {
    setFormData(prev => ({ ...prev, isCornerPlot: value }));
  };

  // Effect to update price when dependencies change
  const calculatedPrice = calculateTotalPrice();

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

    const totalPrice = calculateTotalPrice();
    if (!totalPrice) {
      toast({
        title: "Error",
        description: "Please enter per marla price and select plot size",
        variant: "destructive",
      });
      return;
    }

    // Convert form data to API format
    const inventoryData = {
      plotNo: formData.plotNo,
      project: formData.project,
      size: formData.size,
      perMarlaPrice: parseFloat(formData.perMarlaPrice),
      isCornerPlot: formData.isCornerPlot === "true",
      price: parseFloat(totalPrice),
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
      perMarlaPrice: "",
      isCornerPlot: "false",
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
                    onChange={(e) => setFormData({ ...formData, plotNo: formatPlotNumberInput(e.target.value) })}
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
                      {PROJECTS.map((project) => (
                        <SelectItem key={project} value={project}>
                          {formatProjectName(project, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">{t('inventory.size')} *</Label>
                  <Select
                    value={formData.size}
                    onValueChange={handleSizeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('forms.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {formatSize(size, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perMarlaPrice">Per Marla Price *</Label>
                  <Input
                    id="perMarlaPrice"
                    type="number"
                    placeholder="e.g., 350000"
                    value={formData.perMarlaPrice}
                    onChange={(e) => handlePerMarlaPriceChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isCornerPlot">Plot Type *</Label>
                  <Select
                    value={formData.isCornerPlot}
                    onValueChange={handleCornerPlotChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plot type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Regular Plot</SelectItem>
                      <SelectItem value="true">Corner Plot (+10%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="price">Total Price (Calculated)</Label>
                  <Input
                    id="price"
                    type="text"
                    value={calculatedPrice ? `Rs ${parseFloat(calculatedPrice).toLocaleString('en-PK')}` : ""}
                    disabled
                    className="bg-muted font-semibold"
                    placeholder="Will be calculated automatically"
                  />
                  {formData.isCornerPlot === "true" && formData.perMarlaPrice && formData.size && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Base: Rs {parseFloat(formData.perMarlaPrice).toLocaleString('en-PK')} × {getMarlaCount(formData.size)} marlas + 10% corner premium = Rs {parseFloat(calculatedPrice).toLocaleString('en-PK')}
                    </p>
                  )}
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
