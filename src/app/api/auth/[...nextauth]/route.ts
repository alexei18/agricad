// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma'; // Asigură-te că importul Prisma este corect
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            // Numele afișat pe formularul de login (opțional)
            name: 'Credentials',
            // `credentials` este folosit pentru a genera un formular pe pagina default de login.
            // Poți specifica câmpurile pe care te aștepți să le primești.
            // Deoarece vom folosi un formular custom, acest lucru e mai mult informativ aici.
            credentials: {
                email: { label: "Email", type: "email", placeholder: "exemplu@domeniu.com" },
                password: { label: "Parolă", type: "password" }
            },
            async authorize(credentials, req) {
                // 1. Verifică dacă 'credentials' conține email și parolă.
                if (!credentials?.email || !credentials?.password) {
                    console.error('[AUTH] Lipsesc email sau parola.');
                    return null; // Returnează null dacă lipsesc datele
                }

                const inputEmail = credentials.email;
                const inputPassword = credentials.password;

                console.log(`[AUTH] Încercare autorizare pentru: ${inputEmail}`);

                // ---- VERIFICARE ADMIN DIN .ENV (ÎNAINTE DE BAZA DE DATE) ----
                const adminEmail = process.env.ADMIN_EMAIL;
                const adminPassword = process.env.ADMIN_PASSWORD; // Parola plain text din .env

                if (!adminEmail || !adminPassword) {
                    console.warn('[AUTH] Variabilele ADMIN_EMAIL sau ADMIN_PASSWORD nu sunt setate în .env');
                } else if (inputEmail === adminEmail) {
                    console.log('[AUTH] Email-ul corespunde cu ADMIN_EMAIL. Se verifică parola...');
                    // Comparație directă a parolelor (plain text) - NU ESTE SIGUR!
                    if (inputPassword === adminPassword) {
                        console.log('[AUTH] Autorizare Admin reușită (din .env).');
                        // Returnăm un obiect specific pentru admin
                        return {
                            id: 'admin_user', // Un ID fix pentru admin
                            email: adminEmail,
                            name: 'Administrator', // Nume generic
                            role: 'admin' // Rolul specific
                        };
                    } else {
                        console.log('[AUTH] Parolă Admin incorectă (din .env).');
                        // Nu returnăm null încă, poate e un primar/fermier cu același email
                        // Dar marcăm că verificarea admin a eșuat
                        // (Sau putem returna null direct dacă vrem ca emailul admin să fie unic)
                        // return null;
                    }
                }
                // ---- SFÂRȘIT VERIFICARE ADMIN ----

                // ---- VERIFICARE MAYOR/FARMER DIN BAZA DE DATE (doar dacă nu e admin) ----
                console.log(`[AUTH] Verificare în baza de date pentru: ${inputEmail}`);
                try {
                    let user: any = await prisma.mayor.findUnique({
                        where: { email: inputEmail },
                    });
                    let role = 'mayor';

                    if (!user) {
                        user = await prisma.farmer.findUnique({
                            where: { email: inputEmail },
                        });
                        role = 'farmer';
                    }

                    if (!user) {
                        console.log(`[AUTH] Utilizator (Mayor/Farmer) negăsit în DB: ${inputEmail}`);
                        return null; // Utilizator negăsit nici în DB
                    }

                    // Verifică parola HASHED din DB
                    const passwordMatch = await bcrypt.compare(inputPassword, user.password);

                    if (!passwordMatch) {
                        console.log(`[AUTH] Parolă DB incorectă pentru: ${inputEmail}`);
                        return null; // Parolă incorectă
                    }

                    console.log(`[AUTH] Autorizare DB cu succes pentru: ${inputEmail}, Rol: ${role}`);

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: role,
                        ...(role === 'mayor' && { village: user.village }),
                    };

                } catch (error) {
                    console.error('[AUTH] Eroare în funcția authorize (DB check):', error);
                    return null; // Returnează null în caz de eroare
                }
            }
        })
    ],
    // Specificăm strategia de sesiune (JWT este default și recomandat pentru început)
    session: {
        strategy: 'jwt',
    },
    // Adăugăm callbacks pentru a include ID-ul și rolul în token și sesiune
    callbacks: {
        async jwt({ token, user }) {
            // La login inițial (când 'user' object este pasat de la 'authorize')
            if (user) {
                token.id = user.id;
                token.role = (user as any).role; // Adăugăm rolul în token
                if ((user as any).role === 'mayor') {
                    token.village = (user as any).village; // Adaugă village pentru primar
                }
            }
            return token;
        },
        async session({ session, token }) {
            // Pasează datele din token (JWT) către obiectul 'session'
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                if (token.role === 'mayor') {
                    (session.user as any).village = token.village;
                }
            }
            return session;
        },
    },
    // Pagina de login custom (vom seta pagina principală '/')
    pages: {
        signIn: '/', // Redirecționează la pagina principală dacă login-ul este necesar
        // signOut: '/auth/signout', // Opțional
        // error: '/auth/error', // Pagina de afișare erori (opțional)
        // verifyRequest: '/auth/verify-request', // Pentru Email provider (opțional)
        // newUser: '/auth/new-user' // Pagina pentru utilizatori noi (opțional)
    },
    // Secretul este OBLIGATORIU în producție și recomandat în dezvoltare
    secret: process.env.NEXTAUTH_SECRET,
    // Poți adăuga opțiuni de debug în dezvoltare
    debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };