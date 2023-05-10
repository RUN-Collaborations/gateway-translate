import { useEffect, useState, useContext, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Card } from 'translation-helps-rcl'
import { UsfmEditor } from 'uw-editor'
import { BIBLE_AND_OBS } from '@common/BooksOfTheBible'
import { StoreContext } from '@context/StoreContext'
import { AppContext } from '@context/AppContext'
import React from 'react'
import CircularProgress from './CircularProgress'

export default function ScriptureWorkspaceCard({
  id,
  bookId,
  docSetId,
  data,
  classes,
  onSave: saveToWorkspace,
  onClose: removeBook,
}) {
  const [doSave, setDoSave] = useState(false)

  const {
    state: {
      owner,
      bibleReference,
    },
    actions: {
      onReferenceChange,
    }
  } = useContext(StoreContext)

  const activeReference = {
    bookId: bookId.toLowerCase(),
    chapter: Number(bibleReference.chapter),
    verse: Number(bibleReference.verse),
  }

  const onReferenceSelected = ({bookIdFromEditor, chapter, verse}) => {
    const normalizedBookId = (bookIdFromEditor || bookId).toLowerCase()
    onReferenceChange(normalizedBookId, chapter.toString(), verse.toString())
  }

  const {
    state: { books, repoClient, ep },
    actions: { setBooks },
  } = useContext(AppContext)

  // Save Feature
  useEffect(() => {
    async function saveContent() {
      const url = URL.createObjectURL(new Blob([doSave]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${bookId}.usfm`
      a.click()
      URL.revokeObjectURL(url)
      setDoSave(null)
    }
    if (doSave) {
      console.log('New updated USFM:', doSave)
      saveToWorkspace(id, doSave)
      saveContent()
    }
  }, [
    doSave,
    books,
    setBooks,
    id,
    docSetId,
    data,
    owner,
    ep,
    repoClient,
    bookId,
  ])

  // const editorProps = {
  //   onSave: (bookCode,usfmText) => setDoSave(usfmText),
  //   docSetId,
  //   // usfmText: data.usfmText,
  //   bookId: data.bookId,
  // }

  let title = ''
  if (BIBLE_AND_OBS[bookId.toLowerCase()]) {
    title += BIBLE_AND_OBS[bookId.toLowerCase()]
  }
  if (data.url) {
    title += ' (' + data.url + ')'
  } else {
    title += ' (' + id + ')'
  }

  return (
    <Card
      title={title}
      classes={classes}
      hideMarkdownToggle={true}
      closeable={true}
      onClose={() => removeBook(id)}
      key={bookId}
      disableSettingsButton={true}
    >
      {
        // ep[docSetId]?.localBookCodes().includes(bookId.toUpperCase())
        data.usfmText
        ?
          <UsfmEditor key="1"
            bookId={data.bookId}
            docSetId={docSetId}
            usfmText={data.usfmText}
            onSave={ (bookCode,usfmText) => setDoSave(usfmText) }
            editable={id.endsWith(owner) ? true : false}
            // commenting out this code for v0.9
            // see issue 152
            // activeReference={bibleReference}
            // onReferenceSelected={onReferenceSelected}
          />
        :
        (
          typeof data.content === "string"
          ?
          <div><h1>{data.content}</h1></div>
          :
          <CircularProgress/>
        )
      }
    </Card>
  )
}

ScriptureWorkspaceCard.propTypes = {
  bookId: PropTypes.string,
  classes: PropTypes.object,
}
