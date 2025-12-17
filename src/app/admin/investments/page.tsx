'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useFirestore } from "@/firebase/provider";
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit } from 'lucide-react';

// Data types
type InvestmentCategory = { id: string; name: string; description: string; };
type InvestmentPlan = { id: string; name: string; categoryId: string; dailyReturn: number; period: number; minInvest: number; maxInvest: number; };

// Schemas
const categorySchema = z.object({
    name: z.string().min(3, "Category name is required."),
    description: z.string().optional(),
});

const planSchema = z.object({
    name: z.string().min(3, "Plan name is required."),
    categoryId: z.string({ required_error: "Please select a category." }),
    dailyReturn: z.coerce.number().positive("Must be positive."),
    period: z.coerce.number().int().positive("Must be a positive number of days."),
    minInvest: z.coerce.number().min(0, "Cannot be negative."),
    maxInvest: z.coerce.number().positive("Must be positive."),
}).refine(data => data.maxInvest > data.minInvest, {
    message: "Max investment must be greater than min investment.",
    path: ["maxInvest"],
});

export default function InvestmentsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // State for dialogs and editing
    const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [isPlanDialogOpen, setPlanDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<InvestmentCategory | null>(null);
    const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);

    // Data fetching
    const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'investment_categories') : null, [firestore]);
    const { data: categories, isLoading: areCategoriesLoading } = useCollection<InvestmentCategory>(categoriesQuery);

    const plansQuery = useMemoFirebase(() => firestore ? collection(firestore, 'investment_plans') : null, [firestore]);
    const { data: plans, isLoading: arePlansLoading } = useCollection<InvestmentPlan>(plansQuery);

    // Forms
    const categoryForm = useForm<z.infer<typeof categorySchema>>({ resolver: zodResolver(categorySchema) });
    const planForm = useForm<z.infer<typeof planSchema>>({ resolver: zodResolver(planSchema) });

    const getCategoryName = (categoryId: string) => categories?.find(c => c.id === categoryId)?.name ?? 'N/A';
    
    // Handlers for Category
    const handleCategorySubmit = async (data: z.infer<typeof categorySchema>) => {
        if (!firestore) return;
        try {
            if (editingCategory) {
                const categoryDocRef = doc(firestore, 'investment_categories', editingCategory.id);
                await updateDoc(categoryDocRef, data);
                toast({ title: "Success", description: "Category updated." });
            } else {
                await addDoc(collection(firestore, 'investment_categories'), data);
                toast({ title: "Success", description: "Category added." });
            }
            categoryForm.reset({ name: '', description: '' });
            setCategoryDialogOpen(false);
            setEditingCategory(null);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Error", description: "Failed to save category." });
        }
    };
    
    const handleEditCategory = (category: InvestmentCategory) => {
        setEditingCategory(category);
        categoryForm.reset(category);
        setCategoryDialogOpen(true);
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!firestore || !window.confirm("Are you sure? This will not delete the plans in it.")) return;
        try {
            await deleteDoc(doc(firestore, 'investment_categories', categoryId));
            toast({ title: "Success", description: "Category deleted." });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Error", description: "Failed to delete category." });
        }
    };

    // Handlers for Plan
    const handlePlanSubmit = async (data: z.infer<typeof planSchema>) => {
        if (!firestore) return;
        try {
            if (editingPlan) {
                const planDocRef = doc(firestore, 'investment_plans', editingPlan.id);
                await updateDoc(planDocRef, data);
                toast({ title: "Success", description: "Plan updated." });
            } else {
                await addDoc(collection(firestore, 'investment_plans'), data);
                toast({ title: "Success", description: "Plan added." });
            }
            planForm.reset();
            setPlanDialogOpen(false);
            setEditingPlan(null);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Error", description: "Failed to save plan." });
        }
    };

    const handleEditPlan = (plan: InvestmentPlan) => {
        setEditingPlan(plan);
        planForm.reset(plan);
        setPlanDialogOpen(true);
    };

    const handleDeletePlan = async (planId: string) => {
        if (!firestore || !window.confirm("Are you sure you want to delete this plan?")) return;
        try {
            await deleteDoc(doc(firestore, 'investment_plans', planId));
            toast({ title: "Success", description: "Plan deleted." });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Error", description: "Failed to delete plan." });
        }
    };
    
    const closeCategoryDialog = () => {
        setCategoryDialogOpen(false);
        setEditingCategory(null);
        categoryForm.reset({name: '', description: ''});
    }

    const closePlanDialog = () => {
        setPlanDialogOpen(false);
        setEditingPlan(null);
        planForm.reset();
    }


    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Investments</h1>
                <p className="text-muted-foreground">Create and manage investment categories and plans.</p>
            </header>

            {/* Categories Management */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Investment Categories</CardTitle>
                            <CardDescription>Group your investment plans.</CardDescription>
                        </div>
                        <Dialog open={isCategoryDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) closeCategoryDialog(); else setCategoryDialogOpen(true); }}>
                            <DialogTrigger asChild><Button>Add Category</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingCategory ? "Edit" : "Add"} Category</DialogTitle>
                                </DialogHeader>
                                <Form {...categoryForm}>
                                    <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                                        <FormField control={categoryForm.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category Name</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={categoryForm.control} name="description" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description (Optional)</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <DialogFooter>
                                            <Button type="button" variant="ghost" onClick={closeCategoryDialog}>Cancel</Button>
                                            <Button type="submit">Save Category</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {areCategoriesLoading ? <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow> :
                             categories?.map(cat => (
                                 <TableRow key={cat.id}>
                                     <TableCell>{cat.name}</TableCell>
                                     <TableCell>{cat.description}</TableCell>
                                     <TableCell className="text-right">
                                         <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)}><Edit className="h-4 w-4" /></Button>
                                         <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                     </TableCell>
                                 </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Plans Management */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Investment Plans</CardTitle>
                            <CardDescription>All available investment plans.</CardDescription>
                        </div>
                        <Dialog open={isPlanDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) closePlanDialog(); else setPlanDialogOpen(true); }}>
                            <DialogTrigger asChild><Button disabled={!categories || categories.length === 0}>Add Plan</Button></DialogTrigger>
                             <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>{editingPlan ? "Edit" : "Add"} Plan</DialogTitle>
                                </DialogHeader>
                                <Form {...planForm}>
                                    <form onSubmit={planForm.handleSubmit(handlePlanSubmit)} className="space-y-4">
                                        <FormField control={planForm.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Plan Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={planForm.control} name="categoryId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={planForm.control} name="dailyReturn" render={({ field }) => (
                                                <FormItem><FormLabel>Daily Return (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={planForm.control} name="period" render={({ field }) => (
                                                <FormItem><FormLabel>Period (Days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={planForm.control} name="minInvest" render={({ field }) => (
                                                <FormItem><FormLabel>Min Investment</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={planForm.control} name="maxInvest" render={({ field }) => (
                                                <FormItem><FormLabel>Max Investment</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="ghost" onClick={closePlanDialog}>Cancel</Button>
                                            <Button type="submit">Save Plan</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Plan Name</TableHead><TableHead>Category</TableHead><TableHead>Return</TableHead><TableHead>Period</TableHead><TableHead>Min Invest</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {arePlansLoading ? <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow> :
                             plans?.map(plan => (
                                 <TableRow key={plan.id}>
                                     <TableCell className="font-medium">{plan.name}</TableCell>
                                     <TableCell>{getCategoryName(plan.categoryId)}</TableCell>
                                     <TableCell>{plan.dailyReturn}%</TableCell>
                                     <TableCell>{plan.period} days</TableCell>
                                     <TableCell>PKR {plan.minInvest.toLocaleString()}</TableCell>
                                     <TableCell className="text-right">
                                         <Button variant="ghost" size="icon" onClick={() => handleEditPlan(plan)}><Edit className="h-4 w-4" /></Button>
                                         <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                     </TableCell>
                                 </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
