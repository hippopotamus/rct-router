import * as React from 'react'

export class ErrorView extends React.Component<React.PropsWithChildren<{}>> {
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
