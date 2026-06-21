import './globals.css';

export const metadata = {
  title: 'CM Grievance Dashboard — Government of Delhi',
  description: 'Chief Minister\'s Grievance & Complaint Management Dashboard for the Government of NCT of Delhi. Track, manage, and resolve citizen complaints efficiently.',
  keywords: 'Delhi, grievance, complaints, CM dashboard, government, civic',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
