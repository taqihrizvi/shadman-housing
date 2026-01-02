import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, ShoppingCart, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const unsoldInventory = [
  { id: 1, plotNo: "A-103", project: "Green Valley", size: "5 Marla", location: "Block A", price: 2600000, status: "available" },
  { id: 2, plotNo: "A-104", project: "Green Valley", size: "10 Marla", location: "Block A", price: 4800000, status: "reserved" },
  { id: 3, plotNo: "B-203", project: "Lake View", size: "7 Marla", location: "Block B", price: 3400000, status: "available" },
  { id: 4, plotNo: "B-204", project: "Lake View", size: "5 Marla", location: "Block B", price: 2400000, status: "available" },
  { id: 5, plotNo: "C-303", project: "Palm Heights", size: "10 Marla", location: "Block C", price: 5300000, status: "reserved" },
  { id: 6, plotNo: "C-304", project: "Palm Heights", size: "1 Kanal", location: "Block C", price: 8800000, status: "available" },
  { id: 7, plotNo: "D-401", project: "Sunset Gardens", size: "5 Marla", location: "Block D", price: 2200000, status: "available" },
  { id: 8, plotNo: "D-402", project: "Sunset Gardens", size: "7 Marla", location: "Block D", price: 3100000, status: "available" },
];

const projects = ["All Projects", "Green Valley", "Lake View", "Palm Heights", "Sunset Gardens"];
const sizes = ["All Sizes", "5 Marla", "7 Marla", "10 Marla", "1 Kanal"];

export default function UnsoldInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("All Projects");
  const [selectedSize, setSelectedSize] = useState("All Sizes");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredInventory = unsoldInventory.filter((item) => {
    const matchesSearch = item.plotNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === "All Projects" || item.project === selectedProject;
    const matchesSize = selectedSize === "All Sizes" || item.size === selectedSize;
    return matchesSearch && matchesProject && matchesSize;
  });

  const totalValue = filteredInventory.reduce((sum, item) => sum + item.price, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unsold Inventory</h1>
            <p className="text-muted-foreground">
              Browse and manage available properties
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
                      {project}
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
                      {size}
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
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.plotNo}</TableCell>
                    <TableCell>{item.project}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(item.price)}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "available" ? "default" : "secondary"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm">Book Now</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
