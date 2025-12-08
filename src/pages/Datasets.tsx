import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Search, 
  Filter, 
  Copy, 
  Eye,
  Play,
  Plus,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dataGenerations } from '@/lib/mock-data';
import { CreateDatasetForm } from '@/components/datasets/CreateDatasetForm';
import { toast } from 'sonner';

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
}

export default function Datasets() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filtered = dataGenerations.filter(gen =>
    gen.name.toLowerCase().includes(search.toLowerCase()) ||
    gen.client.toLowerCase().includes(search.toLowerCase())
  );

  const handleRowClick = (id: string) => {
    navigate(`/datasets/${id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Datasets</h1>
          <p className="text-muted-foreground mt-1">Manage your training datasets</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Datasets</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Main Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Datasets</CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search datasets..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="glow" onClick={() => setActiveTab('create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Dataset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dataset Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Split</TableHead>
                    <TableHead>S3 Path</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((gen) => (
                    <TableRow 
                      key={gen.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(gen.id)}
                    >
                      <TableCell>
                        <span className="font-medium hover:text-primary transition-colors">
                          {gen.name}
                        </span>
                        <p className="text-xs text-muted-foreground">{gen.id}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{gen.client}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {gen.dateRangeStart} - {gen.dateRangeEnd}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{gen.totalRecords.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${(gen.trainRecords / gen.totalRecords) * 100}%` }} 
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((gen.trainRecords / gen.totalRecords) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => copyToClipboard(gen.s3Path)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
                        >
                          <Copy className="h-3 w-3" />
                          {gen.s3Path.slice(0, 30)}...
                        </button>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRowClick(gen.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Use in Training
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(gen.s3Path)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy S3 Path
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dataGenerations.slice(0, 3).map((gen) => (
              <Card 
                key={gen.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(gen.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{gen.client}</Badge>
                  </div>
                  <h3 className="font-medium mb-2">{gen.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {gen.dateRangeStart} - {gen.dateRangeEnd}
                  </p>
                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <p className="font-medium">{gen.trainRecords.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Train</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{gen.testRecords.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Test</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{gen.valRecords.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Val</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <CreateDatasetForm onSuccess={() => setActiveTab('all')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
