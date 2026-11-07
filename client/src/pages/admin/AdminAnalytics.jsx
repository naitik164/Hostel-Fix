import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Tag,
  Loader2,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Exact 6 reference colors
const PALETTE = {
  navy: '#03195B',
  royal: '#0B2CB1',
  electric: '#1951FC',
  blue: '#3781FC',
  sky: '#77C1FC',
  ice: '#CBE9FD',
};

const PALETTE_ARRAY = [
  '#03195B',
  '#0B2CB1',
  '#1951FC',
  '#3781FC',
  '#77C1FC',
  '#9AD2FD',
  '#CBE9FD',
  '#2563EB',
  '#3B82F6',
  '#60A5FA',
];

const CATEGORIES = [
  'All Categories',
  'Food Quality & Mess',
  'Drinking Water',
  'Plumbing & Washroom',
  'Electricity & Lighting',
  'Cleanliness & Hygiene',
  'Room Maintenance',
  'Furniture & Fixtures',
  'Internet & Wi-Fi',
  'Security & Safety',
  'Pest Control',
  'Common Area Maintenance',
  'Other',
];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [blocks, setBlocks] = useState([]);

  // Filters
  const [days, setDays] = useState('30');
  const [hostelBlock, setHostelBlock] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const fetchBlocks = async () => {
    try {
      const res = await api.get('/admin/blocks');
      if (res.data && res.data.blocks) setBlocks(res.data.blocks);
    } catch (e) {
      // ignore
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        days: days !== 'all' ? days : undefined,
        hostelBlock: hostelBlock !== 'all' ? hostelBlock : undefined,
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined,
      };

      const res = await api.get('/admin/analytics', { params });
      if (res.data && res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.message || 'Failed to aggregate analytics from MongoDB. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [days, hostelBlock, category, status]);

  const handleExportCsv = () => {
    const query = new URLSearchParams({
      status: status !== 'all' ? status : '',
      category: category !== 'all' ? category : '',
      hostelBlock: hostelBlock !== 'all' ? hostelBlock : '',
    }).toString();
    window.open(`${api.defaults.baseURL}/admin/reports/export?${query}`, '_blank');
  };

  if (error && !data) {
    return (
      <div className="py-24 text-center flex flex-col items-center gap-3">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-sm font-semibold text-rose-800">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="btn-action inline-flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Analytics</span>
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="py-24 text-center flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-electric" />
        <p className="text-xs font-semibold text-slate-500">
          Running MongoDB aggregation pipelines for charts & KPIs...
        </p>
      </div>
    );
  }

  const { kpis = {}, charts = {} } = data || {};

  // 1. Doughnut: Complaints by Status
  const statusLabels = (charts.byStatus || []).map((s) => s._id);
  const statusValues = (charts.byStatus || []).map((s) => s.count);
  const statusChartData = {
    labels: statusLabels.length ? statusLabels : ['No Data'],
    datasets: [
      {
        data: statusValues.length ? statusValues : [1],
        backgroundColor: [
          PALETTE.electric,
          PALETTE.sky,
          '#F59E0B',
          '#10B981',
          '#F43F5E',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // 2. Bar: Complaints by Category
  const categoryLabels = (charts.byCategory || []).map((c) => c._id);
  const categoryValues = (charts.byCategory || []).map((c) => c.count);
  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Tickets',
        data: categoryValues,
        backgroundColor: PALETTE.royal,
        borderRadius: 8,
      },
    ],
  };

  // 3. Bar: Complaints by Hostel Block
  const blockLabels = (charts.byBlock || []).map((b) => b._id);
  const blockValues = (charts.byBlock || []).map((b) => b.count);
  const blockChartData = {
    labels: blockLabels,
    datasets: [
      {
        label: 'Complaints',
        data: blockValues,
        backgroundColor: PALETTE.electric,
        borderRadius: 8,
      },
    ],
  };

  // 4. Line: Complaints Over Time
  const timeLabels = (charts.overTime || []).map((t) => t._id);
  const timeValues = (charts.overTime || []).map((t) => t.count);
  const timeChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Submissions',
        data: timeValues,
        borderColor: PALETTE.electric,
        backgroundColor: 'rgba(25, 81, 252, 0.15)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: PALETTE.royal,
        pointBorderColor: '#fff',
        pointRadius: 4,
      },
    ],
  };

  // 5. Bar: Average Resolution Time by Category (in hours)
  const avgResLabels = (charts.avgResTimeByCategory || []).map((item) => item._id);
  const avgResValues = (charts.avgResTimeByCategory || []).map((item) => item.avgHours);
  const avgResChartData = {
    labels: avgResLabels,
    datasets: [
      {
        label: 'Avg Hours to Resolve',
        data: avgResValues,
        backgroundColor: PALETTE.blue,
        borderRadius: 8,
      },
    ],
  };

  // 6. Horizontal Bar: Unresolved by Block
  const unresolvedLabels = (charts.unresolvedByBlock || []).map((u) => u._id);
  const unresolvedValues = (charts.unresolvedByBlock || []).map((u) => u.count);
  const unresolvedChartData = {
    labels: unresolvedLabels,
    datasets: [
      {
        label: 'Open Issues',
        data: unresolvedValues,
        backgroundColor: '#F97316',
        borderRadius: 8,
      },
    ],
  };

  // 7. Bar: Staff Workload
  const staffLabels = (charts.staffWorkload || []).map((s) => s.name);
  const staffValues = (charts.staffWorkload || []).map((s) => s.activeCount);
  const staffChartData = {
    labels: staffLabels,
    datasets: [
      {
        label: 'Active Assigned Tickets',
        data: staffValues,
        backgroundColor: PALETTE.navy,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(203, 233, 253, 0.4)' },
        ticks: { font: { size: 10 }, stepSize: 1 },
      },
    },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading flex items-center gap-2">
            <span>Analytics & Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time MongoDB aggregation metrics, turnaround times, and predictive service health
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="btn-secondary w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-bold shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-navy">Filter Metrics:</span>
        </div>

        {/* Date Window */}
        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="glass-input px-3 py-2 text-xs font-medium w-full sm:w-auto"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time History</option>
        </select>

        {/* Block */}
        <select
          value={hostelBlock}
          onChange={(e) => setHostelBlock(e.target.value)}
          className="glass-input px-3 py-2 text-xs font-medium w-full sm:w-auto"
        >
          <option value="all">All Hostel Blocks</option>
          {blocks.map((b) => (
            <option key={b._id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="glass-input px-3 py-2 text-xs font-medium w-full sm:w-auto"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="glass-input px-3 py-2 text-xs font-medium w-full sm:w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-4">
        {/* Total */}
        <div className="glass-card p-3 sm:p-4 text-center min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 truncate">
            Total Tickets
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-navy font-heading">{kpis.totalComplaints || 0}</p>
        </div>

        {/* Resolution Rate */}
        <div className="glass-card p-3 sm:p-4 text-center border-emerald-300 min-w-0">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1 truncate">
            Resolution Rate
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-heading">
            {kpis.resolutionRate || 0}%
          </p>
        </div>

        {/* Avg Resolution Time */}
        <div className="glass-card p-3 sm:p-4 text-center border-sky/50 min-w-0">
          <span className="text-[10px] uppercase font-bold text-royal block mb-1 truncate">
            Avg Turnaround
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-royal font-heading">
            {kpis.overallAvgHours || 0}h
          </p>
        </div>

        {/* SLA Compliance */}
        <div className="glass-card p-3 sm:p-4 text-center border-electric/40 min-w-0">
          <span className="text-[10px] uppercase font-bold text-electric block mb-1 truncate">
            SLA Compliance
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-electric font-heading">
            {kpis.slaComplianceRate || 100}%
          </p>
        </div>

        {/* Overdue Count */}
        <div className="glass-card p-3 sm:p-4 text-center border-rose-300 min-w-0">
          <span className="text-[10px] uppercase font-bold text-rose-600 block mb-1 truncate">
            Overdue
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 font-heading">
            {kpis.overdueCount || 0}
          </p>
        </div>

        {/* Top Category */}
        <div className="glass-card p-3 sm:p-4 text-center col-span-2 sm:col-span-1 min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 truncate">
            Top Category
          </span>
          <p className="text-xs font-bold text-navy truncate" title={kpis.mostFrequentCategory}>
            {kpis.mostFrequentCategory || 'N/A'}
          </p>
        </div>

        {/* Most Affected Block */}
        <div className="glass-card p-3 sm:p-4 text-center col-span-2 sm:col-span-1 min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 truncate">
            Most Active Block
          </span>
          <p className="text-xs font-bold text-navy truncate" title={kpis.mostAffectedBlock}>
            {kpis.mostAffectedBlock || 'N/A'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Chart 1: Complaints by Status (Doughnut) */}
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-heading font-bold text-navy text-sm sm:text-base mb-1">
              Complaints by Status Lifecycle
            </h3>
            <p className="text-[11px] text-slate-500">Distribution across resolution stages</p>
          </div>
          <div className="h-64 mt-4 flex items-center justify-center">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 4: Complaints Over Time (Line) */}
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-heading font-bold text-navy text-sm sm:text-base mb-1">
              Complaint Submissions Over Time
            </h3>
            <p className="text-[11px] text-slate-500">Timeline of incoming maintenance tickets</p>
          </div>
          <div className="h-64 mt-4">
            {timeLabels.length > 0 ? (
              <Line data={timeChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No submissions in this time window
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Complaints by Category (Bar) */}
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-heading font-bold text-navy text-sm sm:text-base mb-1">
              Complaints by Category
            </h3>
            <p className="text-[11px] text-slate-500">Issue incidence across hostel facilities</p>
          </div>
          <div className="h-64 mt-4">
            <Bar data={categoryChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 3: Complaints by Hostel Block (Bar) */}
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-heading font-bold text-navy text-sm sm:text-base mb-1">
              Complaints by Hostel Block
            </h3>
            <p className="text-[11px] text-slate-500">Total volume logged per residential hall</p>
          </div>
          <div className="h-64 mt-4">
            <Bar data={blockChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 5: Average Resolution Time by Category (Bar) */}
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-heading font-bold text-navy text-sm sm:text-base mb-1">
              Avg Resolution Time by Category (Hours)
            </h3>
            <p className="text-[11px] text-slate-500">Actual turnaround from submission to resolution</p>
          </div>
          <div className="h-64 mt-4">
            {avgResLabels.length > 0 ? (
              <Bar data={avgResChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No resolved complaints in current filter to calculate turnaround
              </div>
            )}
          </div>
        </div>

        {/* Chart 6: Unresolved Complaints by Block (Horizontal Bar) */}
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-heading font-bold text-navy text-sm sm:text-base mb-1">
              Unresolved Complaints by Hostel Block
            </h3>
            <p className="text-[11px] text-slate-500">Active backlog pending closure</p>
          </div>
          <div className="h-64 mt-4">
            <Bar
              data={unresolvedChartData}
              options={{
                ...chartOptions,
                indexAxis: 'y',
              }}
            />
          </div>
        </div>

        {/* Chart 7: Staff Workload (Bar) */}
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-between lg:col-span-2 min-w-0">
          <div>
            <h3 className="font-heading font-bold text-navy text-sm sm:text-base mb-1">
              Active Maintenance Staff Workloads
            </h3>
            <p className="text-[11px] text-slate-500">Currently assigned in-progress tickets per technician</p>
          </div>
          <div className="h-64 mt-4">
            <Bar data={staffChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
