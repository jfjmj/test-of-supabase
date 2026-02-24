import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const MODE = {
  ENTER_EMAIL: 'enter_email',
  VERIFY_CODE: 'verify_code',
  SET_PASSWORD: 'set_password',
  PASSWORD_LOGIN: 'password_login',
  FORGOT_PASSWORD: 'forgot_password',
  RESET_PASSWORD: 'reset_password',
}

export const AuthModal = ({ isOpen, onClose, initialMode }) => {
  const [mode, setMode] = useState(MODE.ENTER_EMAIL)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isRegister, setIsRegister] = useState(true)

  const { sendOtp, verifyOtp, signIn, signUp, resetPassword, updatePassword } = useAuth()

  useEffect(() => {
    if (initialMode === 'reset_password') {
      setMode(MODE.RESET_PASSWORD)
    }
  }, [initialMode])

  useEffect(() => {
    if (!isOpen) {
      setMode(MODE.ENTER_EMAIL)
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setOtp(['', '', '', '', '', ''])
      setError('')
      setSuccess('')
      setIsRegister(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await sendOtp(email)
      if (error) {
        setError(error.message)
      } else {
        setSuccess(`验证码已发送到 ${email}，请查收邮件！`)
        setMode(MODE.VERIFY_CODE)
        startCountdown()
      }
    } catch (err) {
      setError('发送验证码失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value.replace(/\D/g, '')
    setOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const token = otp.join('')
    if (token.length !== 6) {
      setError('请输入完整的6位验证码')
      setLoading(false)
      return
    }

    try {
      const { error } = await verifyOtp(email, token, 'email')
      if (error) {
        setError(error.message)
      } else {
        if (isRegister) {
          setSuccess('验证成功！请设置你的密码')
          setMode(MODE.SET_PASSWORD)
        } else {
          setSuccess('登录成功！')
          setTimeout(() => onClose(), 1000)
        }
      }
    } catch (err) {
      setError('验证失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('注册成功！')
        setTimeout(() => onClose(), 1500)
      }
    } catch (err) {
      setError('设置密码失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('登录成功！')
        setTimeout(() => onClose(), 1000)
      }
    } catch (err) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('重置密码邮件已发送！请查收邮箱。')
      }
    } catch (err) {
      setError('发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('密码重置成功！')
        setTimeout(() => onClose(), 1500)
      }
    } catch (err) {
      setError('重置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setOtp(['', '', '', '', '', ''])
    setError('')
    setSuccess('')
  }

  const switchMode = (newMode) => {
    resetState()
    setMode(newMode)
  }

  const renderTitle = () => {
    switch (mode) {
      case MODE.ENTER_EMAIL:
        return isRegister ? '✨ 注册新账号' : '📧 邮箱验证码登录'
      case MODE.VERIFY_CODE:
        return '🔐 输入验证码'
      case MODE.SET_PASSWORD:
        return '🔑 设置密码'
      case MODE.PASSWORD_LOGIN:
        return '🔑 密码登录'
      case MODE.FORGOT_PASSWORD:
        return '🔑 找回密码'
      case MODE.RESET_PASSWORD:
        return '🔐 重置密码'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{renderTitle()}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg text-sm">
            {success}
          </div>
        )}

        {mode === MODE.ENTER_EMAIL && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '发送中...' : (isRegister ? '发送验证码注册' : '发送验证码登录')}
            </button>

            <div className="text-center space-y-2 pt-4 border-t border-slate-700">
              {isRegister ? (
                <>
                  <span className="text-slate-400 text-sm">已有账号？</span>
                  <button
                    type="button"
                    onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}
                    className="text-purple-400 hover:text-purple-300 text-sm ml-1"
                  >
                    立即登录
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => switchMode(MODE.PASSWORD_LOGIN)}
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    使用密码登录
                  </button>
                  <span className="text-slate-500 mx-2">|</span>
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    注册新账号
                  </button>
                </>
              )}
            </div>
          </form>
        )}

        {mode === MODE.VERIFY_CODE && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-slate-400 text-sm text-center mb-4">
              验证码已发送至 <span className="text-white">{email}</span>
            </p>

            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 bg-slate-700 text-white text-center text-2xl rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.some(d => !d)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '验证中...' : '验证'}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0 || loading}
                className="text-purple-400 hover:text-purple-300 text-sm disabled:text-slate-500"
              >
                {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => switchMode(MODE.ENTER_EMAIL)}
                className="text-slate-400 hover:text-slate-300 text-sm"
              >
                ← 返回修改邮箱
              </button>
            </div>
          </form>
        )}

        {mode === MODE.SET_PASSWORD && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <p className="text-slate-400 text-sm text-center mb-4">
              验证成功！请设置你的登录密码
            </p>

            <div>
              <label className="block text-slate-300 text-sm mb-2">设置密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="至少6个字符"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="再次输入密码"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '设置中...' : '完成注册'}
            </button>
          </form>
        )}

        {mode === MODE.PASSWORD_LOGIN && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => switchMode(MODE.FORGOT_PASSWORD)}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                忘记密码？
              </button>
            </div>

            <div className="text-center space-y-2 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => switchMode(MODE.ENTER_EMAIL)}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                使用验证码登录
              </button>
              <span className="text-slate-500 mx-2">|</span>
              <button
                type="button"
                onClick={() => { setIsRegister(true); switchMode(MODE.ENTER_EMAIL); }}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                注册新账号
              </button>
            </div>
          </form>
        )}

        {mode === MODE.FORGOT_PASSWORD && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-slate-400 text-sm text-center mb-4">
              输入你的邮箱，我们将发送重置密码链接
            </p>

            <div>
              <label className="block text-slate-300 text-sm mb-2">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '发送中...' : '发送重置链接'}
            </button>

            <div className="text-center pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => switchMode(MODE.PASSWORD_LOGIN)}
                className="text-slate-400 hover:text-slate-300 text-sm"
              >
                ← 返回登录
              </button>
            </div>
          </form>
        )}

        {mode === MODE.RESET_PASSWORD && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-slate-400 text-sm text-center mb-4">
              请输入你的新密码
            </p>

            <div>
              <label className="block text-slate-300 text-sm mb-2">新密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="至少6个字符"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="再次输入密码"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '重置中...' : '重置密码'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default AuthModal
