import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './contexts/AuthContext'
import AuthModal from './components/AuthModal'

const AI_PERSONA = `你是一位幽默且专业的 HTML 老师！你的名字叫"小码老师"。

你的特点：
1. 用轻松幽默的方式讲解 HTML 知识，经常用有趣的比喻
2. 会用表情符号让对话更生动 🎉
3. 当用户写出代码时，会给予鼓励和建设性的建议
4. 善于用生活中的例子来解释抽象的概念
5. 会根据用户的水平调整教学方式

当用户需要练习时，你会给出小任务让他们尝试。
如果用户写的代码有问题，你会温和地指出并解释原因。

现在，请用中文回复用户，保持友好和幽默的风格！`

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `👋 嘿！欢迎来到 HTML 学习之旅！我是你的专属导师"小码老师"！

🎯 今天我们要一起探索神奇的 HTML 世界！

你可以：
- 问我任何关于 HTML 的问题
- 让我给你出练习题
- 发送你的代码让我帮你检查

准备好了吗？让我们开始吧！🚀`
}

const MODELS = {
  local: { id: 'local', name: '本地模型', description: '免费，回复较机械' },
  deepseek: { id: 'deepseek', name: 'DeepSeek', description: '智能，需 API Key' },
}

const callDeepSeekAPI = async (messages) => {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: AI_PERSONA },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error('DeepSeek API 调用失败')
  }

  const data = await response.json()
  return data.choices[0].message.content
}

