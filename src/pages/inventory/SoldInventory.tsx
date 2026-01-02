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
import { Search, Filter, Download, Eye, FileText } from "lucide-react";

const soldInventory = [
  { id: 1, plotNo: "A-101", project: "Green Valley", size: "5 Marla", buyer: "Ahmed Khan", agent: "Ali Hassan", soldDate: "2024-01-10", price: 2500000 },
  { id: 2, plotNo: "A-102", project: "Green Valley", size: "10 Marla", buyer: "Sara Ali", agent: "Usman Shah", soldDate: "2024-01-08", price: 4500000 },
  { id: 3, plotNo: "B-201", project: "Lake View", size: "7 Marla", buyer: "Usman Malik", agent: "Ali Hassan", soldDate: "2024-01-05", price: 3200000 },
  { id: 4, plotNo: "B-202", project: "Lake View", size: "5 Marla", buyer: "Fatima Zahra", agent: "Kamran Iqbal", soldDate: "2024-01-03", price: 2300000 },
  { id: 5, plotNo: "C-301", project: "Palm Heights", size: "10 Marla", buyer: "Imran Qureshi", agent: "Usman Shah", soldDate: "2024-01-01", price: 5100000 },
  { id: 6, plotNo: "C-302", project: "Palm Heights", size: "1 Kanal", buyer: "Ayesha Siddiqui", agent: "Ali Hassan", soldDate: "2023-12-28", price: 8500000 },
];

const projects = ["All Projects", "Green Valley", "Lake View", "Palm Heights"];
const agents = ["All Agents", "Ali Hassan", "Usman Shah", "Kamran Iqbal"];

export default function SoldInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("All Projects");
  const [selectedAgent, setSelectedAgent] = useState("All Agents");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredInventory = soldInventory.filter((item) => {
    const matchesSearch =
      item.plotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.buyer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject =
      selectedProject === "All Projects" || item.project === selectedProject;
    const matchesAgent =
      selectedAgent === "All Agents" || item.agent === selectedAgent;
    return matchesSearch && matchesProject && matchesAgent;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sold Inventory</h1>
            <p className="text-muted-foreground">
              View and manage all sold properties
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by plot or buyer..."
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
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Sold Properties ({filteredInventory.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plot No.</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Sold Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.plotNo}</TableCell>
                    <TableCell>{item.project}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.buyer}</TableCell>
                    <TableCell>{item.agent}</TableCell>
                    <TableCell>{item.soldDate}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
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
