import { createContext, useContext } from 'react'

/**
 * Shared PDF file context for single-PDF FOLIO operations.
 * Upload once — the file persists as you switch between operations.
 */
const defaultValue = {
  fileData: null,
  uploading: false,
  uploadError: null,
  handleFile: () => {},
}

export const FolioFileContext = createContext(defaultValue)

export function useFolioFile() {
  return useContext(FolioFileContext)
}
