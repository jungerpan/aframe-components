const AnimationText = {
    schema: {
        character: { type: 'string', default: '' },
        font: { type: 'asset', default: '' },
        color: { type: 'color', default: 'transparent' },
        front: { type: 'color', default: '#5E3218' },
        align: { type: 'string', default: 'left' },
        size: { type: 'number', default: 55 },
        opacity: { type: 'number', default: 1 },
        lineHeight: { type: 'number', default: 1.4 },
        duration: { type: 'number', default: 4000 },
        fontName: { type: 'string', default: 'Microsoft YaHei' },
        wordSpacing: { type: 'number', default: 0 },
        maxWidth: { type: 'number', default: 1500 },
        fonts: {
            type: 'array',
            default: "#linotypeFeltpenMedium,#karlataMilupRight,#sourceHanSanScn"
        },
    },
    init() {
        const { data, el } = this
        const { fonts, maxWidth } = data
        this.sizeIndex = 0
        this.fontMap = {
            'Mandarin': {
                fontName: "sourceHanSanScn",
                size: 54,
                lineHeight: 105,
                wordMaps: [],
                audioWords: []
            },
            'Tamil': {
                fontName: "karlataMilupRight",
                size: 48,
                lineHeight: 66,
                wordMaps: [],
                audioWords: []
            },
            'English': {
                fontName: "linotypeFeltpenMedium",
                size: 54,
                lineHeight: 110,
                wordMaps: [],
                audioWords: []
            },
            'Malay': {
                fontName: "linotypeFeltpenMedium",
                size: 54,
                lineHeight: 91,
                wordMaps: [],
                audioWords: []
            },
        }
        let promises = []
        fonts.forEach((font, _) => {
            let element = document.querySelector(font)
            let fontName = font.replace("#", "")
            let url = element.getAttribute("src")
            let request = new Request(url);
            promises.push(
                new Promise((resolve, reject) => {
                    fetch(request).then(res => res.arrayBuffer()).then(arrayBuffer => {
                        let font = new FontFace(fontName, arrayBuffer);
                        font.load().then((loadedFont) => {
                            document.fonts.add(loadedFont);
                            resolve(fontName)
                        });
                    }).catch(err => {
                        reject()
                    });
                })
            )
        })
        this.timer = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = maxWidth;
        this.canvas.height = 750;
        this._running = false;
        this._frontRunning = false;
        this.audioWords = []
        this.audioReadWord = ""
        this.audioIndex = 0
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.sizeIndex = 0
        let texture = new THREE.CanvasTexture(this.canvas)
        texture.encoding = THREE.sRGBEncoding
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            color: "#5E3218",
        });
        let planeWidth = this.canvas.width / 500
        let planeHeight = this.canvas.height / 500
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const plane = new THREE.Mesh(geometry, material);
        plane.renderOrder = 100;
        el.setObject3D("mesh", plane)
        this.material = material;
        Promise.all(promises).then(fontNames => {
            this.loadFontFinished = true
            // this.initAudio();
        })
        this.enableAutoAnimation = false;
        // 监听更换语言
        el.addEventListener("change", () => {
            this.enableAutoAnimation = false;
            this.initAudio()
        })
        el.addEventListener("show", () => {
            this.enableAutoAnimation = true;
            if (this.fontMap[this.curLang].audioWords.length > 0) {
                this.startAnimation()
            }
        })
        el.addEventListener("hide", () => {
            this.stopAnimation()
        })
    },
    async initAudio() {
        const { data } = this
        const baseInfo = JSON.parse(localStorage.getItem("baseInfo"));
        this.curLang = baseInfo?.curLang || 'English';
        if (data.character) {
            if (this.fontMap[this.curLang].wordMaps.length == 0) {
                this.loadText()
            }
            this.audio = document.querySelector(`#${data.character}-intro-${this.curLang}`)
            if (this.fontMap[this.curLang].audioWords.length == 0) {
                let request = new Request(`assets/data/character_intro/${this.curLang}/${data.character}.json`);
                const response = await fetch(request)
                const res = await response.json()
                this.fontMap[this.curLang].audioWords = res
            }
            if (this.enableAutoAnimation) {
                this.startAnimation()
            }
            let audioEnd = () => {
                this._frontRunning = false
                this.audio.removeEventListener('ended', audioEnd)
            }
            this.audio.addEventListener('ended', audioEnd)

        }
    },
    isChinesePunctuation(char) {
        // 定义常见的中文标点符号的正则表达式
        const regex = /[，。！？；：“”‘’（）【】「」、【】〖〗〘〙]|\p{P}|\p{S}/u;
        return regex.test(char);
    },
    async loadText() {
        const { ctx, canvas, data, el, fontMap } = this
        const { maxWidth } = data
        const maxLineWidth = maxWidth;
        const introduction = JSON.parse(localStorage.getItem("introduction"))
        const text = introduction[data.character][this.curLang]
        let fontSet = fontMap[this.curLang]
        let words = []
        // 针对不同语言进行不同的分词处理
        if (this.curLang === 'Mandarin') {
            // 中文按字符分割
            let datawords = Array.from(text)
            for (let i = 0; i < datawords.length - 1; i++) {
                if (this.isChinesePunctuation(datawords[i + 1])) {
                    words.push(datawords[i] + datawords[i + 1])
                    i++
                } else {
                    words.push(datawords[i])
                }
            }
        } else {
            // 其他语言按空格分割
            words = text.split(' ')
        }
        let size = fontSet.size
        let fontName = fontSet.fontName
        let textArr = []
        let currentWidth = 0

        ctx.beginPath()
        ctx.font = `${size}px ${fontName}`
        let line_Height = fontSet.lineHeight
        let spaceWidth = ctx.measureText(' ').width
        if (this.curLang === 'Mandarin') {
            spaceWidth = 0
        }
        let lineNumber = 0
        words.forEach(word => {
            let offsetY = (lineNumber + 1) * line_Height
            let wordWidth = ctx.measureText(word).width
            if (currentWidth + wordWidth + spaceWidth <= maxLineWidth || currentWidth + wordWidth <= maxLineWidth) {
                textArr.push({
                    word: word,
                    width: wordWidth,
                    offsetX: currentWidth,
                    offsetY: offsetY
                })
                currentWidth += wordWidth + spaceWidth
            } else {
                textArr.push({
                    word: word,
                    width: wordWidth,
                    offsetX: 0,
                    offsetY: offsetY + line_Height
                })
                lineNumber++;
                currentWidth = wordWidth + spaceWidth
            }
        })
        lineNumber++;
        ctx.stroke()
        fontSet.wordMaps = textArr
    },
    frontAnimation() {
        if (!this._frontRunning) return
        const { data, audio, curLang, fontMap } = this
        const { front } = data
        const { wordMaps, audioWords } = fontMap[curLang]
        if (!audio.ended) {
            if (this.sizeIndex >= wordMaps.length) {
                this._frontRunning = false
                this.sizeIndex = 0
                this.clearTimer()
                return
            }
            if (this.audioIndex < audioWords.length) {
                let t = audio.currentTime
                let start = parseFloat(audioWords[this.audioIndex].start)
                let end = parseFloat(audioWords[this.audioIndex].end)
                if (t >= start && t < end) {
                    if (this.fontTextChange) {
                        this.fontTextChange = false;
                        this._draw(front)
                    }
                } else if (t >= end) {
                    this.audioIndex++
                    this.fontTextChange = true;
                }
            } else {
                this._draw(front)
            }
        } else {
            if (this.sizeIndex < wordMaps.length) {
                this._drawOtherText(front)
            }
            this.clearTimer()
        }
    },
    _draw(color) {
        const { ctx, material, fontMap, curLang } = this
        const { sizeIndex } = this
        let fontSet = fontMap[curLang]
        const { wordMaps } = fontSet
        let size = fontSet.size
        let fontName = fontSet.fontName
        ctx.beginPath()
        this.ctx.font = `${size}px ${fontName}`;
        this.ctx.fillStyle = color
        let wordItem = wordMaps[sizeIndex]
        ctx.fillText(wordItem.word, wordItem.offsetX, wordItem.offsetY)
        this.sizeIndex++
        material.map.needsUpdate = true
    },
    _drawOtherText(color) {
        const { ctx, material, fontMap, curLang } = this
        const { sizeIndex } = this
        let fontSet = fontMap[curLang]
        const { wordMaps } = fontSet
        let size = fontSet.size
        let fontName = fontSet.fontName
        ctx.beginPath()
        this.ctx.font = `${size}px ${fontName}`;
        this.ctx.fillStyle = color
        for (let i = sizeIndex; i < wordMaps.length; i++) {
            let wordItem = wordMaps[i]
            ctx.fillText(wordItem.word, wordItem.offsetX, wordItem.offsetY)
        }
        material.map.needsUpdate = true
    },
    startAnimation() {
        if (this._frontRunning) return
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.material.map.needsUpdate = true;
        this.clearTimer()
        this.sizeIndex = 0
        this.audioIndex = 0
        this.audioReadWord = ""
        this._frontRunning = true
        this.fontTextChange = true;
        this.enableAutoAnimation = false;
        this.audio.play()
        this.timer = setInterval(() => {
            this.frontAnimation()
        }, 40)

    },
    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
        this._frontRunning = false
        this.sizeIndex = 0
        console.log("stopAnimation")
    },
    stopAnimation() {
        this._frontRunning = false
        this.audio.pause()
        this.audio.currentTime = 0
        this.audioIndex = 0
        this.audioReadWord = ""
        this.sizeIndex = 0
        this.fontTextChange = false;
        this.clearTimer()

    }
}
export default AnimationText