const AI_RESPONSES = {
  greeting: [
    '👋 嘿！很高兴见到你！今天想学点什么呢？我可以教你 HTML 的基础知识！',
    '🎉 欢迎来到 HTML 学习之旅！有什么问题尽管问我！',
    '😊 你好呀！准备好探索 HTML 的神奇世界了吗？'
  ],
  html: {
    basic: `太棒了！让我来给你介绍 HTML 的基础！🎉

HTML（超文本标记语言）是网页的骨架，就像房子的框架一样！

**基本结构：**
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>我的第一个网页</title>
</head>
<body>
  <h1>你好，世界！</h1>
  <p>这是我的第一个网页</p>
</body>
</html>
\`\`\`

**解释：**
- \`<!DOCTYPE html>\` - 告诉浏览器这是 HTML5
- \`<html>\` - 整个网页的根元素
- \`<head>\` - 包含网页的元信息（标题、样式等）
- \`<body>\` - 包含网页的可见内容

试试把这段代码发给我，看看效果！🚀`,
    
    tags: `好的！让我介绍一些常用的 HTML 标签！📚

**标题标签：**
\`\`\`html
<h1>最大标题</h1>
<h2>第二大标题</h2>
<h3>第三大标题</h3>
\`\`\`

**段落和文本：**
\`\`\`html
<p>这是一个段落</p>
<strong>加粗文本</strong>
<em>斜体文本</em>
\`\`\`

**链接和图片：**
\`\`\`html
<a href="https://example.com">点击这里</a>
<img src="图片地址" alt="图片描述">
\`\`\`

**列表：**
\`\`\`html
<ul>
  <li>无序列表项1</li>
  <li>无序列表项2</li>
</ul>

<ol>
  <li>有序列表项1</li>
  <li>有序列表项2</li>
</ol>
\`\`\`

你想试试哪个标签呢？🤔`,

    div: `\`<div>\` 是一个容器标签，超级有用！📦

想象 \`<div>\` 就像一个盒子，可以把其他元素装进去！

\`\`\`html
<div style="background: #f0f0f0; padding: 20px;">
  <h2>这是一个区块</h2>
  <p>里面可以放任何内容</p>
</div>
\`\`\`

**特点：**
- 默认是块级元素（独占一行）
- 常用于布局和分组
- 配合 CSS 可以创建各种样式

试试这个例子，看看效果！🎨`,

    form: `表单是收集用户输入的重要工具！📝

\`\`\`html
<form>
  <label for="name">姓名：</label>
  <input type="text" id="name" placeholder="请输入姓名">
  
  <label for="email">邮箱：</label>
  <input type="email" id="email" placeholder="请输入邮箱">
  
  <label>性别：</label>
  <input type="radio" name="gender" id="male"> <label for="male">男</label>
  <input type="radio" name="gender" id="female"> <label for="female">女</label>
  
  <label>爱好：</label>
  <input type="checkbox" id="reading"> <label for="reading">阅读</label>
  <input type="checkbox" id="coding"> <label for="coding">编程</input>
  
  <label for="message">留言：</label>
  <textarea id="message" rows="4" placeholder="请输入留言"></textarea>
  
  <button type="submit">提交</button>
</form>
\`\`\`

**常用表单元素：**
- \`<input>\` - 各种输入框
- \`<textarea>\` - 多行文本
- \`<select>\` - 下拉选择
- \`<button>\` - 按钮

试试看效果如何！🎯`,

    table: `表格可以让数据更有条理！📊

\`\`\`html
<table border="1" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
      <th>城市</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>小明</td>
      <td>25</td>
      <td>北京</td>
    </tr>
    <tr>
      <td>小红</td>
      <td>23</td>
      <td>上海</td>
    </tr>
  </tbody>
</table>
\`\`\`

**表格结构：**
- \`<table>\` - 表格容器
- \`<thead>\` - 表头区域
- \`<tbody>\` - 表格主体
- \`<tr>\` - 表格行
- \`<th>\` - 表头单元格
- \`<td>\` - 数据单元格

试试这个表格！📈`,

    semantic: `语义化标签让代码更有意义！🏗️

\`\`\`html
<header>
  <nav>
    <a href="#">首页</a>
    <a href="#">关于</a>
  </nav>
</header>

<main>
  <article>
    <h1>文章标题</h1>
    <section>
      <h2>第一章</h2>
      <p>这是内容...</p>
    </section>
  </article>
</main>

<footer>
  <p>&copy; 2024 我的网站</p>
</footer>
\`\`\`

**语义化标签：**
- \`<header>\` - 页头
- \`<nav>\` - 导航
- \`<main>\` - 主要内容
- \`<article>\` - 文章
- \`<section>\` - 区块
- \`<footer>\` - 页脚

这样写代码更清晰，对搜索引擎也更友好！🔍`,

    exercise: `来做个小练习吧！💪

**任务：创建一个简单的个人卡片**

试着写一个包含以下内容的 HTML：
1. 一个标题（你的名字）
2. 一段自我介绍
3. 一个链接（你的社交媒体或邮箱）

**提示：**
\`\`\`html
<div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 10px; color: white;">
  <h1>你的名字</h1>
  <p>你的自我介绍</p>
  <a href="#" style="color: #ffd700;">联系我</a>
</div>
\`\`\`

写好代码发给我，我来帮你看看！👀`
  },
  
  codeFeedback: {
    good: [
      '🎉 太棒了！你的代码写得很好！',
      '👏 非常不错！你已经掌握了这个知识点！',
      '✅ 完美！代码结构很清晰！'
    ],
    improve: [
      '💡 代码不错！这里有个小建议：',
      '📝 写得很好！可以试试这样改进：',
      '🔧 不错的尝试！让我给你一些建议：'
    ]
  },
  
  default: [
    '🤔 好问题！让我想想怎么回答你...',
    '📚 这个问题很有意思！让我来解释一下...',
    '💭 嗯，让我用简单的方式告诉你...'
  ],
  
  help: `我可以帮你学习以下内容：

📖 **HTML 基础**
- 输入"基础"或"html"了解 HTML 结构
- 输入"标签"学习常用标签
- 输入"div"了解 div 容器
- 输入"表单"学习表单元素
- 输入"表格"学习表格制作
- 输入"语义"了解语义化标签

🎯 **练习**
- 输入"练习"获取编程任务

💬 **其他**
- 直接发送你的 HTML 代码，我会帮你检查！

你想学什么呢？🚀`
}

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

const containsHtmlCode = (text) => {
  return text.includes('<') && text.includes('>') && (text.includes('</') || text.includes('/>'))
}

