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
import { Search, Download, ShoppingCart, MapPin, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getUserRole } from "@/lib/rbac";
import { useTranslation } from "react-i18next";
import {
  formatCurrency,
  formatEnum,
  formatProjectName,
  formatSize,
  formatPlotType,
  formatPlotNumberInput
} from "@/utils/formatters";
import { PROJECTS, PROJECTS_WITH_ALL } from "@/constants/projects";

const sizes = ["All Sizes", "FIVE_MARLA", "SEVEN_MARLA", "TEN_MARLA", "ONE_KANAL", "TWO_KANAL"];

export default function UnsoldInventory() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userRole = getUserRole();
  const isManager = userRole === 'MANAGER';
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("All Projects");
  const [selectedSize, setSelectedSize] = useState("All Sizes");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    plotNo: "",
    project: "",
    size: "",
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
      price: item.price.toString(),
      status: item.status,
      description: item.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Prevent marking plots as SOLD or RESERVED from unsold inventory
    if (editFormData.status === 'SOLD' || editFormData.status === 'RESERVED') {
      toast({
        title: "Invalid Status",
        description: "Cannot mark plots as Sold or Reserved from this page. Plots become Reserved when Biyana is approved, and Sold when Sale Agreement is approved.",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      plotNo: editFormData.plotNo,
      project: editFormData.project,
      size: editFormData.size,
      price: parseFloat(editFormData.price),
      status: editFormData.status,
      description: editFormData.description || undefined,
    };

    updateInventoryMutation.mutate({ id: editingItem.id, data: updateData });
  };

  const filteredInventory = (inventoryData || []).filter((item: any) => {
    if (selectedSize !== "All Sizes") {
      return item.size === selectedSize;
    }
    return true;
  });

  const totalValue = filteredInventory.reduce((sum: number, item: any) => sum + (item.price || 0), 0);

  const getCardTitle = (cardType: string) => {
    switch (cardType) {
      case 'totalUnits': return t('inventory.unsoldInventory');
      case 'available': return t('inventory.available');
      case 'totalValue': return t('inventory.totalValue');
      default: return '';
    }
  };

  const renderCardTable = (cardType: string) => {
    let data: any[] = [];
    let columns: string[] = [];

    switch (cardType) {
      case 'totalUnits':
        data = filteredInventory.map((item: any) => ({
          plotNo: item.plotNo,
          project: formatProjectName(item.project, t),
          size: formatSize(item.size, t),
          plotType: formatPlotType(item.isCornerPlot),
          price: formatCurrency(item.price),
          status: formatEnum(item.status),
        }));
        columns = ['plotNo', 'project', 'size', 'plotType', 'price', 'status'];
        break;
      case 'available':
        data = filteredInventory.filter(i => i.status === "AVAILABLE").map((item: any) => ({
          plotNo: item.plotNo,
          project: formatProjectName(item.project, t),
          size: formatSize(item.size, t),
          plotType: formatPlotType(item.isCornerPlot),
          price: formatCurrency(item.price),
        }));
        columns = ['plotNo', 'project', 'size', 'plotType', 'price'];
        break;
      case 'totalValue':
        data = filteredInventory.map((item: any) => ({
          plotNo: item.plotNo,
          project: formatProjectName(item.project, t),
          price: formatCurrency(item.price),
        }));
        columns = ['plotNo', 'project', 'price'];
        break;
      default:
        return null;
    }

    return (
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{getCardTitle(cardType)}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setSelectedCard(null)}>
            {t('common.back')}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col} className="capitalize">
                    {t(`inventory.${col}`) || col.replace(/([A-Z])/g, ' $1').trim()}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    {t('inventory.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map(col => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" dir={isUrdu ? 'rtl' : 'ltr'}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('inventory.unsoldInventory')}</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {t('reports.exportPDF')}
            </Button>
            <Button>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {t('common.add')}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="border-l-4 border-l-warning cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedCard('totalUnits')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('inventory.unsoldInventory')}</p>
                  <p className="text-2xl font-bold">{filteredInventory.length}</p>
                </div>
                <div className="rounded-xl bg-warning/10 p-3">
                  <MapPin className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className="border-l-4 border-l-success cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedCard('available')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('inventory.available')}</p>
                  <p className="text-2xl font-bold">
                    {filteredInventory.filter(i => i.status === "AVAILABLE").length}
                  </p>
                </div>
                <div className="rounded-xl bg-success/10 p-3">
                  <ShoppingCart className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className="border-l-4 border-l-accent cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedCard('totalValue')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('inventory.totalValue')}</p>
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
        {!selectedCard && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('common.search')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('inventory.project')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECTS_WITH_ALL.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project === "All Projects" ? project : formatProjectName(project, t)}
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
                        {size === "All Sizes" ? size : formatSize(size, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conditional Rendering: Table or Card Detail */}
        {selectedCard ? (
          renderCardTable(selectedCard)
        ) : (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>{t('inventory.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
              ) : !filteredInventory || filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t('inventory.noData')}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('inventory.plotNo')}</TableHead>
                      <TableHead>{t('inventory.project')}</TableHead>
                      <TableHead>{t('inventory.size')}</TableHead>
                      <TableHead>Plot Type</TableHead>
                      <TableHead>{t('inventory.price')}</TableHead>
                      <TableHead>{t('inventory.status')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.plotNo}</TableCell>
                        <TableCell>{formatProjectName(item.project, t)}</TableCell>
                        <TableCell>{formatSize(item.size, t)}</TableCell>
                        <TableCell>
                          <Badge variant={item.isCornerPlot ? "secondary" : "outline"}>
                            {formatPlotType(item.isCornerPlot)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
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
                            {t('common.edit')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('common.edit')} {t('inventory.title')}</DialogTitle>
              <DialogDescription>
                {t('forms.fillForm')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-plotNo">Plot Number *</Label>
                  <Input
                    id="edit-plotNo"
                    value={editFormData.plotNo}
                    onChange={(e) => setEditFormData({ ...editFormData, plotNo: formatPlotNumberInput(e.target.value) })}
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
                      {PROJECTS.map((project) => (
                        <SelectItem key={project} value={project}>
                          {formatProjectName(project, t)}
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
                          {size === "All Sizes" ? size : formatSize(size, t)}
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
                      <SelectItem value="AVAILABLE">{isUrdu ? 'دستیاب' : 'Available'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {editingItem?.status === 'RESERVED'
                      ? (isUrdu ? 'محفوظ شدہ پلاٹس کو دستیاب پر واپس تبدیل کر سکتے ہیں۔' : 'You can change Reserved plots back to Available.')
                      : (isUrdu ? 'پلاٹ خودکار طور پر محفوظ/فروخت شدہ ہو جاتے ہیں جب فارم منظور ہوتے ہیں۔' : 'Plots are automatically marked Reserved/Sold when forms are approved.')
                    }
                  </p>
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
                <Button type="submit" disabled={updateInventoryMutation.isPending}>
                  {updateInventoryMutation.isPending ? t('common.loading') : t('common.update')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
