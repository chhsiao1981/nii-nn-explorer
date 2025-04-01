import {
  Breadcrumbs,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  type PaletteMode,
  Select,
  type SelectChangeEvent,
} from '@mui/material'

import GitHubIcon from '@mui/icons-material/GitHub'

import type { Dispatch, SetStateAction } from 'react'

import CircularProgress from '@mui/material/CircularProgress'

import type { Extractor, Model } from '../reducers/types'
import styles from './Header.module.css'
import ThemeSwitch from './ThemeSwitch'
import Brand from './brand'
import type { D3Node } from './d3node'

export interface Props {
  modelList: Model[]
  metaList: Extractor[]
  changeModel: (model: Model) => void
  changeMeta: (meta: Extractor) => void
  selectedModel: Model | null
  selectedMetaName: string
  assignedNode: D3Node

  initThemeMode: PaletteMode
  themeMode: PaletteMode
  setThemeMode: Dispatch<SetStateAction<PaletteMode>>
  isBusy: boolean
}

const Header = (props: Props) => {
  const {
    modelList,
    metaList,
    changeModel: propChangeModel,
    changeMeta: propChangeMeta,
    selectedModel,
    selectedMetaName,
    assignedNode,

    initThemeMode,
    themeMode,
    setThemeMode,

    isBusy,
  } = props
  const renderModel = (model: Model | null, idx: number) => (
    <MenuItem key={`model-${idx}`} value={model?.name ?? ''}>
      {model?.name ?? ''}
    </MenuItem>
  )
  const renderMeta = (meta: Extractor | null, idx: number) => (
    <MenuItem key={`meta-${idx}`} value={meta?.name ?? ''}>
      {meta?.name ?? ''}
    </MenuItem>
  )

  const changeModel = (event: SelectChangeEvent) => {
    const model = modelList.find((model) => model.name === event.target.value)
    propChangeModel(model)
  }

  const changeMeta = (event: SelectChangeEvent) => {
    const meta = metaList.find((meta) => meta.name === event.target.value)
    propChangeMeta(meta)
  }

  const renderSelected = (selected: string | null | undefined, placeholder: string) => {
    return selected ?? placeholder
  }

  const githubLinkStyle = {
    color: themeMode === 'dark' ? 'white' : 'black',
  }

  return (
    <div className={styles['header']}>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <Brand />
      </FormControl>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <InputLabel id='select-model'>Model</InputLabel>
        <Select
          labelId='select-model'
          id='select-model'
          value={selectedModel?.name ?? ''}
          renderValue={(selected) => renderSelected(selected, 'select model')}
          label='Model'
          onChange={changeModel}
          aria-placeholder='select model'
          className={styles['select']}
        >
          {modelList.map((each, idx) => renderModel(each, idx))}
        </Select>
      </FormControl>

      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <InputLabel id='select-meta'>Input</InputLabel>
        <Select
          labelId='select-meta'
          id='select-meta'
          value={selectedMetaName}
          renderValue={(selected) => renderSelected(selected, 'select model')}
          label='Input'
          onChange={changeMeta}
          aria-placeholder='select input'
        >
          {metaList.map(renderMeta)}
        </Select>
      </FormControl>
      {isBusy && <CircularProgress />}

      <a
        href='https://github.com/chhsiao1981/nii-nn-explorer'
        rel='noopener noreferrer'
        target='_blank'
        className={styles['github-icon']}
        style={githubLinkStyle}
      >
        <GitHubIcon sx={{ width: '36px', height: '36px' }} />
      </a>
      <FormControl className={styles['theme-switch']}>
        <ThemeSwitch
          themeMode={themeMode}
          initThemeMode={initThemeMode}
          setThemeMode={setThemeMode}
        />
      </FormControl>

      <Breadcrumbs aria-label='breadcrumb'>
        <Link underline='hover' color='inherit' href={`/${selectedModel?.name ?? ''}`}>
          {selectedModel?.name ?? ''}
        </Link>
        <Link
          underline='hover'
          color='inherit'
          href={`/${selectedModel?.name ?? ''}/${selectedMetaName ?? ''}`}
        >
          {selectedMetaName ?? ''}
        </Link>
        <Link
          underline='hover'
          color='inherit'
          href={`/${selectedModel?.name ?? ''}/${selectedMetaName ?? ''}`}
        >
          {assignedNode.name || '(none)'}
        </Link>
      </Breadcrumbs>
    </div>
  )
}

export default Header
