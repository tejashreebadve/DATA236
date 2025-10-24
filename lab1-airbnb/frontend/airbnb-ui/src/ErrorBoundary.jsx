import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, err: null }; }
  static getDerivedStateFromError(err){ return { hasError: true, err }; }
  componentDidCatch(err, info){ console.error("UI Error:", err, info); }
  render(){
    if (this.state.hasError){
      return (
        <div style={{padding: 16}}>
          <h2>Something went wrong.</h2>
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
