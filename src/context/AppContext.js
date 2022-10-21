import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from '@context/AuthContext'
import { StoreContext } from '@context/StoreContext'
import { usfm2perf } from '@utils/usfm2perf';
import { useRepoClient } from 'dcs-react-hooks';
import EpiteletePerfHtml from "epitelete-perf-html";
import {usfmFilename} from '@common/BooksOfTheBible'
import { decodeBase64ToUtf8 } from '@utils/base64Decode';
import { LITERAL, SIMPLIFIED } from '@common/constants';

export const AppContext = React.createContext({});

export default function AppContextProvider({
  children,
}) {

  const [books, setBooks] = useState([])
  const [ltStState, setLtStState] = useState('')
  const [refresh, setRefresh] = useState(true)
  const [ep, /*setEp*/] = useState(new EpiteletePerfHtml({ 
    proskomma: null, docSetId: "unfoldingWord/en_ltst", options: { historySize: 100 } 
  }))


  const {
    state: {
      authentication,
    },
  } = useContext(AuthContext)

  const {
    state: {
      owner,
      server,
      languageId,
    },
    actions: {
      setCurrentLayout,
    }
  } = useContext(StoreContext)

  const repoClient = useRepoClient({ 
    basePath: `${server}/api/v1/`,
    token: authentication?.token?.sha1,
  })

  const _setBooks = (value) => {
    setBooks(value)
    setRefresh(true)
    setCurrentLayout(null)
  }

  // monitor the refresh state and act when true
  useEffect(() => {
    async function getContent() {
      let _books = books
      let _repoSuffix;
      if ( owner.toLowerCase() === 'unfoldingword' ) {
        if ( ltStState === LITERAL ) {
          _repoSuffix = '_ult'
        } else {
          _repoSuffix = '_ust'
        }
      } else {
        if ( ltStState === LITERAL ) {
          _repoSuffix = '_glt'
        } else {
          _repoSuffix = '_gst'
        }
      }
      const _repo = languageId + _repoSuffix
      for (let i=0; i<_books.length; i++) {
        if ( ! _books[i].content ) {
          const _filename = usfmFilename(_books[i].bookId)
          const _content = await repoClient.repoGetContents(
            owner,_repo,_filename
          ).then(({ data }) => data)
          _books[i].content = _content
          _books[i].repo = _repo
          // note that "content" is the JSON returned from DCS.
          // the actual content is base64 encoded member element "content"
          let _usfmText;
          if (_content && _content.encoding && _content.content) {
            if ('base64' === _content.encoding) {
              _usfmText = decodeBase64ToUtf8(_content.content)
            } else {
              _usfmText = _content.content
            }
            _books[i].usfmText = _usfmText
            _books[i].type = ltStState
            const _perf = usfm2perf(_usfmText)
            _books[i].perf = _perf
            await ep.sideloadPerf(_books[i].bookId.toUpperCase(), _books[i].perf)
            console.log("epitelete books:", ep.localBookCodes())
          } else {
            _books[i].usfmText = null
          }
        }
      }
      setBooks(_books)
      console.log("setBooks():",_books)
      setRefresh(false)
      setLtStState('')
    }
    if ( ep && ltStState === LITERAL || ltStState === SIMPLIFIED ) {
      if (refresh && authentication && owner && server && languageId) {
        getContent()
      }
    }
  }, [authentication, owner, server, languageId, refresh, books, ltStState, ep, setBooks, setLtStState, repoClient])


  // create the value for the context provider
  const context = {
    state: {
      books,
      ltStState,
      repoClient,
      ep,
    },
    actions: {
      setBooks: _setBooks,
      setLtStState,
    }
  };

  return (
    <AppContext.Provider value={context}>
      {children}
    </AppContext.Provider>
  );
};

AppContextProvider.propTypes = {
  /** Children to render inside of Provider */
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

