
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
  Table as TanstackTable, // Rename imported Table type
  Row,
} from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Trash2, Edit, EyeOff, ChevronDown, Loader2, Palette } from 'lucide-react'; // Added Palette icon

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem, // Import CheckboxItem
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table, // Keep this as the ShadCN component
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Farmer, getAllFarmers, deleteFarmer, updateFarmer } from '@/services/farmers';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// List of predefined colors for the color picker
const PREDEFINED_COLORS = [
  'hsl(217, 91%, 60%)', // Blue
  'hsl(122, 39%, 49%)', // Green
  'hsl(40, 90%, 60%)',  // Yellowish
  'hsl(0, 70%, 65%)',   // Reddish
  'hsl(260, 60%, 60%)', // Purplish
  'hsl(180, 50%, 50%)', // Teal
  'hsl(30, 90%, 55%)',  // Orange
  'hsl(320, 70%, 60%)', // Pink
  'hsl(240, 5%, 65%)',  // Gray
];

// Props for the FarmerTable component
interface FarmerTableProps {
  villageFilter?: string; // Optional village to filter by
  readOnly?: boolean; // Optional flag for read-only mode
  actorId?: string; // Optional ID of the user performing actions
  refreshKey?: number; // Optional key to trigger data refresh
}

// Type for table meta - adding edit functionality
interface FarmerTableMeta {
  removeRow?: (id: string) => void;
  updateRow?: (id: string, data: Partial<Farmer>) => void;
  openEditDialog?: (farmer: Farmer) => void; // Function to open edit dialog
  refetchData?: () => void;
  readOnly?: boolean;
  actorId?: string;
}

