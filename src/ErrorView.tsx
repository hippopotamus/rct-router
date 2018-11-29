import * as React from 'react'

export default class ErrorView extends React.Component {
    state = { hasError: false }

    componentDidCatch() {
        this.setState({ hasError: true })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div>Oops, there was an error on our end. Sorry!</div>
            )
        }

        return this.props.children
    }
}
