// src/components/auth/LoginForm.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, getSession } from 'next-auth/react'; // Importăm funcția signIn
import { useRouter } from 'next/navigation'; // Pentru redirecționare
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn('credentials', {
                redirect: false, // IMPORTANT: Rămâne false
                email: email,
                password: password,
            });

            // NU mai setăm isLoading false aici imediat

            if (result?.error) {
                setIsLoading(false); // Setăm isLoading false aici în caz de eroare
                console.error("Login Error:", result.error);
                if (result.error === 'CredentialsSignin') {
                    setError("Email sau parolă invalidă.");
                    toast({ variant: "destructive", title: "Autentificare Eșuată", description: "Email sau parolă invalidă." });
                } else {
                    setError("A apărut o eroare la autentificare.");
                    toast({ variant: "destructive", title: "Eroare", description: "A apărut o eroare. Încercați din nou." });
                }
            } else if (result?.ok) {
                // Login API a reușit, Sesiunea/Cookie ar trebui setat.
                // Acum obținem sesiunea pt a vedea rolul și a redirecționa manual.
                toast({ title: "Autentificare Reușită", description: "Se verifică sesiunea..." });

                const session = await getSession(); // Obține datele sesiunii curente
                console.log("Client Session after Login:", session); // Log pentru debug

                let redirectUrl = '/'; // Default fallback
                const userRole = (session?.user as any)?.role;

                if (userRole) {
                    switch (userRole) {
                        case 'admin': redirectUrl = '/admin/dashboard'; break;
                        case 'mayor': redirectUrl = '/mayor/dashboard'; break;
                        case 'farmer': redirectUrl = '/farmer/dashboard'; break;
                        default: console.warn("Rol utilizator necunoscut:", userRole);
                    }
                    console.log(`Redirecting client-side to: ${redirectUrl}`);
                    router.push(redirectUrl); // Folosim router.push pentru navigare
                } else {
                    // Nu am putut obține rolul din sesiune - eroare?
                    console.error("Nu s-a putut obține rolul din sesiune după login.");
                    setError("Eroare la obținerea datelor de sesiune. Încercați un refresh manual.");
                    setIsLoading(false); // Oprim loading aici
                    toast({ variant: "destructive", title: "Eroare Sesiune", description: "Nu s-au putut încărca datele sesiunii." });
                }
                // Nu mai avem nevoie de router.refresh()

            } else {
                // Caz neașteptat - result nu are nici eroare, nici ok
                setIsLoading(false);
                console.error("Rezultat neașteptat de la signIn:", result);
                setError("Răspuns neașteptat de la server.");
                toast({ variant: "destructive", title: "Eroare Necunoscută", description: "Răspuns neașteptat." });
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Submit Error:", err);
            setError("A apărut o eroare neașteptată.");
            toast({ variant: "destructive", title: "Eroare", description: "A apărut o eroare neașteptată." });
        }
        // Nu mai setăm isLoading false aici la final, pentru că redirectarea ar trebui să schimbe pagina
    };
    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Autentificare</CardTitle>
                <CardDescription>
                    Introduceți email-ul și parola pentru a accesa platforma.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-4">
                    {error && (
                        <div className="text-center text-sm font-medium text-destructive">
                            {error}
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="exemplu@domeniu.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Parolă</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Se autentifică...' : 'Intră în cont'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}