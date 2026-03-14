# 🌟 低幼宝宝英语启蒙

> 专为 3-6 岁低幼宝宝设计的 AI 英语启蒙闪卡应用 —— 配套海尼曼分级阅读绘本，让「Look! A fruit!」成为每天最期待的亲子时光 🥰

---

## ✨ 它能干啥？

| 功能 | 描述 |
|------|------|
| 📖 **绘本闪卡** | 内置多套海尼曼绘本词汇，正面单词 + 背面原句，一翻一读就是完整语境 |
| 🔊 **地道发音** | Gemini TTS 生成的纯正英语发音，比 App 里的机器人好听多了 |
| 🎨 **AI 配图** | 6 种插画风格随心选，一键生成和绘本主题匹配的可爱插图 |
| ✏️ **自定义绘本** | 孩子在读哪本书就配哪本，自己加词汇，AI 帮你配图配音 |
| 🔒 **本地存储** | 所有数据存在浏览器里，不上传、不注册、不打扰 |

---

## 📚 内置绘本（6 本，持续更新中！）

```
🛒  At the Market   ·  水果、蔬菜、玩具……      卡通风
🐶  My Dog          ·  跳、跑、游泳、翻身……    卡通风
🐻  A Funny Bear    ·  帽子、领带、眼镜……      毛毡风
🎭  Role Play       ·  熊、老鼠、老虎、鸭子……  毛毡风
🍽️  Five            ·  杯子、盘子、叉子……      写实风
🦁  In the Zoo      ·  猴子、熊猫、河马……      写实风
```

---

## 🚀 跑起来！

> 前提：安装好 [Node.js](https://nodejs.org) 就行

```bash
# 装依赖
npm install

# 在 .env.local 里填上你的 Gemini API Key
# GEMINI_API_KEY=AIzaSy...

# 启动！
npm run dev
```

打开 `http://localhost:3000`，完事 🎉

> 💡 没有 API Key？去 [Google AI Studio](https://aistudio.google.com/apikey) 免费领一个，粘贴到应用里也行，不一定要填到 `.env`。

---

## 🎮 怎么用？

**👶 宝宝模式（日常使用）**
首页点任意绘本 → 进入闪卡 → 点卡片翻面 → 点喇叭听发音，就这么简单！

**🖊️ 家长模式（自制绘本）**
1. 点首页「添加新绘本」
2. 填主题名、选画风
3. 一张一张加卡片（单词 + 教材原句）
4. 点「AI 一键生成」—— 去泡杯茶，回来图和音都好了 ☕
5. 保存，出现在书架上啦

**🔧 管理员模式（内容维护）**
点首页「管理员」按钮 → 每本书右下角出现导出按钮 → 下载 ZIP → 解压放进 `public/samples/` → 所有人都能看到这本书

---

## 🛠️ 技术栈

```
React 19 + TypeScript   ·  前端框架
Vite 6                  ·  构建工具
Tailwind CSS v4         ·  样式
Motion                  ·  动画
LocalForage             ·  本地存储（IndexedDB）
Google Gemini           ·  AI 图像生成 + TTS 语音
JSZip                   ·  绘本打包导出
```

---

## 📁 项目结构

```
public/samples/
  manifest.json          ← 所有绘本的目录
  {bookId}/              ← 每本绘本的图片 + 音频

src/
  components/
    Home.tsx             ← 首页书架
    BookEditor.tsx       ← 绘本编辑器
    FlashcardViewer.tsx  ← 闪卡学习界面
  services/
    ai.ts                ← Gemini 图像 & TTS
    db.ts                ← 本地数据库
  utils/
    exportSamples.ts     ← 导出 ZIP
```

---

## 💌 最后说一句

这个小工具不是要替代陪伴，而是让陪伴更有趣。

不是让宝宝对着屏幕自己刷，而是爸爸妈妈拿着手机，和宝宝一起翻卡片、一起跟读、一起傻笑。

语言习得的核心是重复、是乐趣、是安全感。愿每一次「Look at the fruits! 🍎」都是你们共同的小小记忆。

---

*Made with ❤️ for tiny learners & their parents.*
