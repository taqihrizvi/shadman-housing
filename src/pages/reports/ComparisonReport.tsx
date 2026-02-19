import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Download, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";
import { PROJECTS_WITH_ALL } from "@/constants/projects";
import { formatProjectName } from "@/utils/formatters";
import { useTranslation } from "react-i18next";

const comparisonData = [
  { project: "Green Valley", sold: 45, unsold: 15, total: 60 },
  { project: "Lake View", sold: 38, unsold: 22, total: 60 },
  { project: "Palm Heights", sold: 52, unsold: 8, total: 60 },
  { project: "Sunset Gardens", sold: 21, unsold: 19, total: 40 },
];

const monthlyTrend = [
  { month: "Jul", sold: 12, unsold: 188 },
  { month: "Aug", sold: 24, unsold: 176 },
  { month: "Sep", sold: 39, unsold: 161 },
  { month: "Oct", sold: 49, unsold: 151 },
  { month: "Nov", sold: 67, unsold: 133 },
  { month: "Dec", sold: 89, unsold: 111 },
  { month: "Jan", sold: 156, unsold: 44 },
];

const pieData = [
  { name: "Sold", value: 156, color: "hsl(142, 76%, 36%)" },
  { name: "Unsold", value: 44, color: "hsl(38, 92%, 50%)" },
];

export default function ComparisonReport() {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState("All Projects");

  const totalSold = comparisonData.reduce((sum, p) => sum + p.sold, 0);
  const totalUnsold = comparisonData.reduce((sum, p) => sum + p.unsold, 0);
  const total = totalSold + totalUnsold;
  const soldPercentage = ((totalSold / total) * 100).toFixed(1);
  const unsoldPercentage = ((totalUnsold / total) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sold vs Unsold Report</h1>
            <p className="text-muted-foreground">
              Compare inventory status across projects
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECTS_WITH_ALL.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project === "All Projects" ? project : formatProjectName(project, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Inventory</p>
                  <p className="text-3xl font-bold">{total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sold Units</p>
                  <p className="text-3xl font-bold">{totalSold}</p>
                  <p className="text-sm text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    {soldPercentage}%
                  </p>
                </div>
                <div className="rounded-xl bg-success/10 p-3">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unsold Units</p>
                  <p className="text-3xl font-bold">{totalUnsold}</p>
                  <p className="text-sm text-warning flex items-center gap-1 mt-1">
                    <TrendingDown className="h-4 w-4" />
                    {unsoldPercentage}%
                  </p>
                </div>
                <div className="rounded-xl bg-warning/10 p-3">
                  <XCircle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Best Performing</p>
                  <p className="text-xl font-bold">Palm Heights</p>
                  <p className="text-sm text-muted-foreground mt-1">87% sold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bar Chart */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Project-wise Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="project" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="sold" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Sold" />
                  <Bar dataKey="unsold" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Unsold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Overall Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Sales Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="sold" stackId="a" fill="hsl(142, 76%, 36%)" name="Sold" />
                <Bar dataKey="unsold" stackId="a" fill="hsl(38, 92%, 50%)" name="Unsold" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Table */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Total Units</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Unsold</TableHead>
                  <TableHead>Sale Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map((project) => (
                  <TableRow key={project.project}>
                    <TableCell className="font-medium">{project.project}</TableCell>
                    <TableCell>{project.total}</TableCell>
                    <TableCell className="text-success font-medium">{project.sold}</TableCell>
                    <TableCell className="text-warning font-medium">{project.unsold}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success rounded-full"
                            style={{ width: `${(project.sold / project.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {((project.sold / project.total) * 100).toFixed(0)}%
                        </span>
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
