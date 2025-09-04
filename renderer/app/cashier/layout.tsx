import * as React from 'react'
import Head from 'next/head';

export default function Layout({ children}) {
    return (
        <html lang={'id'}>
        <head>
            <title>DKA Cashier POS Application</title>
        </head>
        <body>
            {children}
        </body>
        </html>
    )
}
