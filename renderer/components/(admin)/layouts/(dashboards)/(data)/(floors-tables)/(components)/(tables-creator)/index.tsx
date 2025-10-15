'use client';

import * as React from 'react';
import ResizableGrid from './ui/ResizableContainer';
import TableLayoutCreator, { FloorDraft } from './ui/(pane)/TableLayoutCreator';
import 'react-perfect-scrollbar/dist/css/styles.css';
import {TablePaneDetailList} from "./ui/(pane)/TablePaneDetailList";
import { TablesCreatorProvider } from './context/TablesContext';
import {FloorsTables} from "../../../../../../../../types/config/data/floors.tables.type";

export default function TablesCreator({ onSubmit } : { onSubmit?: (data : FloorsTables[]) => void }) {

    return (
        <TablesCreatorProvider>
            <ResizableGrid
                left={<TableLayoutCreator gridSize={10} />}
                right={<TablePaneDetailList onSubmit={onSubmit} />}
            />
        </TablesCreatorProvider>
    );
}
