import { useState, useContext } from 'react'

import PropTypes from 'prop-types'
import { useRouter } from 'next/router'
import { makeStyles } from '@mui/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import MenuIcon from '@mui/icons-material/Menu'
import AppBar from '@mui/material/AppBar'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'
import Drawer from '@components/Drawer'
import { AuthContext } from '@context/AuthContext'
import { StoreContext } from '@context/StoreContext'
import { AppContext } from '@context/AppContext'
import FeedbackPopup from '@components/FeedbackPopup'
import SelectBookPopup from './SelectBookPopup'
import { randomLetters } from '@utils/randomLetters'

const useStyles = makeStyles(theme => ({
  root: { flexGrow: 1 },
  button: {
    minWidth: '40px',
    padding: '5px 0px',
    marginRight: theme.spacing(3),
  },
  icon: { width: '40px' },
  menuButton: { marginRight: theme.spacing(1) },
  title: {
    flexGrow: 1,
    cursor: 'pointer',
  },
  margin: {
    margin: theme.spacing(1),
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
}))

export default function Header({
  title,
  resetResourceLayout,
  authentication,
  feedback,
  setFeedback,
}) {
  const { user } = authentication
  const classes = useStyles()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const [drawerOpen, setOpen] = useState(false)
  const {
    actions: { logout },
  } = useContext(AuthContext)
  const {
    state: { owner },
    actions: { checkUnsavedChanges },
  } = useContext(StoreContext)
  const {
    state: { books },
    actions: { setBooks, setLtStState },
  } = useContext(AppContext)
  const handleDrawerOpen = () => {
    if (!drawerOpen) {
      setOpen(true)
    }
  }

  const handleDrawerClose = () => {
    if (drawerOpen) {
      setOpen(false)
    }
  }

  const doShowFeedback = () => {
    setFeedback && setFeedback(true)
  }

  const doHideFeedback = () => {
    setFeedback && setFeedback(false)
  }

  const onNext = ({
    pushAccess,
    selectedBook,
    usfmSource,
    owner,
    repository,
    languageId,
    url,
    usfmData,
    uploadedFilename,
  }) => {
    if (!books || !setBooks) {
      return
    }
    let _books = [...books]
    let _entry = { id: null, bookId: null, source: usfmSource, content: null }
    switch (usfmSource) {
      case 'url':
        if (!url) {
          return
        }
        const _owner = randomLetters(3)
        const _lang = randomLetters(2)
        const found = url.match(/[-_\/](?<bookId>[a-zA-Z_]*)\.usfm$/)
        if (found) {
          _entry.bookId = found.groups.bookId
        } else {
          _entry.bookId = url.substr(-10)
        }
        _entry.bookId = _entry.bookId.substr(-3)
        _entry.id = `${_entry.bookId}-${_owner}-${_lang}`
        _entry.url = url
        _entry.readOnly = true
        break
      case 'upload':
      default:
        if (!usfmData) {
          return
        }
        _entry.url = uploadedFilename
        const foundInFilename = uploadedFilename.match(
          /(?<bookId>[a-zA-Z_]*)\.usfm$/
        )
        if (foundInFilename) {
          _entry.bookId = foundInFilename.groups.bookId
        } else {
          _entry.bookId = foundInFilename.substr(-10)
        }
        _entry.bookId = _entry.bookId.substr(-3)

        _entry.id = `${uploadedFilename}`
        _entry.usfmText = usfmData
        _entry.readOnly = true
        break
    }
    _books.push(_entry)
    setBooks(_books)
    console.log('onNext() _books:', _books)
  }

  return (
    <header>
      <AppBar position='static'>
        <Toolbar>
          <div className='flex flex-1 justify-center items-center'>
            <IconButton
              edge='start'
              className={classes.menuButton}
              color='inherit'
              aria-label='menu'
              onClick={handleDrawerOpen}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant='h6'
              className={classes.title}
              onClick={() => router.push('/')}
            >
              {title}
            </Typography>
          </div>
          <>
            {user && owner && router.pathname === '/' && (
              <Fab
                color='primary'
                aria-label='add'
                variant='extended'
                onClick={() => {
                  setShowModal(true)
                }}
              >
                <AddIcon className={classes.extendedIcon} />
                Book
              </Fab>
            )}
          </>
          <>
            <SelectBookPopup
              onNext={onNext}
              showModal={showModal}
              setShowModal={setShowModal}
            />
          </>
        </Toolbar>
      </AppBar>
      <Drawer
        user={user}
        logout={logout}
        open={drawerOpen}
        onOpen={handleDrawerOpen}
        onClose={handleDrawerClose}
        checkUnsavedChanges={checkUnsavedChanges}
        resetResourceLayout={resetResourceLayout}
        showFeedback={doShowFeedback}
      />
      {feedback ? (
        <FeedbackPopup open {...feedback} onClose={doHideFeedback} />
      ) : null}
    </header>
  )
}

Header.propTypes = {
  title: PropTypes.string,
  authentication: PropTypes.object,
  resetResourceLayout: PropTypes.func,
  storeContext: PropTypes.object,
  feedback: PropTypes.bool,
  setFeedback: PropTypes.func,
}
