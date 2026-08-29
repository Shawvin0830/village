export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '录音转写' })
  : { navigationBarTitleText: '录音转写' }
