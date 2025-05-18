
'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table as TanstackTable,
  Row,
} from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Trash2, Edit, Power, PowerOff, ShieldCheck, ShieldAlert, HelpCircle, ChevronDown, Loader2 } from 'lucide-react'; // Import HelpCircle, ChevronDown, Loader2

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuCheckboxItem, // Added for visibility
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mayor, getAllMayors, deleteMayor, updateMayorStatus, updateMayorDetails } from '@/services/mayors';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent as ShadDialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Use ShadCN Dialog
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';


// TODO: Replace with actual admin ID for logging purposes (fetch from session/auth)
const adminActorId = "Admin_System";

// Define interface for table meta
interface MayorTableMeta {
  removeRow: (id: string) => void;
  updateRow: (id: string, data: Partial<Mayor>) => void;
  refetchData: () => void;
  openEditDialog: (mayor: Mayor) => void; // Function to open edit dialog
  actorId: string; // Actor ID for logging
}

// Define columns for the mayor table
const columns: ColumnDef<Mayor>[] = [
  {
    id: 'select',
    header: ({ table }: { table: TanstackTable<Mayor> }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: { row: Row<Mayor> }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'village',
    header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Village
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    cell: ({ row }) => <div>{row.getValue('village')}</div>,
  },
   {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div>{row.getValue('email') || '-'}</div>,
  },
  {
    accessorKey: 'subscriptionStatus',
    header: 'Status',
    cell: ({ row }) => {
        const status = row.getValue('subscriptionStatus') as Mayor['subscriptionStatus'];
        const variantMap: Record<Mayor['subscriptionStatus'], 'default' | 'secondary' | 'destructive'> = {
            ACTIVE: 'default',
            PENDING: 'secondary',
            INACTIVE: 'destructive'
        };
        const IconMap: Record<Mayor['subscriptionStatus'], React.ElementType> = {
            ACTIVE: ShieldCheck,
            PENDING: HelpCircle,
            INACTIVE: ShieldAlert
        };
        const variant = variantMap[status] || 'secondary';
        const Icon = IconMap[status] || HelpCircle;

        return (
            <Badge variant={variant} className="capitalize">
                 <Icon className="mr-1 h-3 w-3" />
                {status.toLowerCase()}
            </Badge>
        );
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
    },
  },
   {
    accessorKey: 'subscriptionEndDate',
    header: 'Subscription End',
    cell: ({ row }) => {
        const date = row.getValue('subscriptionEndDate') as Date | null;
        const status = row.getValue('subscriptionStatus');
        if (status === 'PENDING') return <span className="text-muted-foreground">N/A</span>;
        return date ? date.toLocaleDateString() : '-';
    },
  },
  {
      accessorKey: 'updatedAt', // Add Updated At column
      header: 'Last Updated',
      cell: ({ row }) => {
        const date = row.getValue('updatedAt') as Date | null | undefined;
        return date ? date.toLocaleDateString() : 'N/A';
      },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row, table }: { row: Row<Mayor>, table: TanstackTable<Mayor> }) => {
      const mayor = row.original;
      const { toast } = useToast();
      const [isDeleting, setIsDeleting] = React.useState(false);
      const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
      const meta = table.options.meta as MayorTableMeta;

      const handleDelete = async () => {
          setIsDeleting(true);
          try {
              const result = await deleteMayor(mayor.id, meta?.actorId || adminActorId);
              if (result.success) {
                  toast({ title: "Success", description: `Mayor account for '${mayor.name}' deleted.` });
                   meta?.removeRow?.(mayor.id);
                   setIsDeleteDialogOpen(false);
                   meta?.refetchData?.();
              } else {
                  throw new Error(result.error || "Failed to delete mayor.");
              }
          } catch (error) {
              console.error("Failed to delete mayor:", error);
              toast({
                  variant: "destructive",
                  title: "Error",
                  description: error instanceof Error ? error.message : "Could not delete mayor.",
              });
          } finally {
              setIsDeleting(false);
          }
      };

      const handleStatusChange = async (newStatus: Mayor['subscriptionStatus']) => {
          setIsUpdatingStatus(true);
          try {
              let newEndDate: Date | null = mayor.subscriptionEndDate;
              if (newStatus === 'ACTIVE' && mayor.subscriptionStatus !== 'ACTIVE') {
                  newEndDate = new Date();
                  newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                   toast({ title: "Info", description: `Subscription end date set to ${newEndDate.toLocaleDateString()}.` });
              } else if (newStatus === 'INACTIVE') {
                 newEndDate = null;
              }

              const result = await updateMayorStatus(mayor.id, newStatus, newEndDate, meta?.actorId || adminActorId);
               if (result.success) {
                   toast({ title: "Success", description: `Mayor '${mayor.name}' status updated to ${newStatus}.` });
                    meta?.updateRow?.(mayor.id, { subscriptionStatus: newStatus, subscriptionEndDate: newEndDate });
                    meta?.refetchData?.(); // Refetch to ensure consistency
               } else {
                   throw new Error(result.error || "Failed to update status.");
               }
          } catch (error) {
               console.error("Failed to update mayor status:", error);
              toast({
                  variant: "destructive",
                  title: "Error",
                  description: error instanceof Error ? error.message : "Could not update status.",
              });
          } finally {
              setIsUpdatingStatus(false);
          }
      };


      return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => meta?.openEditDialog?.(mayor)}>
                   <Edit className="mr-2 h-4 w-4" />
                   Edit Details
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={isUpdatingStatus}>
                        {mayor.subscriptionStatus === 'ACTIVE' ? <PowerOff className="mr-2 h-4 w-4 text-destructive" /> : <Power className="mr-2 h-4 w-4 text-green-600"/>}
                        <span>Change Status</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                         <DropdownMenuSubContent>
                             <DropdownMenuItem
                                disabled={isUpdatingStatus || mayor.subscriptionStatus === 'ACTIVE'}
                                onClick={() => handleStatusChange('ACTIVE')}
                             >
                                 <ShieldCheck className="mr-2 h-4 w-4 text-green-600"/> Activate
                             </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                disabled={isUpdatingStatus || mayor.subscriptionStatus === 'INACTIVE'}
                                onClick={() => handleStatusChange('INACTIVE')}
                             >
                                 <ShieldAlert className="mr-2 h-4 w-4"/> Deactivate
                             </DropdownMenuItem>
                             {/* Option to set to Pending might be useful */}
                             <DropdownMenuItem
                                className="text-muted-foreground focus:text-foreground focus:bg-accent"
                                disabled={isUpdatingStatus || mayor.subscriptionStatus === 'PENDING'}
                                onClick={() => handleStatusChange('PENDING')}
                             >
                                <HelpCircle className="mr-2 h-4 w-4"/> Set Pending
                             </DropdownMenuItem>
                         </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                 <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                    </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
             <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the mayor account
                    for <strong>{mayor.name}</strong> ({mayor.village}) and remove their access. Data might be retained.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];


