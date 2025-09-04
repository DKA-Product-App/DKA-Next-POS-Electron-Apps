// ./ui/ErrorBoundary.tsx
'use client';
import React from 'react';

export default class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { err?: Error }
> {
    state = { err: undefined as Error | undefined };
    static getDerivedStateFromError(err: Error) { return { err }; }
    componentDidCatch(err: Error) { console.error('Dynamic pane crashed:', err); }
    render() {
        if (this.state.err) {
            return (
                <div style={{ padding: 12, color: 'crimson', fontFamily: 'monospace' }}>
                    <b>Pane error:</b> {this.state.err.message}
                </div>
            );
        }
        return this.props.children;
    }
}
