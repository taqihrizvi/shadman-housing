import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, ShoppingCart, MapPin, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getUserRole } from "@/lib/rbac";

const projects = ["All Projects", "GREEN_VALLEY", "LAKE_VIEW", "PALM_HEIGHTS", "SUNSET_GARDENS"];
const sizes = ["All Sizes", "FIVE_MARLA", "SEVEN_MARLA", "TEN_MARLA", "ONE_KANAL", "TWO_KANAL"];
const blocks = ["Block A", "Block B", "Block C", "Block D"];

export default function UnsoldInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userRole = getUserRole();
  const isManager = userRole === 'MANAGER';
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("All Projects");
  const [selectedSize, setSelectedSize] = useState("All Sizes");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    plotNo: "",
    project: "",
    size: "",
    block: "",
    price: "",
    status: "",
    description: "",
  });

  // Fetch unsold inventory from API
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['unsoldInventory', selectedProject, selectedSize, searchTerm],
    queryFn: async () => {
      const params: any = { status: 'AVAILABLE,PENDING,RESERVED' };
      if (selectedProject !== "All Projects") params.project = selectedProject;
      if (searchTerm) params.search = searchTerm;
      const response = await inventoryAPI.getAll(params);
      return response.data;
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await inventoryAPI.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unsoldInventory'] });
      toast({
        title: "Property Updated",
        description: "The property has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update property",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditFormData({
      plotNo: item.plotNo,
      project: item.project,
      size: item.size,
      block: item.block,
      price: item.price.toString(),
      status: item.status,
      description: item.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updateData = {
      plotNo: editFormData.plotNo,
      project: editFormData.project,
      size: editFormData.size,
      block: editFormData.block,
      price: parseFloat(editFormData.price),
      status: editFormData.status,
      description: editFormData.description || undefined,
    };

    updateInventoryMutation.mutate({ id: editingItem.id, data: updateData });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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

  const filteredInventory = (inventoryData || []).filter((item: any) => {
    if (selectedSize !== "All Sizes") {
      return item.size === selectedSize;
    }
    return true;
  });

  const totalValue = filteredInventory.reduce((sum: number, item: any) => sum + (item.price || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unsold Inventory</h1>
            <p className="text-muted-foreground">
              Browse and manage available properties ({filteredInventory.length} properties)
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Quick Sale
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-warning">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Unsold</p>
                  <p className="text-2xl font-bold">{filteredInventory.length}</p>
                </div>
                <div className="rounded-xl bg-warning/10 p-3">
                  <MapPin className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">
                    {filteredInventory.filter(i => i.status === "available").length}
                  </p>
                </div>
                <div className="rounded-xl bg-success/10 p-3">
                  <ShoppingCart className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
                <div className="rounded-xl bg-accent/20 p-3">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by plot number..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {formatEnum(project)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size === "All Sizes" ? size : formatSize(size)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Available Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !filteredInventory || filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No unsold properties found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plot No.</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.plotNo}</TableCell>
                      <TableCell>{formatEnum(item.project)}</TableCell>
                      <TableCell>{formatSize(item.size)}</TableCell>
                      <TableCell>{item.block}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.price)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.status === "AVAILABLE" ? "default" : 
                            item.status === "PENDING" ? "secondary" : 
                            "outline"
                          }
                        >
                          {formatEnum(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(item)}
                          disabled={isManager}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>
                Update the property details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-plotNo">Plot Number *</Label>
                  <Input
                    id="edit-plotNo"
                    value={editFormData.plotNo}
                    onChange={(e) => setEditFormData({ ...editFormData, plotNo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project">Project *</Label>
                  <Select
                    value={editFormData.project}
                    onValueChange={(value) => setEditFormData({ ...editFormData, project: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.filter(p => p !== "All Projects").map((project) => (
                        <SelectItem key={project} value={project}>
                          {formatEnum(project)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-size">Size *</Label>
                  <Select
                    value={editFormData.size}
                    onValueChange={(value) => setEditFormData({ ...editFormData, size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.filter(s => s !== "All Sizes").map((size) => (
                        <SelectItem key={size} value={size}>
                          {size === "All Sizes" ? size : formatSize(size)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-block">Block *</Label>
                  <Select
                    value={editFormData.block}
                    onValueChange={(value) => setEditFormData({ ...editFormData, block: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (PKR) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="RESERVED">Reserved</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateInventoryMutation.isPending}>
                  {updateInventoryMutation.isPending ? "Updating..." : "Update Property"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
