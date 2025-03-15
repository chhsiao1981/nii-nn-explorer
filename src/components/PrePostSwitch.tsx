import { alpha, styled, Switch } from '@mui/material'
import type { Dispatch, SetStateAction, SyntheticEvent } from 'react'
import styles from './Switch.module.css'
import { lightBlue, green } from '@mui/material/colors'

export interface Props {
  prefix: string
  postfix: string
  setValue: Dispatch<SetStateAction<boolean>>
  className?: string
}

const ColorSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase': {
    color: green[300],
    '&:hover': {
      backgroundColor: alpha(green[300], theme.palette.action.hoverOpacity),
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: lightBlue[200],
    '&:hover': {
      backgroundColor: alpha(lightBlue[200], theme.palette.action.hoverOpacity),
    },
  },
  '& .MuiSwitch-switchBase + .MuiSwitch-track': {
    backgroundColor: green[300],
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: lightBlue[200],
  },
}))

const PrePostSwitch = (props: Props) => {
  const { prefix, postfix, setValue, className: propsClassName } = props

  const onChange = (_: SyntheticEvent, value: boolean) => {
    setValue(value)
  }

  const className = propsClassName ?? styles['switch']
  return (
    <span className={className}>
      {prefix}
      <ColorSwitch defaultChecked onChange={onChange} />
      {postfix}
    </span>
  )
}

export default PrePostSwitch