// Define columns creator function
const createColumns = (readOnly: boolean): ColumnDef<Farmer>[] => [
  // Conditionally include select column only if NOT readOnly
  ...(!readOnly ? [{
    id: 'select',
    header: ({ table }: { table: TanstackTable<Farmer> }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selectează tot"
      />
    ),
    cell: ({ row }: { row: Row<Farmer> }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selectează rând"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }] : []),
   {
    accessorKey: 'color',
    header: '', // No header text needed for color swatch
    cell: ({ row }) => {
        const color = row.getValue('color') as string | null;
        return (
            <div className="flex justify-center items-center">
                <div
                    className={`w-4 h-4 rounded-full border ${!color ? 'bg-muted' : ''}`}
                    style={color ? { backgroundColor: color } : {}}
                    title={color || 'N/A'}
                />
            </div>
        );
    },
    enableSorting: false,
    enableHiding: false, // Usually keep color visible
    size: 50, // Small column size
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Nume
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'companyCode',
    header: 'Cod Fiscal',
    cell: ({ row }) => <div>{row.getValue('companyCode')}</div>,
  },
  {
    accessorKey: 'village',
    header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Sat
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    cell: ({ row }) => <div>{row.getValue('village')}</div>,
    filterFn: 'equals',
    enableColumnFilter: true, // Keep filter enabled, visibility controlled elsewhere
  },
   {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div>{row.getValue('email') || '-'}</div>,
  },
   {
    accessorKey: 'phone',
    header: 'Telefon',
    cell: ({ row }) => <div>{row.getValue('phone') || '-'}</div>,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Ultima Actualizare',
    cell: ({ row }) => {
      const date = row.getValue('updatedAt') as Date | null | undefined;
      return date ? date.toLocaleDateString() : 'N/A';
    },
  },
  // Conditionally include actions column only if NOT readOnly
  ...(!readOnly ? [{
    id: 'actions',
    enableHiding: false,
    cell: ({ row, table }: { row: Row<Farmer>, table: TanstackTable<Farmer> }) => {
      const farmer = row.original;
      const { toast } = useToast();
      const [isDeleting, setIsDeleting] = React.useState(false);
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
      const meta = table.options.meta as FarmerTableMeta;

      const handleDelete = async () => {
          setIsDeleting(true);
          try {
              const result = await deleteFarmer(farmer.id, meta?.actorId || 'UnknownActor');
              if (result.success) {
                  toast({ title: "Succes", description: `Agricultorul '${farmer.name}' a fost șters.` });
                  meta?.removeRow?.(farmer.id);
                  setIsDeleteDialogOpen(false);
                  meta?.refetchData?.(); // Refetch needed if pagination changes etc.
              } else {
                  throw new Error(result.error || "Nu s-a putut șterge agricultorul.");
              }
          } catch (error) {
              console.error("Failed to delete farmer:", error);
              toast({
                  variant: "destructive",
                  title: "Eroare",
                  description: error instanceof Error ? error.message : "Nu s-a putut șterge agricultorul.",
              });
          } finally {
              setIsDeleting(false);
          }
      };

      const handleEdit = () => {
           meta?.openEditDialog?.(farmer); // Call meta function to open dialog
      };

      return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Deschide meniu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleEdit}>
                   <Edit className="mr-2 h-4 w-4" />
                   Editează
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Șterge
                    </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
             <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sunteți absolut sigur?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Această acțiune nu poate fi anulată. Va șterge permanent contul agricultorului
                    pentru <strong>{farmer.name}</strong> și va elimina datele sale de pe servere.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Anulează</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                    {isDeleting ? 'Se șterge...' : 'Șterge'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
        </AlertDialog>
      );
    },
  }] : []),
];


export function FarmerTable({ villageFilter, readOnly = false, actorId, refreshKey }: FarmerTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
      email: false,
      phone: false,
      updatedAt: false, // Hide timestamp by default
      village: !villageFilter, // Hide village column if filtering by it
      color: false, // Hide color by default, show in edit
  });
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<Farmer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingFarmer, setEditingFarmer] = React.useState<Farmer | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editCode, setEditCode] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editColor, setEditColor] = React.useState<string | null>(null); // Added color state
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);


  // Define columns based on readOnly state
  const columns = React.useMemo(() => createColumns(readOnly), [readOnly]);

  // Fetch data function
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const farmers = await getAllFarmers(villageFilter);
      setData(farmers);
    } catch (err) {
      console.error('Failed to fetch farmers:', err);
      const errorMsg = err instanceof Error ? err.message : 'Nu s-au putut încărca datele agricultorilor.';
      setError(errorMsg);
      setData([]);
      toast({ variant: "destructive", title: "Eroare la încărcarea datelor", description: errorMsg });
    } finally {
      setLoading(false);
    }
  }, [villageFilter, toast]);

  // Fetch data on mount, when villageFilter changes, or when refreshKey changes
  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Function to open the edit dialog
   const openEditDialog = (farmer: Farmer) => {
      setEditingFarmer(farmer);
      setEditName(farmer.name);
      setEditCode(farmer.companyCode);
      setEditEmail(farmer.email || '');
      setEditPhone(farmer.phone || '');
      setEditColor(farmer.color || null); // Set initial color
      setIsEditDialogOpen(true);
   };

   // Function to handle saving edits
    const handleSaveEdit = async () => {
        if (!editingFarmer || !editName.trim() || !editCode.trim()) {
            toast({ variant: "destructive", title: "Eroare", description: "Numele și Codul Fiscal nu pot fi goale." });
            return;
        }
        setIsSavingEdit(true);
        try {
            // Changed type definition to match UpdateFarmerData
            const changes: Partial<Omit<Farmer, 'id' | 'createdAt' | 'password' | 'updatedAt'>> = {};
            if (editName !== editingFarmer.name) changes.name = editName;
            if (editCode !== editingFarmer.companyCode) changes.companyCode = editCode;
            if (editEmail !== (editingFarmer.email || '')) changes.email = editEmail || null; // Use null if empty
            if (editPhone !== (editingFarmer.phone || '')) changes.phone = editPhone || null; // Use null if empty
            if (editColor !== (editingFarmer.color || null)) changes.color = editColor; // Include color change


            if (Object.keys(changes).length === 0) {
                 toast({ title: "Info", description: "Nu s-au detectat modificări." });
                 setIsEditDialogOpen(false);
                 setEditingFarmer(null); // Clear editing state
                 return;
            }

             // Pass actorId to the update service
             const result = await updateFarmer(editingFarmer.id, changes, actorId || 'Mayor_Unknown');
             if (result.success) {
                 toast({ title: "Succes", description: `Agricultorul '${editName}' a fost actualizat.` });
                 // Optimistic update in the table
                 table.options.meta?.updateRow?.(editingFarmer.id, changes);
                 setIsEditDialogOpen(false); // Close dialog on success
                 setEditingFarmer(null); // Clear editing state
                 fetchData(); // Refetch data to ensure consistency
             } else {
                 throw new Error(result.error || "Nu s-a putut actualiza agricultorul.");
             }
        } catch (error) {
             console.error("Failed to update farmer:", error);
             toast({
                 variant: "destructive",
                 title: "Eroare la Actualizarea Agricultorului",
                 description: error instanceof Error ? error.message : "Nu s-a putut actualiza agricultorul.",
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
       removeRow: readOnly ? undefined : (id: string) => {
         setData((prev) => prev.filter((row) => row.id !== id));
       },
       updateRow: readOnly ? undefined : (id: string, updatedData: Partial<Farmer>) => {
         setData((prev) =>
           prev.map((row) => (row.id === id ? { ...row, ...updatedData } : row))
         );
       },
       openEditDialog: readOnly ? undefined : openEditDialog, // Pass function to meta
       refetchData: fetchData,
       readOnly: readOnly,
       actorId: actorId,
    } as FarmerTableMeta,
    initialState: {
        columnFilters: villageFilter ? [{ id: 'village', value: villageFilter }] : [],
    },
  });

  React.useEffect(() => {
     table.getColumn('village')?.setFilterValue(villageFilter ?? undefined);
     setColumnVisibility(prev => ({ ...prev, village: !villageFilter }));
  }, [villageFilter, table]);

  if (loading) {
     return (
          <div className="space-y-3">
               <div className="flex items-center py-4">
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <div className="ml-auto flex items-center gap-2">
                      {!readOnly && <Skeleton className="h-10 w-24" />}
                      <Skeleton className="h-10 w-20" />
                  </div>
               </div>
               <div className="rounded-md border">
                   <Table>
                       <TableHeader>
                            <TableRow>
                               {columns.map((col, index) => <TableHead key={index}><Skeleton className="h-5 w-full"/></TableHead>)}
                            </TableRow>
                       </TableHeader>
                       <TableBody>
                           {[...Array(5)].map((_, i) => (
                               <TableRow key={i}>
                                    {columns.map((col, j) => <TableCell key={j}><Skeleton className="h-5 w-full"/></TableCell>)}
                               </TableRow>
                           ))}
                       </TableBody>
                   </Table>
               </div>
               <div className="flex items-center justify-end space-x-2 py-4">
                    {!readOnly && <Skeleton className="h-5 w-28 flex-1" />}
                    {readOnly && <div className="flex-1"></div>}
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-10 w-16" />
               </div>
          </div>
      );
  }

  if (error && !loading) {
      return <div className="text-destructive p-4 border border-destructive/50 rounded-md">Eroare: {error}</div>;
  }

  return (
    <div className="w-full">
        <div className="flex items-center py-4">
            <Input
            placeholder="Filtrează după nume..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <div className="ml-auto flex items-center gap-2">
                {/* Column Visibility Dropdown */}
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                        Coloane <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Arată/Ascunde coloane</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                        // Customize display name
                        let displayName = column.id.replace(/([A-Z])/g, ' $1'); // Add space before capitals
                        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1); // Capitalize first letter
                        // Manual translation for column names
                        if (displayName === 'Name') displayName = 'Nume';
                        if (displayName === 'Company Code') displayName = 'Cod Fiscal';
                        if (displayName === 'Village') displayName = 'Sat';
                        if (displayName === 'Email') displayName = 'Email';
                        if (displayName === 'Phone') displayName = 'Telefon';
                        if (displayName === 'Updated At') displayName = 'Ultima Actualizare';
                        if (displayName === 'Color') displayName = 'Culoare'; // Added Color

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
        </div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                    return (
                        <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}>
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
                    Niciun rezultat.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            {!readOnly && (
                <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} din{' '}
                {table.getFilteredRowModel().rows.length} rând(uri) selectate.
                </div>
            )}
            {readOnly && <div className="flex-1"></div>}
            <div className="space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Următor
                </Button>
            </div>
        </div>

         {/* Edit Farmer Dialog - Placed here to be controlled by table state */}
         {!readOnly && (
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                if (!open) setEditingFarmer(null); // Clear state on close
                setIsEditDialogOpen(open);
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editează Agricultor: {editingFarmer?.name}</DialogTitle>
                        <DialogDescription>
                            Actualizați detaliile agricultorului. Faceți clic pe salvare când ați terminat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">Nume *</Label>
                            <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" disabled={isSavingEdit} />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-code" className="text-right">Cod Fiscal *</Label>
                            <Input id="edit-code" value={editCode} onChange={(e) => setEditCode(e.target.value)} className="col-span-3" disabled={isSavingEdit} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right">Email</Label>
                            <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="col-span-3" disabled={isSavingEdit} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-phone" className="text-right">Telefon</Label>
                            <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="col-span-3" disabled={isSavingEdit} />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="edit-village" className="text-right">Sat</Label>
                             <Input id="edit-village" value={editingFarmer?.village || ''} className="col-span-3" disabled readOnly />
                         </div>
                         {/* Color Picker */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-color" className="text-right flex items-center gap-1">
                                <Palette className="h-4 w-4"/>Culoare
                            </Label>
                            <div className="col-span-3 flex flex-wrap gap-2 items-center">
                                 {PREDEFINED_COLORS.map(color => (
                                    <Button
                                        key={color}
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className={`h-8 w-8 rounded-full border-2 ${editColor === color ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setEditColor(color)}
                                        disabled={isSavingEdit}
                                        aria-label={`Select color ${color}`}
                                    />
                                 ))}
                                 <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditColor(null)} // Allow clearing color
                                        disabled={isSavingEdit || editColor === null}
                                        className={editColor === null ? 'hidden' : ''}
                                    >
                                        Resetează
                                </Button>
                            </div>
                          </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSavingEdit}>Anulează</Button>
                         <Button type="button" onClick={handleSaveEdit} disabled={isSavingEdit || !editName || !editCode}>
                            {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSavingEdit ? 'Se salvează...' : 'Salvează Modificările'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
         )}
    </div>
  );
}
