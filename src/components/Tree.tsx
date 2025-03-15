import type { Dispatch, RefObject, SetStateAction } from 'react'

import type { PaletteMode } from '@mui/material'
import * as d3 from 'd3'
import type { D3Node } from './d3node'

// https://observablehq.com/@d3/collapsible-tree

export const Tree = (
  ref: RefObject<SVGSVGElement>,
  meta: D3Node,
  SVGWidth: number,
  setAssignedNode: Dispatch<SetStateAction<D3Node>>,

  windowHeight: number,

  themeMode: PaletteMode,
) => {
  /////
  // const
  /////
  const marginTop = 40
  const marginRight = 10
  const marginBottom = 40
  const marginLeft = 40
  const fontSize = 20
  const halfFontSize = fontSize / 2

  /////
  // data
  /////
  const root = d3.hierarchy(meta)
  const maxLengthName: number = root.descendants().reduce((r, x) => {
    return x.data.name.length > r ? x.data.name.length : r
  }, 0)
  const dx = 40
  const dy = Math.max(
    (SVGWidth - marginRight - marginLeft) / (1 + root.height),
    (maxLengthName * halfFontSize) / 2,
  )

  const tree = d3.tree().nodeSize([dx, dy])

  const initTree = (root: d3.HierarchyNode<D3Node>, isShowAll = false) => {
    root.descendants().forEach((d, i) => {
      // @ts-expect-error d3 type
      d.id = i
      // @ts-expect-error d3 type
      d._children = d.children
    })

    if (!isShowAll) {
      const nodes = root.descendants()
      for (const node of nodes) {
        if (node.data.nnnode) {
          // @ts-expect-error d3 children
          node.children = null
        }
        if (node.data.items) {
          // @ts-expect-error d3 children
          node.children = null
        }
        if (node.data.taskflow) {
          // @ts-expect-error d3 children
          node.children = null
        }
      }
    }

    // @ts-expect-error tree(root)
    tree(root)

    // Stash the old positions for transition.
    root.eachBefore((d) => {
      // @ts-expect-error d3 type
      d.x0 = d.x
      // @ts-expect-error d3 type
      d.y0 = d.y
    })
  }

  initTree(root, true)

  const calcHeight = (root: d3.HierarchyNode<D3Node>, marginTop: number, marginBottom: number) => {
    let left = root
    let right = root
    let top = root
    let bottom = root
    root.eachBefore((node) => {
      // @ts-expect-error d3 type
      if (node.x < left.x) left = node
      // @ts-expect-error d3 type
      if (node.x > right.x) right = node

      // @ts-expect-error d3 type
      if (node.y < top.y) top = node
      // @ts-expect-error d3 type
      if (node.y > bottom.y) bottom = node
    })

    // @ts-expect-error d3 x
    return right.x - left.x + marginTop + marginBottom
  }

  // setup maxRoom
  const calcMaxRoom = (root: d3.HierarchyNode<D3Node>, marginTop: number, marginBottom: number) => {
    const height = calcHeight(root, marginTop, marginBottom)
    // @ts-expect-error parseInt can be used with numbers)
    return Math.max(Number.parseInt(height / 100), 1)
  }

  const maxZoom = calcMaxRoom(root, marginTop, marginBottom)

  // biome-ignore lint/suspicious/noExplicitAny: unsure about the event type for zoomed.
  const zoomed = (event: any) => {
    const { transform } = event
    gLinkGroup.attr('transform', transform)
    gLinkGroup.attr('stroke-width', 1 / transform.k)

    gNodeGroup.attr('transform', transform)
    gNodeGroup.attr('stroke-width', 1 / transform.k)
  }

  const zoom = d3.zoom().scaleExtent([1, maxZoom]).on('zoom', zoomed)

  // not showing subtree
  initTree(root, false)

  const diagonal = d3
    .linkHorizontal()
    // @ts-expect-error d3 type
    .x((d: d3.HierarchyNode<D3Node>) => d.y)
    // @ts-expect-error d3 type
    .y((d: d3.HierarchyNode<D3Node>) => d.x)

  const height = calcHeight(root, marginTop, marginBottom)
  const viewHeight = height

  // @ts-expect-error parseInt can be used with number
  const zoomScale = Math.max(Number.parseInt(height / 800), 1)

  const viewMarginTop = (windowHeight / 2) * zoomScale

  // @ts-expect-error parseInt can be used with number
  const strokeWidth = Number.parseInt(Math.log(height) / 2) + 1
  const circleRadius = Math.min(2.5 * zoomScale, 5)

  let viewX = -marginLeft - (root.data.name.length * fontSize) / 2
  // @ts-expect-error: x is ok after tree(root)
  let viewY = root.x - viewMarginTop

  /////
  // svg
  /////
  const svg = d3.select(ref.current)

  svg.on('mousemove', (event: MouseEvent) => {
    if (!event.buttons) {
      return
    }

    if (!event.movementX && !event.movementY) {
      return
    }

    viewX -= event.movementX
    viewY -= event.movementY

    update(event, root)
  })

  /////
  // link-group.
  /////
  const gLinkGroup = svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#f00')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 2)

  /////
  // node-group.
  /////
  const gNodeGroup = svg.append('g').attr('cursor', 'pointer').attr('pointer-events', 'all')

  /////
  // svg zoom
  // needs link and nodes initialized before calling zoom.
  /////
  /* eslint-disable */
  // @ts-expect-error d3 zoom
  svg.call(zoom).call(zoom.transform, new d3.ZoomTransform(zoomScale, 0, 0))
  /* eslint-enable */

  const dataToText = (data: D3Node) => {
    const nameArray = [data.prefix, data.name, data.postfix].filter((x) => x)
    return nameArray.join('-')
  }

  const update = (event: MouseEvent | null, source: d3.HierarchyNode<D3Node>, isInit = false) => {
    // @ts-expect-error tree(root)
    tree(root)

    const noAltKeyDuration = isInit ? 0 : 125
    const duration = event?.altKey ? 2500 : noAltKeyDuration // hold the alt key to slow down the transition

    const height = calcHeight(root, marginTop, marginBottom)

    const transition = svg
      .transition()
      .duration(duration)
      .attr('height', height)
      // @ts-expect-error d3 type
      .attr('viewBox', [viewX, viewY, SVGWidth, viewHeight])
      // @ts-expect-error d3 type
      .tween('resize', window.ResizeObserver ? null : () => () => svg.dispatch('toggle'))

    /////
    // nodes
    /////
    const nodes = root.descendants().reverse()

    // @ts-expect-error d3 type
    const node = gNodeGroup.selectAll('g').data(nodes, (d: d3.HierarchyNode<D3Node>) => d.id)

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append('g')
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .on('click', (event: MouseEvent, d: d3.HierarchyNode<D3Node>) => {
        // @ts-expect-error d3 type
        d.children = d.children ? null : d._children

        update(event, d)

        setAssignedNode(d.data)
      })

    nodeEnter
      .append('circle')
      .attr('r', circleRadius)
      // @ts-expect-error d3 type
      .attr('fill', (d) => (d._children ? '#555' : '#999'))
      .attr('stroke-width', 10)

    const fontColor = themeMode === 'dark' ? 'white' : 'black'
    nodeEnter
      .append('text')
      .attr('dy', '0.31em')
      // @ts-expect-error d3 type
      .attr('x', (d) => (d._children ? -6 : 6))
      // @ts-expect-error d3 type
      .attr('text-anchor', (d) => (d._children ? 'end' : 'start'))
      .text((d) => dataToText(d.data))
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 1)
      .attr('stroke', 'white')
      .attr('paint-order', 'stroke')
      .attr('fill', fontColor)
      .style('font-size', `${fontSize}px`)

    // Transition exiting nodes to the parent's new position.
    node.exit().remove()

    // Transition nodes to their new position.
    node
      // @ts-expect-error d3 type
      .merge(nodeEnter)
      // @ts-expect-error d3 transition
      .transition(transition)
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .attr('fill-opacity', 1)
      .attr('stroke-opacity', 1)

    /////
    // nodes
    /////
    const links = root.links()
    // Update the links…
    // @ts-expect-error d3 type
    const link = gLinkGroup
      .selectAll('path')
      .data(links, (d: d3.HierarchyNode<D3Node>) => d.target.id)

    const linkEnter = link.enter().append('path').attr('stroke-width', strokeWidth)

    // Enter any new links at the parent's previous position.
    linkEnter.attr('d', () => {
      // @ts-expect-error d3 type
      const o = { x: source.x0, y: source.y0 }
      // @ts-expect-error d3 type
      return diagonal({ source: o, target: o })
    })

    // Transition exiting nodes to the parent's new position.
    link.exit().remove()

    // Transition links to their new position.
    // @ts-expect-error d3 type
    link.merge(linkEnter).transition(transition).attr('d', diagonal)

    // Stash the old positions for transition.
    root.eachBefore((d) => {
      // @ts-expect-error d3 type
      d.x0 = d.x
      // @ts-expect-error d3 type
      d.y0 = d.y
    })
  }

  update(null, root, true)
}

export const TreeClean = (ref: RefObject<SVGSVGElement>) => {
  d3.select(ref.current).selectAll('*').remove()
}
