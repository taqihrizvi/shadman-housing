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

const projects = ["GREEN_VALLEY", "LAKE_VIEW", "PALM_HEIGHTS", "SUNSET_GARDENS"];
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
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    plotNo: "",
    project: "",
    size: "",
    block: "",
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
      block: formData.block,
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
      block: "",
      price: "",
      description: "",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Inventory</h1>
          <p className="text-muted-foreground">
            Register a new plot or property to the system
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <PackagePlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Fill in all the required information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plotNo">Plot Number *</Label>
                  <Input
                    id="plotNo"
                    placeholder="e.g., A-101"
                    value={formData.plotNo}
                    onChange={(e) => setFormData({ ...formData, plotNo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={formData.project}
                    onValueChange={(value) => setFormData({ ...formData, project: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project} value={project}>
                          {formatEnum(project)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Plot Size *</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => setFormData({ ...formData, size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
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
                <div className="space-y-2">
                  <Label htmlFor="block">Block *</Label>
                  <Select
                    value={formData.block}
                    onValueChange={(value) => setFormData({ ...formData, block: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select block" />
                    </SelectTrigger>
                    <SelectContent>
                      {blocks.map((block) => (
                        <SelectItem key={block} value={block}>
                          {block}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="price">Price (PKR) *</Label>
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
                  <Label htmlFor="description">Additional Notes</Label>
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
                  {createInventoryMutation.isPending ? "Adding..." : "Add Property"}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
