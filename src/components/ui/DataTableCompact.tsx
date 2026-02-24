import React from "react";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableCompactProps<T> {
    data: T[];
    columns: Column<T>[];
    emptyMessage?: string;
    className?: string;
}

export function DataTableCompact<T>({ data, columns, emptyMessage = "NO HAY REGISTROS", className }: DataTableCompactProps<T>) {
    return (
        <div className={cn("w-full overflow-hidden border border-slate-200 rounded-lg bg-white", className)}>
            <Table>
                <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-b border-slate-200 hover:bg-transparent">
                        {columns.map((col, i) => (
                            <TableHead
                                key={i}
                                className={cn("text-[9px] h-8 font-black uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap", col.className)}
                            >
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emptyMessage}</span>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, rowIndex) => (
                            <TableRow
                                key={rowIndex}
                                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-10 group"
                            >
                                {columns.map((col, colIndex) => (
                                    <TableCell
                                        key={colIndex}
                                        className={cn("text-[11px] font-semibold text-slate-700 py-1.5", col.className)}
                                    >
                                        {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey]) : null}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