export function MayorTable({ refreshKey }: { refreshKey?: number }) { // Accept refreshKey prop
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
      email: false,
      subscriptionEndDate: false,
      updatedAt: false, // Hide update timestamp by default
  });
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<Mayor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  // State for Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingMayor, setEditingMayor] = React.useState<Mayor | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  // Fetch data function
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mayors = await getAllMayors();
      setData(mayors);
    } catch (err) {
      console.error('Failed to fetch mayors:', err);
      setError(err instanceof Error ? err.message : 'Could not load mayor data.');
      setData([]);
      toast({ variant: "destructive", title: "Error", description: "Failed to load mayor data." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch data on mount and when refreshKey changes
  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]); // Added refreshKey dependency

   const openEditDialog = (mayor: Mayor) => {
      setEditingMayor(mayor);
      setEditName(mayor.name);
      setEditEmail(mayor.email);
      setIsEditDialogOpen(true);
   };

    const handleSaveEdit = async () => {
        if (!editingMayor || !editName.trim() || !editEmail.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Name and Email cannot be empty." });
            return;
        }
        if (!/\S+@\S+\.\S+/.test(editEmail)) {
             toast({ variant: "destructive", title: "Error", description: "Please enter a valid email address." });
             return;
        }
        setIsSavingEdit(true);
        try {
            const changes: Partial<Pick<Mayor, 'name' | 'email'>> = {};
            if (editName !== editingMayor.name) changes.name = editName;
            if (editEmail !== editingMayor.email) changes.email = editEmail;

            if (Object.keys(changes).length === 0) {
                 toast({ title: "Info", description: "No changes detected." });
                 setIsEditDialogOpen(false);
                 setEditingMayor(null); // Clear editing state
                 return;
            }

             const result = await updateMayorDetails(editingMayor.id, changes, adminActorId);
             if (result.success) {
                 toast({ title: "Success", description: `Mayor '${editName}' details updated.` });
                 // Optimistic update in the table
                 table.options.meta?.updateRow?.(editingMayor.id, changes);
                 setIsEditDialogOpen(false); // Close dialog on success
                 setEditingMayor(null); // Clear editing state
                 fetchData(); // Refetch to ensure data consistency
             } else {
                 throw new Error(result.error || "Failed to update details.");
             }
        } catch (error) {
             console.error("Failed to update mayor details:", error);
             toast({
                 variant: "destructive",
                 title: "Error Updating Mayor",
                 description: error instanceof Error ? error.message : "Could not update mayor details.",
             });
        } finally {
            setIsSavingEdit(false);
        }
    };


  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
       removeRow: (id: string) => {
         setData((prev) => prev.filter((row) => row.id !== id));
       },
       updateRow: (id: string, updatedData: Partial<Mayor>) => {
         setData((prev) =>
           prev.map((row) => (row.id === id ? { ...row, ...updatedData } : row))
         );
       },
       refetchData: fetchData,
       openEditDialog: openEditDialog,
       actorId: adminActorId,
    } as MayorTableMeta,
  });

  if (loading) {
      return <MayorTableSkeleton />;
  }

  if (error) {
      return <div className="text-destructive p-4 border border-destructive/50 rounded-md">Error: {error}</div>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
         {/* Column Visibility Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                  // Customize display name
                  let displayName = column.id.replace(/([A-Z])/g, ' $1'); // Add space before capitals
                  displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1); // Capitalize
                  // Specific overrides
                  if (displayName === 'Subscription End Date') displayName = 'Sub. End Date';
                  if (displayName === 'Subscription Status') displayName = 'Sub. Status';
                   if (displayName === 'Updated At') displayName = 'Last Updated';

                  return (
                  <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                      }
                  >
                      {displayName}
                  </DropdownMenuCheckboxItem>
                  );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No mayors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

       {/* Edit Mayor Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
             if (!open) setEditingMayor(null); // Clear editing state on close
             setIsEditDialogOpen(open);
        }}>
            <ShadDialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Mayor: {editingMayor?.name}</DialogTitle>
                    <DialogDescription>
                        Update the mayor's details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">Name *</Label>
                         <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" disabled={isSavingEdit} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-email" className="text-right">Email *</Label>
                        <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="col-span-3" disabled={isSavingEdit} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="edit-village" className="text-right">Village</Label>
                        <Input id="edit-village" value={editingMayor?.village || ''} className="col-span-3" disabled readOnly />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSavingEdit}>Cancel</Button>
                     <Button type="button" onClick={handleSaveEdit} disabled={isSavingEdit || !editName || !editEmail}>
                        {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSavingEdit ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </ShadDialogContent>
        </Dialog>
    </div>
  );
}

// Keep the skeleton function available if needed, though it's in the parent
function MayorTableSkeleton() {
    return (
        <div className="space-y-3">
             <div className="flex items-center py-4">
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <Skeleton className="h-10 w-24 ml-auto" /> {/* Columns button */}
             </div>
             <div className="rounded-md border">
                 <TableSkeleton rows={5} cells={7}/> {/* Adjust cell count if needed */}
             </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                 <Skeleton className="h-5 w-28 flex-1" /> {/* Selection Text */}
                 <Skeleton className="h-10 w-24" /> {/* Prev button */}
                 <Skeleton className="h-10 w-16" /> {/* Next button */}
             </div>
        </div>
    );
}

// A more generic table skeleton
function TableSkeleton({ rows = 5, cells = 5 }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                   {[...Array(cells)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full"/></TableHead>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(rows)].map((_, i) => (
                    <TableRow key={i}>
                        {[...Array(cells)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full"/></TableCell>)}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
    