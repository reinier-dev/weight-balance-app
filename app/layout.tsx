import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Weight & Balance Calculator',
  description: 'Professional aircraft weight and balance calculation tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-blue-600 text-white p-4 shadow-lg">
            <div className="container mx-auto">
              <h1 className="text-2xl font-bold">Calculadora de Peso y Balance</h1>
              <p className="text-blue-100">Herramienta profesional para cálculos de aeronaves</p>
            </div>
          </header>
          <main className="container mx-auto p-4">
            {children}
          </main>
          <footer className="bg-gray-800 text-white p-4 mt-auto">
            <div className="container mx-auto text-center">
              <p>&copy; 2024 Weight & Balance Calculator. Herramienta profesional de aviación.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}