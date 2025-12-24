import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sen Panier Bio - Marché Bio du Sénégal',
  description: 'Plateforme de marché bio connectant producteurs et consommateurs au Sénégal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}