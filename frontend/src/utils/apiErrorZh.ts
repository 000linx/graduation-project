export function isProbablyChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(String(text || ''))
}

export function toZhAuthErrorMessage(input: { status?: number; message?: string; url?: string }, fallback: string) {
  const status = input.status
  const url = String(input.url || '')
  const raw = String(input.message || '').trim()
  if (raw && isProbablyChinese(raw)) return raw

  const msg = raw.toLowerCase()
  const isUserAuth = url.startsWith('/api/user/login') || url.startsWith('/api/user/register')
  const isAdminAuth = url.startsWith('/api/admin/login')

  if (msg.includes('network error')) return '网络异常，请检查网络后重试'
  if (msg.includes('timeout') || msg.includes('exceeded')) return '请求超时，请稍后重试'

  if (status === 400) {
    if (msg.includes('missing fields')) return '请填写完整信息'
    if (msg.includes('phone already exists')) return '该手机号已注册，请直接登录'
    if (msg.includes('password too short')) return '密码至少 6 位'
    if (msg.includes('passwords do not match')) return '两次输入的密码不一致'
    if (msg.includes('invalid fields')) return '提交信息不合法，请检查后重试'
  }

  if (status === 401) {
    if (msg.includes('invalid credentials')) {
      if (isAdminAuth) return '账号或密码错误'
      return '手机号或密码错误'
    }
    return '未登录或登录已过期，请重新登录'
  }

  if (status === 403) {
    if (msg.includes('admin only')) return '仅管理员账号可登录后台'
    if (isUserAuth || isAdminAuth) return '无权限访问'
  }

  if (status === 409) {
    if (msg.includes('admin already exists')) return '管理员已存在'
  }

  if (status && status >= 500) return '服务器繁忙，请稍后重试'
  return fallback
}

