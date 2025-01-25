import { MenuItem, Select, styled, type SelectChangeEvent } from '@mui/material'

export interface Props {
  // dims from niivueInfo (channel, S, A, R)
  dims: number[]
  focusedLocation: vec3
  selectedChannels: number[]
  setSelectedIndexes: (selectedIndexes: number[]) => void
}

const CustomSelect = styled(Select)(({ _theme }) => ({
  '& .MuiSelect-select': {
    paddingTop: '0px',
    paddingBottom: '0px',
  },
}))

const IndexSelect = (props: Props) => {
  const { dims, focusedLocation, selectedChannels, setSelectedIndexes } = props

  const selectDims = dims
  const selectedIndexes = selectedChannels.concat([
    focusedLocation[0],
    focusedLocation[1],
    focusedLocation[2],
  ])

  const renderSelectDim = (dim: number, idx: number) => {
    const selectedIndex = selectedIndexes.length > idx ? selectedIndexes[idx] : 0

    const onChange = (e: SelectChangeEvent) => {
      const newSelectedIndexes = selectedIndexes.slice()

      // @ts-expect-error e.target.value is number
      newSelectedIndexes[idx] = e.target.value
      setSelectedIndexes(newSelectedIndexes)
    }

    const sx = {
      paddingTop: 0,
      paddingBottom: 0,
      borderRadius: 10,
    }

    return (
      <CustomSelect key={`select-${idx}`} value={selectedIndex} onChange={onChange} sx={sx}>
        {Array.from({ length: dim }).map((_, idx2) => (
          <MenuItem key={`select-item-${idx}-${idx2}`} value={idx2}>
            {idx2}
          </MenuItem>
        ))}
      </CustomSelect>
    )
  }

  return <span>{selectDims.map((each, idx) => renderSelectDim(each, idx))}</span>
}

export default IndexSelect
