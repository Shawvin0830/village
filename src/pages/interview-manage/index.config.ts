export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '编辑采访记录' })
  : { navigationBarTitleText: '编辑采访记录' }
