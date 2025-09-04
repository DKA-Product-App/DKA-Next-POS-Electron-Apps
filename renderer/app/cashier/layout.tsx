import * as React from 'react'
import LayoutContainer from "../../components/(cashier)/LayoutContainer";

export default function Layout({ children}) {
    return (
        <html lang={'id'}>
        <head>
            <title>DKA Cashier POS Application</title>
            <base href={'.'}/>
        </head>
        <body>
            <LayoutContainer>
                {children}
            </LayoutContainer>
        </body>
        </html>
    )
}
