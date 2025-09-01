import clsx from 'clsx';
import React from "react";

export default async function RootLayout({children}: Readonly<{ children: React.ReactNode; }>) {

    return (
        <html lang="en">
        <head>
            <meta charSet="utf-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, shrink-to-fit=no"
            />
            <meta
                name="theme-color"
                content="#000000"
            />
            <base href="/" />
            <noscript id="emotion-insertion-point" />
        </head>
        <body
            id="root"
            className={clsx('loading')}
        >
        { children }
        </body>
        </html>
    );
}
