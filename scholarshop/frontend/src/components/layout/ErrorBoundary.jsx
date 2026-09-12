import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught', error, info); }
  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-xl text-center py-16 px-4">
          <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
          <p className="text-slate-500 mt-2">{String(this.state.error.message || this.state.error)}</p>
          <button className="btn-primary mt-6" onClick={this.reset}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
