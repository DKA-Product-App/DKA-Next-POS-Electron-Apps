import * as React from 'react'
import LayoutContainer from "../../components/(auth)/LayoutContainer";

export default function Layout({ children }) {

    return (
        <LayoutContainer>
            { children }
        </LayoutContainer>
    )
}
