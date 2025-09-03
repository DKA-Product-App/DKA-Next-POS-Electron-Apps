import * as React from 'react'

export default function Layout({ children}) {
    return (
        <html>
        <head>
            <title>pos</title>
        </head>
        <body>
            {children}
        </body>
        </html>
    )
}
