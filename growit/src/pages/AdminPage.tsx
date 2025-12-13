
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// API fetch functions
const fetchStats = async () => {
    const res = await fetch(`${API_BASE}/api/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
};

const fetchRawDataSample = async () => {
    const res = await fetch(`${API_BASE}/api/admin/raw-data-sample`);
    if (!res.ok) throw new Error('Failed to fetch raw data sample');
    return res.json();
};

const executeQuery = async (sql: string) => {
    const res = await fetch(`${API_BASE}/api/admin/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Query failed');
    }
    return res.json();
};

// Sub-components
const StatsCard = ({ title, value, description }: { title: string, value: string | number, description: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-4xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const PipelineChart = ({ data }: { data: any[] }) => (
    <Card>
        <CardHeader>
            <CardTitle>데이터 파이프라인 요약</CardTitle>
            <CardDescription>원본 대비 정제 데이터 건수</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
);

const RawDataSample = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['raw-data-sample'],
        queryFn: fetchRawDataSample,
        refetchInterval: 5000,
    });

    if (isLoading) return <div>원본 로그 불러오는 중...</div>;
    if (error) return <div className="text-red-500">오류: {error.message}</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>원본 로그 샘플</CardTitle>
                <CardDescription>최신 행 (파일: <Badge variant="outline">{data?.file}</Badge>)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 bg-gray-900 text-white rounded-md text-xs font-mono max-h-60 overflow-y-auto">
                    {data?.lines.map((line: string, i: number) => (
                        <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const QueryInterface = () => {
    const [sql, setSql] = useState('SELECT * FROM mart.daily_events ORDER BY event_date DESC LIMIT 10;');
    const queryClient = useQueryClient();
    
    const mutation = useMutation({
        mutationFn: executeQuery,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sql-query-results'] });
        },
    });

    const handleRunQuery = () => {
        mutation.mutate(sql);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>정제 데이터 쿼리</CardTitle>
                <CardDescription>데이터 웨어하우스에 SELECT 쿼리를 실행하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    className="font-mono text-sm"
                    rows={5}
                />
                <Button onClick={handleRunQuery} disabled={mutation.isPending}>
                    {mutation.isPending ? '실행 중...' : '쿼리 실행'}
                </Button>

                {mutation.isError && (
                     <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>쿼리 오류</AlertTitle>
                        <AlertDescription>
                            {mutation.error.message}
                        </AlertDescription>
                    </Alert>
                )}

                {mutation.data && (
                    <div className="max-h-96 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {mutation.data.columns.map((col: string) => <TableHead key={col}>{col}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mutation.data.rows.map((row: any, i: number) => (
                                    <TableRow key={i}>
                                        {Object.values(row).map((val: any, j: number) => (
                                            <TableCell key={j} className="text-xs">{String(val)}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    const { data: statsData, isLoading, error } = useQuery({
        queryKey: ['stats'],
        queryFn: fetchStats,
        refetchInterval: 5000,
    });

    const chartData = [
        { name: '원본 로그 라인 수', count: statsData?.raw_data?.line_count || 0 },
        { name: '정제 이벤트 행 수', count: statsData?.processed_data?.row_count || 0 },
    ];
    
    if (isLoading) return <div>대시보드 불러오는 중...</div>;
    if (error) return <div className="text-red-500">대시보드 로드 오류: {error.message}</div>;

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-3xl font-bold">파이프라인 관리자 대시보드</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard 
                    title="원본 로그 파일" 
                    value={statsData?.raw_data?.file_count || 0} 
                    description="bronze 레이어의 .jsonl 파일 개수"
                />
                <StatsCard 
                    title="원본 로그 라인" 
                    value={statsData?.raw_data?.line_count || 0}
                    description="모든 로그 파일의 라인 합계"
                />
                <StatsCard 
                    title="정제된 행 수" 
                    value={statsData?.processed_data?.row_count || 0}
                    description="mart.daily_events 테이블 행 수"
                />
                 <StatsCard 
                    title="마지막 갱신 시각" 
                    value={new Date(statsData?.last_updated).toLocaleTimeString()}
                    description="통계 갱신 시간"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PipelineChart data={chartData} />
                <RawDataSample />
            </div>

            <div>
                <QueryInterface />
            </div>
        </div>
    )
}
