import { useState, useEffect, useMemo, useRef } from "react";
import { format, subDays, subMonths, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, CalendarIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { formatCurrency, formatEnum } from "@/utils/formatters";
import { reportsAPI } from "@/lib/api";
import html2pdf from "html2pdf.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type DateRange = { from: Date; to?: Date };
const today = new Date();
today.setHours(0, 0, 0, 0);

type PresetKey = "15d" | "3m" | "6m" | "1y";
const PRESETS: { key: PresetKey; label: string; getRange: () => DateRange }[] = [
  { key: "15d", label: "15d", getRange: () => ({ from: subDays(today, 14), to: new Date(today) }) },
  { key: "3m", label: "3m", getRange: () => ({ from: subMonths(today, 3), to: new Date(today) }) },
  { key: "6m", label: "6m", getRange: () => ({ from: subMonths(today, 6), to: new Date(today) }) },
  { key: "1y", label: "1y", getRange: () => ({ from: subMonths(today, 12), to: new Date(today) }) },
];

function getDefaultRange(): DateRange {
  return PRESETS[1].getRange(); // 3m default
}

interface SalesReportData {
  monthlySales: { _id: { month: number; year: number }; count: number; revenue: number }[];
  projectSales: { _id: string; count: number; revenue: number }[];
  recentSales: { id: string; date: string; plot: string; customer: string; amount: number }[];
  currentAvailable?: number;
  listingsAtEndOfPeriod?: number;
  monthlyListings?: { month: number; year?: number; listingsAtEndOfMonth: number }[];
}

export default function SalesReport() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);
  const [activePreset, setActivePreset] = useState<PresetKey | null>("3m");
  const [yearlyTarget, setYearlyTarget] = useState<string>("");
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const reportPdfRef = useRef<HTMLDivElement>(null);

  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const targetValue = useMemo(() => (yearlyTarget ? parseFloat(yearlyTarget.replace(/,/g, "")) || 0 : 0), [yearlyTarget]);
  const numMonthsInRange = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return 12;
    const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
    return Math.max(1, months.length);
  }, [dateRange.from, dateRange.to]);
  const monthlyTarget = targetValue > 0 ? targetValue / numMonthsInRange : 0;

  useEffect(() => {
    if (!startDate || !endDate) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    reportsAPI
      .getSalesReport({ startDate, endDate })
      .then((salesRes: any) => {
        if (cancelled) return;
        if (salesRes?.success && salesRes?.data) setData(salesRes.data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Failed to load report");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  const totals = useMemo(() => {
    if (!data) return { count: 0, revenue: 0 };
    const count = data.monthlySales?.reduce((s, m) => s + m.count, 0) ?? 0;
    const revenue = data.monthlySales?.reduce((s, m) => s + m.revenue, 0) ?? 0;
    return { count, revenue };
  }, [data]);

  const monthByMonthData = useMemo(() => {
    const from = dateRange.from;
    const to = dateRange.to ?? dateRange.from;
    if (!from || !to) return [];
    const key = (y: number, m: number) => `${y}-${m}`;
    const salesMap = new Map<string, { sales: number; revenue: number }>();
    data?.monthlySales?.forEach((item) => {
      salesMap.set(key(item._id.year, item._id.month), { sales: item.count, revenue: item.revenue });
    });
    const listingsMap = new Map<string, number>();
    data?.monthlyListings?.forEach((item) => {
      const yr = item.year ?? new Date().getFullYear();
      listingsMap.set(key(yr, item.month), item.listingsAtEndOfMonth);
    });
    const months = eachMonthOfInterval({ start: from, end: to });
    return months.map((d) => {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const row = salesMap.get(key(y, m)) ?? { sales: 0, revenue: 0 };
      const listings = listingsMap.get(key(y, m)) ?? 0;
      return {
        month: `${MONTH_NAMES[m - 1]} ${y}`,
        sales: row.sales,
        revenue: row.revenue,
        listings,
        revenueM: Math.round((row.revenue / 1_000_000) * 10) / 10,
        target: monthlyTarget,
        targetM: Math.round((monthlyTarget / 1_000_000) * 10) / 10,
      };
    });
  }, [data?.monthlySales, data?.monthlyListings, monthlyTarget, dateRange.from, dateRange.to]);

  const projectChartData = useMemo(() => {
    const list = data?.projectSales ?? [];
    return list
      .map((p) => ({
        name: formatEnum(p._id),
        revenue: p.revenue,
        count: p.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [data?.projectSales]);

  const recentSales = data?.recentSales ?? [];
  const totalRevenue = totals.revenue;
  const totalCount = totals.count;
  const currentListings = data?.listingsAtEndOfPeriod ?? data?.currentAvailable ?? 0;
  const targetVsActualPercent =
    targetValue > 0 ? Math.round((totalRevenue / targetValue) * 100) : null;

  const formatSaleDate = (date: string) => {
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? date : d.toLocaleDateString();
    } catch {
      return date;
    }
  };

  const handleExport = async () => {
    if (!data || !reportPdfRef.current) return;
    setExportingPdf(true);
    try {
      const element = reportPdfRef.current;
      const opt = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: `sales-report-${startDate}-to-${endDate}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          letterRendering: true,
          allowTaint: true,
          logging: false,
        },
        jsPDF: {
          unit: "mm" as const,
          format: "a3" as const,
          orientation: "landscape" as "portrait" | "landscape",
          compress: true,
          hotfixes: ["px_scaling"],
        },
        pagebreak: { mode: "avoid-all" as const },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <DashboardLayout>
      <div ref={reportPdfRef} className="space-y-6 animate-fade-in bg-background text-foreground">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Sales Performance Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-input bg-muted/30 p-0.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    setDateRange(preset.getRange());
                    setActivePreset(preset.key);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    activePreset === preset.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className="text-xs">Custom</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange(range);
                      setActivePreset(null);
                      if (range.from && range.to) setCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                  formatters={{
                    formatWeekdayName: (date) => ["S", "M", "T", "W", "T", "F", "S"][date.getDay()],
                  }}
                  className="p-4"
                  classNames={{
                    months: "flex gap-8",
                    month: "space-y-3",
                    caption: "flex justify-center pb-2 relative items-center",
                    caption_label: "text-sm font-semibold",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 p-0 rounded-md border border-input bg-background opacity-70 hover:opacity-100",
                    table: "border-collapse",
                    head_row: "flex",
                    head_cell: "w-9 text-center text-muted-foreground font-normal text-xs",
                    row: "flex mt-1",
                    cell: "w-9 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 text-sm font-normal aria-selected:opacity-100 rounded-md hover:bg-accent",
                    day_range_start: "rounded-l-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    day_range_end: "rounded-r-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    day_range_middle: "rounded-none [background-color:rgba(218,176,78,0.45)] text-foreground hover:[background-color:rgba(218,176,78,0.6)]",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground font-semibold",
                    day_outside: "text-muted-foreground opacity-40",
                  }}
                />
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Rs. Target (year):</span>
              <Input
                type="text"
                placeholder="e.g. 50000000"
                value={yearlyTarget}
                onChange={(e) => setYearlyTarget(e.target.value)}
                className="w-32"
              />
            </div>
            <Button
              variant="outline"
              disabled={loading || !data || exportingPdf}
              onClick={handleExport}
            >
              {exportingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {exportingPdf ? "Exporting…" : "Export PDF"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Target vs. Actual $ - Full width bar chart */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Target vs. Actual</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monthly sales revenue vs monthly target for selected period
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthByMonthData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1_000_000}M`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        name === "revenue" ? formatCurrency(value) : formatCurrency(value),
                        name === "revenue" ? "Sales" : "Target",
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Sales" fill="hsl(var(--primary))" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="target" name="Target" fill="hsl(var(--success))" stackId="a" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Middle row: # Properties (line) + Sales by Project (horizontal bar) */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Properties</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Plots sold per month and listings (available) at end of each month
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthByMonthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => [value, name === "sales" ? "Sales" : "Listings (at end of month)"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        name="Sales"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="listings"
                        name="Listings (at end of month)"
                        stroke="hsl(var(--success))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--success))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Sales by Project</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Revenue by project for selected period
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={projectChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 24, left: 80, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                      <YAxis type="category" dataKey="name" width={72} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* KPI cards at bottom */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-primary">{currentListings.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1 border-b-2 border-primary pb-1 w-fit">Listings</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Available at end of period</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-success">{totalCount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1 border-b-2 border-success pb-1 w-fit">Sales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground mt-1 border-b-2 border-primary pb-1 w-fit">Sales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-success">{targetValue > 0 ? formatCurrency(targetValue) : "—"}</p>
                  <p className="text-sm text-muted-foreground mt-1 border-b-2 border-success pb-1 w-fit">Target</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-primary flex items-center gap-1">
                    {targetVsActualPercent != null ? `${targetVsActualPercent}%` : "—"}
                    {targetVsActualPercent != null && (
                      <span className="w-2 h-2 rounded-full bg-primary" aria-hidden />
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 border-b-2 border-primary pb-1 w-fit">Target vs. Actual</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales table */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <p className="text-sm text-muted-foreground">Latest sales in the selected period</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Plot</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No sales in the selected period
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{formatSaleDate(sale.date)}</TableCell>
                          <TableCell className="font-medium">{sale.plot}</TableCell>
                          <TableCell>{sale.customer}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(sale.amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
