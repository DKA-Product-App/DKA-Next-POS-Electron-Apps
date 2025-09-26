import * as React from 'react'

import "./../styles/globals.css"
import {AuthProvider} from "../contexts/AuthProviderContext";
import {SessionProvider} from "../contexts/SessionProviderContext";
export default function Layout({ children }) {

    return (
        <html lang={'id'}>
        <head>
            <title>DKA Cashier POS Application</title>
            <base href={'.'}/>
        </head>
        <body>
        <SessionProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </SessionProvider>

        </body>
        </html>
    )
}
