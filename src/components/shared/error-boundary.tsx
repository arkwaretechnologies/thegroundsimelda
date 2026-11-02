"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass rounded-3xl p-8 text-center">
          <h2 className="font-display text-xl font-semibold">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please try again. If the problem continues, refresh the page.
          </p>
          <Button
            className="mt-4"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
