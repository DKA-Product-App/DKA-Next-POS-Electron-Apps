import clsx from 'clsx';
import React from "react";
import '../styles/globals.css';

export default async function RootLayout({children}: Readonly<{ children: React.ReactNode; }>) {

    return (
        <html lang="en">
        <head>
            <meta charSet="utf-8" />
            <title>DKA Apps POS</title>
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, shrink-to-fit=no"
            />
        </head>
        <body>
        { children }
        </body>
        </html>
    );
}
