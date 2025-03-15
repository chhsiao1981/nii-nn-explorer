import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { Niivue, NVImage } from '@niivue/niivue/packages/niivue/src/niivue'
import React from 'react'
import { type TableComponents, TableVirtuoso } from 'react-virtuoso'
import { Fragment } from 'react/jsx-runtime'

import Paper from '@mui/material/Paper'
import type { vec3 } from 'gl-matrix'

// https://mui.com/material-ui/react-table/

export interface Props {
  theNiivue: Niivue | null
  vox: vec3
}

interface Data {
  name: string
  channel: number
  value: string
}

interface ColumnData {
  dataKey: keyof Data
  label: string
  numeric?: boolean
  width?: number
}

const columns: ColumnData[] = [
  {
    width: 100,
    label: 'name',
    dataKey: 'name',
  },
  {
    width: 30,
    label: 'channel',
    dataKey: 'channel',
    numeric: true,
  },
  {
    width: 30,
    label: 'value',
    dataKey: 'value',
    numeric: true,
  },
]

const VirtuosoTableComponents: TableComponents<Data> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />,
  TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableHead {...props} ref={ref} />
  )),
  TableRow,
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
}

const fixedHeaderContent = () => {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          variant='head'
          align={column.numeric || false ? 'right' : 'left'}
          style={{ width: column.width }}
          sx={{ backgroundColor: 'background.paper' }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  )
}

const rowContent = (_index: number, row: Data) => {
  return (
    <Fragment>
      {columns.map((column) => (
        <TableCell key={column.dataKey} align={column.numeric || false ? 'right' : 'left'}>
          {row[column.dataKey]}
        </TableCell>
      ))}
    </Fragment>
  )
}

const nvimageToData = (img: NVImage, idx: number, vox: vec3): Data => {
  const value = img.getValue(vox[0], vox[1], vox[2], idx).toFixed(3)
  return { name: img.name, channel: idx, value }
}

const InfoTable = (props: Props) => {
  const { theNiivue, vox } = props
  if (!theNiivue) {
    return <div style={{ display: 'none' }} />
  }

  const theImg = theNiivue.overlays?.length ? theNiivue.overlays[0] : theNiivue.back
  const rows: Data[] = theImg?.nFrame4D
    ? Array.from({ length: theImg.nFrame4D }).map((_, idx) => nvimageToData(theImg, idx, vox))
    : []

  return (
    <TableVirtuoso
      data={rows}
      components={VirtuosoTableComponents}
      fixedHeaderContent={fixedHeaderContent}
      itemContent={rowContent}
    />
  )
}

export default InfoTable
