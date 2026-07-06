// React-children variant of okinafy — walks a rendered children tree and
// normalizes every text node. Used by the chapter reader's em/code/td/th
// renderers so nested markup (<strong> inside <em>, links in table cells)
// is covered without touching the underlying markdown or data.
import { Children, cloneElement, isValidElement } from 'react'
import { okinafy } from './okinafy'

export function okinafyChildren(children) {
  return Children.map(children, (child) => {
    if (typeof child === 'string') return okinafy(child)
    if (isValidElement(child) && child.props?.children != null) {
      return cloneElement(child, undefined, okinafyChildren(child.props.children))
    }
    return child
  })
}

// Flatten a children tree to plain text (for the looksTongan lang="to" test).
export function childrenToText(children) {
  let out = ''
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') out += child
    else if (isValidElement(child) && child.props?.children != null) {
      out += childrenToText(child.props.children)
    }
  })
  return out
}
