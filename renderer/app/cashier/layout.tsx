'use client';

import * as React from 'react'
import LayoutContainer from "../../components/(cashier)/LayoutContainer";

export default function Layout({ children }) {

    return (
        <LayoutContainer>
            { children }
        </LayoutContainer>
    )
}
