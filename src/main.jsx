import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props)
		this.state = { hasError: false, error: null }
	}
	static getDerivedStateFromError(error) {
		return { hasError: true, error }
	}
	componentDidCatch(error, info) {
		console.error('ErrorBoundary caught:', error, info)
	}
	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: 16 }}>
					<h2>Algo deu errado no App.</h2>
					<pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
				</div>
			)
		}
		return this.props.children
	}
}

const root = createRoot(document.getElementById('root'))
root.render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
)
