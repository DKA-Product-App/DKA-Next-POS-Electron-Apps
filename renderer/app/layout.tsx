import * as React from 'react'

import "./../styles/globals.css"
export default function Layout({ children }) {

    return (
        <html lang={'id'}>
        <head>
            <title>DKA Cashier POS Application</title>
            <base href={'.'}/>
        </head>
        <body>
        {children}
        </body>
        </html>
    )
}
