
"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableColumn<T> {
    header: string | React.ReactNode;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
}

export function DataTable<T extends { id?: string | number }>({
    columns,
    data,
    onRowClick,
    isLoading
}: DataTableProps<T>) {
    return (
        <div className="data-table-container">
            <Table className="data-table">
                <TableHeader>
                    <TableRow>
                        {columns.map((col, idx) => (
                            <TableHead key={idx} className={col.className}>
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i} className="animate-pulse">
                                <TableCell colSpan={columns.length}>
                                    <div className="h-2 bg-slate-100 rounded w-full" />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                <p className="text-slate-400 text-[10px] uppercase tracking-widest">No results found.</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, rowIdx) => (
                            <TableRow
                                key={row.id || rowIdx}
                                onClick={() => onRowClick?.(row)}
                                className={cn("group", onRowClick && "cursor-pointer")}
                            >
                                {columns.map((col, colIdx) => (
                                    <TableCell key={colIdx} className={col.className}>
                                        {col.cell
                                            ? col.cell(row)
                                            : col.accessorKey
                                                ? (row[col.accessorKey] as React.ReactNode)
                                                : null
                                        }
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
