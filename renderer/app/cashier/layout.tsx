import * as React from 'react'
import LayoutContainer from "../../components/(cashier)/LayoutContainer";
import {DiningModeProvider} from "../../components/(cashier)/layouts/(main)/(transaction)/context/DiningModeContext";

export default function Layout({ children }) {

    return (
        <DiningModeProvider>
            <LayoutContainer>
                { children }
            </LayoutContainer>
        </DiningModeProvider>
    )
}
