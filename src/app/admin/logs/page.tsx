
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, ListFilter, Loader2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAssignmentLogs, getUserActionLogs, LogEntry } from '@/services/logs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type LogType = 'assignment' | 'userAction';

export default function AdminLogsPage() {
  // Hardcoded Romanian strings
  const title = "Jurnale Sistem";
  const description = "Vizualizați evenimentele de sistem înregistrate, inclusiv atribuirile de parcele și acțiunile utilizatorilor.";
  const assignmentLogsTab = "Atribuiri Parcele";
  const userActionLogsTab = "Acțiuni Utilizatori";
  const timestampHeader = "Dată/Oră";
  const userActorHeader = "Utilizator/Actor";
  const actionHeader = "Acțiune";
  const detailsHeader = "Detalii";
  const noLogs = "Nu s-au găsit înregistrări în jurnal pentru această categorie.";
  const errorLoadingTitle = "Eroare la Încărcarea Jurnalelor";

  const [assignmentLogs, setAssignmentLogs] = React.useState<LogEntry[]>([]);
  const [userActionLogs, setUserActionLogs] = React.useState<LogEntry[]>([]);
  const [loadingAssignments, setLoadingAssignments] = React.useState(true);
  const [loadingUserActions, setLoadingUserActions] = React.useState(true);
  const [errorAssignments, setErrorAssignments] = React.useState<string | null>(null);
  const [errorUserActions, setErrorUserActions] = React.useState<string | null>(null);

  const fetchLogs = React.useCallback(async (logType: LogType) => {
    if (logType === 'assignment') {
      setLoadingAssignments(true);
      setErrorAssignments(null);
      try {
        const logs = await getAssignmentLogs();
        setAssignmentLogs(logs);
      } catch (err) {
        console.error("Error fetching assignment logs:", err);
        setErrorAssignments(err instanceof Error ? err.message : "Failed to load assignment logs.");
        setAssignmentLogs([]);
      } finally {
        setLoadingAssignments(false);
      }
    } else if (logType === 'userAction') {
      setLoadingUserActions(true);
      setErrorUserActions(null);
      try {
        const logs = await getUserActionLogs();
        setUserActionLogs(logs);
      } catch (err) {
        console.error("Error fetching user action logs:", err);
        setErrorUserActions(err instanceof Error ? err.message : "Failed to load user action logs.");
        setUserActionLogs([]);
      } finally {
        setLoadingUserActions(false);
      }
    }
  }, []);

  // Fetch logs on initial load
  React.useEffect(() => {
    fetchLogs('assignment');
    fetchLogs('userAction');
  }, [fetchLogs]);

  const renderLoadingSkeleton = () => (
    <div className="space-y-3 p-4">
        <div className="flex justify-between">
             <Skeleton className="h-8 w-40" />
        </div>
        <div className="rounded-md border">
            <div className="divide-y divide-border">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-40 hidden sm:block" />
                        <Skeleton className="h-4 w-48 hidden md:block" />
                        <Skeleton className="h-4 w-16 hidden lg:block" />
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderError = (errorMsg: string | null) => (
    <Alert variant="destructive" className="m-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{errorLoadingTitle}</AlertTitle>
      <AlertDescription>{errorMsg}</AlertDescription>
    </Alert>
  );

  const renderLogTable = (logs: LogEntry[], isLoading: boolean, error: string | null) => {
    if (isLoading) return renderLoadingSkeleton();
    if (error) return renderError(error);
    if (logs.length === 0) {
        return <div className="p-6 text-center text-muted-foreground">{noLogs}</div>;
    }

    return (
      <ScrollArea className="h-[60vh] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-[180px]">{timestampHeader}</TableHead>
              <TableHead>{userActorHeader}</TableHead>
              <TableHead>{actionHeader}</TableHead>
              <TableHead>{detailsHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">{log.timestamp.toLocaleString()}</TableCell>
                <TableCell>{log.actor || 'System'}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="text-xs">{log.details || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="assignment">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assignment">{assignmentLogsTab}</TabsTrigger>
                    <TabsTrigger value="userAction">{userActionLogsTab}</TabsTrigger>
                </TabsList>
                <TabsContent value="assignment" className="mt-4">
                    {renderLogTable(assignmentLogs, loadingAssignments, errorAssignments)}
                </TabsContent>
                <TabsContent value="userAction" className="mt-4">
                    {renderLogTable(userActionLogs, loadingUserActions, errorUserActions)}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
