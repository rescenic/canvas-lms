/*
 * Copyright (C) 2024 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react'
import {useEditor, useNode} from '@craftjs/core'
import {MediaBlockToolbar} from './MediaBlockToolbar'
import {useClassNames} from '../../../../utils'
import {type MediaBlockProps, type MediaVariant, type MediaConstraint} from './types'
import {BlockResizer} from '../../../editor/BlockResizer'

import {useScope as useI18nScope} from '@canvas/i18n'

const I18n = useI18nScope('block-editor/media-block')

const MediaBlock = ({
  src,
  width,
  height,
  constraint,
  maintainAspectRatio,
  sizeVariant,
  title,
}: MediaBlockProps) => {
  const {enabled} = useEditor(state => ({
    enabled: state.options.enabled,
  }))
  const {
    actions: {setCustom},
    connectors: {connect, drag},
  } = useNode()
  const clazz = useClassNames(enabled, {empty: !src}, ['block', 'media-block'])
  const [styl, setStyl] = useState<any>({})
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(1)
  // in preview mode, node.dom is null, so use a ref to the element
  const [blockRef, setBlockRef] = useState<HTMLDivElement | null>(null)
  const mediaRef = useRef<HTMLMediaElement | null>(null)

  const setSize = useCallback(() => {
    if (!blockRef) return

    if (!src || sizeVariant === 'auto') {
      setStyl({
        width: 'auto',
        height: 'auto',
      })
      return
    }
    const sty: any = {}
    const unit = sizeVariant === 'percent' ? '%' : 'px'
    if (width) {
      sty.width = `${width}${unit}`
    }
    if (maintainAspectRatio) {
      sty.height = 'auto'
    } else {
      sty.height = `${height}${unit}`
    }
    setStyl(sty)
  }, [blockRef, height, maintainAspectRatio, sizeVariant, src, width])

  useEffect(() => {
    if (!src) return
    if (mediaLoaded) return

    const loadTimer = window.setInterval(() => {
      if (!mediaRef.current) return
      if (!mediaRef.current.complete) return

      const media = mediaRef.current
      setMediaLoaded(true)
      setAspectRatio(media.naturalWidth / media.naturalHeight)
      clearInterval(loadTimer)
    }, 10)
    return () => {
      clearInterval(loadTimer)
    }
  }, [mediaLoaded, src])

  useEffect(() => {
    setSize()
  }, [width, height, aspectRatio, setSize])

  useEffect(() => {
    setCustom((ctsm: any) => {
      ctsm.isResizable = !!src && sizeVariant !== 'auto'
    })
  }, [setCustom, sizeVariant, src])

  const tagConstraint =
    (maintainAspectRatio ? 'cover' : constraint) || MediaBlock.craft.defaultProps.constraint
  if (!src) {
    return (
      <div
        role="treeitem"
        aria-label={MediaBlock.craft.displayName}
        tabIndex={-1}
        className={clazz}
        style={styl}
        ref={el => el && connect(drag(el as HTMLDivElement))}
      />
    )
  } else {
    return (
      <div
        role="treeitem"
        aria-label={MediaBlock.craft.displayName}
        tabIndex={-1}
        className={clazz}
        style={{...styl, position: 'relative'}}
        ref={el => {
          el && connect(drag(el as HTMLDivElement))
          setBlockRef(el)
        }}
      >
        <iframe
          style={{
            width: '100%',
            height: '100%',
            objectFit: tagConstraint,
            display: 'inline-block',
          }}
          title={title || ''}
          src={src || MediaBlock.craft.defaultProps.src}
        />
      </div>
    )
  }
}

MediaBlock.craft = {
  displayName: I18n.t('Media'),
  defaultProps: {
    src: '',
    variant: 'default' as MediaVariant,
    constraint: 'cover' as MediaConstraint,
    maintainAspectRatio: false,
    sizeVariant: 'auto',
    title: '',
  },
  related: {
    toolbar: MediaBlockToolbar,
    resizer: BlockResizer,
  },
  custom: {
    isResizable: true,
    isBlock: true,
  },
}

export {MediaBlock}
