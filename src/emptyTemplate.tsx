import React, { Component } from 'react'

export type EmptyTemplateProps = {
    children: React.ReactElement<any>
}

export default (props: EmptyTemplateProps) => props.children