const generateLocalResponse = (userMessage) => {
  const msg = userMessage.toLowerCase()
  
  if (msg.includes('帮助') || msg.includes('help') || msg === '?' || msg === '？') {
    return AI_RESPONSES.help
  }
  
  if (msg.includes('基础') || msg.includes('html基础') || msg.includes('入门') || msg === 'html') {
    return AI_RESPONSES.html.basic
  }
  
  if (msg.includes('标签') || msg.includes('tag')) {
    return AI_RESPONSES.html.tags
  }
  
  if (msg.includes('div') || msg.includes('容器') || msg.includes('盒子')) {
    return AI_RESPONSES.html.div
  }
  
  if (msg.includes('表单') || msg.includes('form') || msg.includes('输入')) {
    return AI_RESPONSES.html.form
  }
  
  if (msg.includes('表格') || msg.includes('table')) {
    return AI_RESPONSES.html.table
  }
  
  if (msg.includes('语义') || msg.includes('semantic') || msg.includes('结构')) {
    return AI_RESPONSES.html.semantic
  }
  
  if (msg.includes('练习') || msg.includes('任务') || msg.includes('作业')) {
    return AI_RESPONSES.html.exercise
  }
  
  if (msg.includes('你好') || msg.includes('嗨') || msg.includes('hi') || msg.includes('hello')) {
    return getRandomItem(AI_RESPONSES.greeting)
  }
  
  if (containsHtmlCode(userMessage)) {
    const feedback = getRandomItem(AI_RESPONSES.codeFeedback.good)
    return `${feedback}

你的代码看起来很棒！

**一些小建议：**
1. 确保所有标签都正确闭合
2. 可以尝试添加更多样式让页面更美观
3. 继续练习，你会越来越厉害！

还有什么想学的吗？输入"帮助"查看更多内容！😊`
  }
  
  return getRandomItem(AI_RESPONSES.default) + `

如果你想了解具体内容，可以输入：
- "基础" - 学习 HTML 基础
- "标签" - 学习常用标签
- "表单" - 学习表单制作
- "练习" - 获取编程任务

或者直接发送你的 HTML 代码，我会帮你检查！🚀`
}

function App() {
  const { user, loading, signOut } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState(null)
  const [currentModel, setCurrentModel] = useState('deepseek')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.split('?')[1] || '')
    
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setShowAuthModal(true)
      setAuthModalMode('reset_password')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadMessages()
    } else {
      setMessages([])
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (!error && data) {
      setMessages(data.map(msg => ({
        role: msg.role,
        content: msg.content
      })))
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (!user) {
      setShowAuthModal(true)
      setAuthModalMode(null)
      return
    }

    const userMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      let aiResponse

      if (currentModel === 'deepseek') {
        const allMessages = [...messages, userMessage]
        aiResponse = await callDeepSeekAPI(allMessages)
      } else {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
        aiResponse = generateLocalResponse(userMessage.content)
      }

      const assistantMessage = { role: 'assistant', content: aiResponse }
      setMessages(prev => [...prev, assistantMessage])

      await supabase.from('messages').insert([
        { user_id: user.id, role: 'user', content: userMessage.content },
        { user_id: user.id, role: 'assistant', content: aiResponse }
      ])

    } catch (error) {
      console.error('Error:', error)
      const errorMessage = { 
        role: 'assistant', 
        content: '😅 哎呀，出了点问题！请稍后再试。如果你使用的是 DeepSeek，请检查 API Key 是否正确。' 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setMessages([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  const allMessages = messages.length === 0 ? [WELCOME_MESSAGE] : messages

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎓 HTML 导师
          </h1>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                <span>🤖</span>
                <span className="hidden sm:inline">{MODELS[currentModel].name}</span>
                <span className="text-slate-400">▼</span>
              </button>

              {showModelSelector && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                  {Object.values(MODELS).map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setCurrentModel(model.id)
                        setShowModelSelector(false)
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${
                        currentModel === model.id ? 'bg-slate-700' : ''
                      }`}
                    >
                      <div className="text-white text-sm font-medium">{model.name}</div>
                      <div className="text-slate-400 text-xs">{model.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm hidden sm:block">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
                >
                  退出
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true)
                  setAuthModalMode(null)
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {allMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 bg-slate-900/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的问题或代码..."
                className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                发送
              </button>
            </div>
          </form>
        </div>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false)
          setAuthModalMode(null)
        }}
        initialMode={authModalMode}
      />
    </div>
  )
}

export default App
