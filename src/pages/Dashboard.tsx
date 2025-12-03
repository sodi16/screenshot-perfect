import { 
  Play, 
  Database, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trainingRuns, dataGenerations, modelArtifacts, users } from '@/lib/mock-data';
import { Link } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const statsCards = [
  {
    title: 'Training Runs',
    value: trainingRuns.length,
    icon: Play,
    change: '+2 this week',
    breakdown: {
      success: trainingRuns.filter(t => t.status === 'success').length,
      failed: trainingRuns.filter(t => t.status === 'failed').length,
      running: trainingRuns.filter(t => t.status === 'running').length,
    }
  },
  {
    title: 'Active Trainings',
    value: trainingRuns.filter(t => t.status === 'running' || t.status === 'queued').length,
    icon: Clock,
    change: 'In progress',
    highlight: true,
  },
  {
    title: 'Data Generations',
    value: dataGenerations.length,
    icon: Database,
    change: '+1 this week',
  },
  {
    title: 'Model Artifacts',
    value: modelArtifacts.length,
    icon: Package,
    change: '2 new models',
  },
];

const chartData = [
  { name: 'Mon', runs: 2, success: 2 },
  { name: 'Tue', runs: 3, success: 2 },
  { name: 'Wed', runs: 1, success: 1 },
  { name: 'Thu', runs: 4, success: 3 },
  { name: 'Fri', runs: 2, success: 2 },
  { name: 'Sat', runs: 0, success: 0 },
  { name: 'Sun', runs: 1, success: 1 },
];

const clientData = [
  { client: 'Customer A', runs: 8, successRate: 87 },
  { client: 'Customer B', runs: 5, successRate: 80 },
  { client: 'Customer C', runs: 3, successRate: 100 },
];

function getStatusBadge(status: string) {
  const variants: Record<string, 'success' | 'failed' | 'running' | 'queued'> = {
    success: 'success',
    failed: 'failed',
    running: 'running',
    queued: 'queued',
  };
  return variants[status] || 'secondary';
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
}

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your training operations</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/data-generations">
              <Database className="mr-2 h-4 w-4" />
              Generate Dataset
            </Link>
          </Button>
          <Button variant="glow" asChild>
            <Link to="/training-runs?tab=create">
              <Plus className="mr-2 h-4 w-4" />
              New Training Run
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className={`transition-all duration-300 hover:shadow-lg ${
              stat.highlight ? 'border-primary/50 bg-primary/5' : ''
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              {stat.breakdown && (
                <div className="flex gap-3 mt-3">
                  <span className="flex items-center gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    {stat.breakdown.success}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <XCircle className="h-3 w-3 text-destructive" />
                    {stat.breakdown.failed}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3 text-info" />
                    {stat.breakdown.running}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training runs chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Training Runs This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="runs" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="success" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--success))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success rate by client */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate by Client</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={clientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="client" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="successRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/training-runs">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainingRuns.slice(0, 5).map((run) => {
              const user = users.find(u => u.id === run.userId);
              return (
                <Link 
                  key={run.id} 
                  to={`/training-runs/${run.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      run.status === 'running' ? 'bg-info/20' : 
                      run.status === 'success' ? 'bg-success/20' : 
                      run.status === 'failed' ? 'bg-destructive/20' : 'bg-warning/20'
                    }`}>
                      <Play className={`h-5 w-5 ${
                        run.status === 'running' ? 'text-info' : 
                        run.status === 'success' ? 'text-success' : 
                        run.status === 'failed' ? 'text-destructive' : 'text-warning'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{run.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {run.client} • by {user?.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={getStatusBadge(run.status)}>
                      {run.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(run.startedAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
