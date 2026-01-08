import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'da95iutu',
    dataset: 'production'
  },
  deployment: {
    appId: 'h6rwnckyuxepgnxvqk4u8o0s',
    autoUpdates: true,
  }
})
