const config = Object.assign(JSON.parse(sessionStorage.getItem('config')), {
    messageTimeout: 30000,
})

const api = ({ base = 'https://api.twitch.tv/helix/', endpoint = '', data, headers = {}, method = 'get' }) => {
    const cliendID = 'kx356i9esjnwv91g7brmxay629ugyl'
    const authToken = config.token

    const qs = Object.keys(data).map(k => `${k}=${data[k]}`).join('&')

    return fetch(`${base}${endpoint}?${qs}`, {
        method,
        headers: new Headers({
            'Client-Id': cliendID,
            'Authorization': `Bearer ${authToken}`
        })
    }).then((res) => {
        if (res.status == 401) {
            // 재인증 로직
            const clientId = 'kx356i9esjnwv91g7brmxay629ugyl'
            const uri = encodeURIComponent(`${location.origin}/v1/access_token.html`)
            const searchParams = new URLSearchParams(location.search)

            if (!searchParams.has('error')) {
                location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_params=client_id&redirect_uri=${uri}&response_type=token&force_verify=false`
            }
        }
        return res.json()
    })
}

const elChat = document.getElementById('chat')
const cache = {
    emote: {},
    badge: {},
    profile: {},
}

const chatFilters = [
    '\u0250-\u02AF', // IPA Extensions
    '\u02B0-\u02FF', // Spacing Modifier Letters
    '\u0300-\u036F', // Combining Diacritical Marks
    '\u0370-\u03FF', // Greek and Coptic
    '\u0400-\u04FF', // Cyrillic
    '\u0500-\u052F', // Cyrillic Supplement
    '\u0530-\u1FFF', // Bunch of non-English
    '\u2100-\u214F', // Letter Like
    '\u2500-\u257F', // Box Drawing
    '\u2580-\u259F', // Block Elements
    '\u25A0-\u25FF', // Geometric Shapes
    '\u2600-\u26FF', // Miscellaneous Symbols
    '\u2800-\u28FF'];

const chatFilter = new RegExp(`[${chatFilters.join('')}]`);

let client
let streamerId
const isTest = config.test || false
document.body.onload = () => {
    console.log(config)
    loadTheme(config['theme'] || 'style.css')
    if (isTest) {
        getBadges().then((r) => {
            cache.badge['global'] = r
            getUsers({ login: twitchID }).then((user) => {
                streamerId = user.id
                getBadges(user.id).then((r) => {
                    cache.badge[twitchID] = r
                    test(user)
                })
            })
        })
    }
    else {
        client = new tmi.client({
            connection: {
                reconnet: true,
                secure: true,
            },
            channels: [twitchID],
        })

        client.connect()
        addListener()
    }
}

function addListener() {
    client.on('connecting', () => {
        console.log('Connected...')
    })

    client.on('connected', () => {
        getBadges().then((r) => {
            cache.badge['global'] = r
        })
    })

    client.on('join', () => {
        getUsers({ login: twitchID }).then((user) => {
            streamerId = user.id
            getBadges(user.id).then((r) => {
                cache.badge[twitchID] = r
            })
        })
    })

    client.on('message', handleMessage)
}

function handleMessage(channel, state, message, self) {
    if (chatFilter.test(message)) {
        return
    }

    const userId = state['user-id']
    if (!cache.profile.hasOwnProperty(userId)) {
        getUsers({ id: userId }).then((user) => {
            cache.profile[userId] = user.profile_image_url

            setTimeout(() => {
                addMessage({ type: 'chat', channel, state, message })
            }, 500)
        })
    }
    else {
        addMessage({ type: 'chat', channel, state, message })
    }
}

function addMessage({ type, channel, state, message = '', timeout = config.messageTimeout, attr = {} } = {}) {
    console.log(type, channel, state, message, timeout, attr)

    const userId = state['user-id']
    const displayName = state['display-name']
    const { badges, userName, color, emotes } = state
    const badgeMap = new Map(Object.entries(badges || ''))
    const emoteMap = new Map(Object.entries(emotes || ''))

    const elChatBox = document.createElement('div')

    const elUserBox = document.createElement('span')
    const elUserImg = document.createElement('img')
    const elUserName = document.createElement('span')

    const elMessage = document.createElement('span')

    elChatBox.classList.add('chat-box')
    elUserBox.classList.add('user')
    elUserImg.classList.add('profile')
    elUserName.classList.add('user-name')
    elMessage.classList.add('message')

    if (color) {
        elUserBox.style.setProperty('--color', color)
    }

    badgeMap.forEach((v, k) => {
        let badgeUrl = ''
        const elUserBadge = document.createElement('img')
        elUserBadge.classList.add('badge')
        elUserBadge.classList.add(`badge-${k}-icon`)
        if (cache.badge[twitchID].hasOwnProperty(k)) {
            badgeUrl = cache.badge[twitchID][k].versions[v]['image_url_4x' || 'image_url_2x' || 'image_url_1x']
        }
        else if (cache.badge['global'].hasOwnProperty(k)) {
            badgeUrl = cache.badge['global'][k].versions[v]['image_url_4x' || 'image_url_2x' || 'image_url_1x']
        }

        if (badgeUrl.length) {
            elUserBadge.src = badgeUrl
            elUserBox.append(elUserBadge)
        }
    })
    elUserImg.src = cache.profile[userId]
    elUserName.style.color = color
    elUserName.innerHTML = displayName
    elUserBox.appendChild(elUserImg)
    elUserBox.appendChild(elUserName)

    elMessage.innerHTML = parseMessage({ emoteMap, message })

    elChatBox.appendChild(elUserBox)
    elChatBox.appendChild(elMessage)

    console.log(config.theme)
    if(config.theme.includes('bullet')) {
        elChatBox.style.top = `${random(10, 90)}%`
        elChatBox.style.transform = `translateX(${window.innerWidth}px)`
        setTimeout(() => {
            elChatBox.style.transform = `translateX(-${window.innerWidth}px)`
        }, 500);
    }

    elChat.appendChild(elChatBox)

    setTimeout(() => {
        //elChatBox.remove()
    }, timeout)
}

function parseMessage({ emoteMap, message }) {
    const rv = []
    let msg = message
    emoteMap.forEach((arr, k) => {
        arr.forEach((v) => {
            const start = Number(v.split('-')[0])
            const end = Number(v.split('-')[1]) + 1
            const img = `<img class="emotes emotes-${k}" src="https://static-cdn.jtvnw.net/emoticons/v2/${k}/default/dark/3.0" />`
            rv.push(img)
            msg = msg.substring(end)
        })
    })
    if (msg.length) {
        rv.push(msg)
    }
    return rv.join(' ')
}

function getUsers({ id, login }) {
    const qs = {}
    if (id) {
        qs['id'] = id
    }
    if (login) {
        qs['login'] = login
    }
    return api({
        endpoint: 'users',
        data: qs,
    }).then(({ data }) => data[0] || null)
}

function getBadges(channel) {
    return api({
        base: 'https://badges.twitch.tv/v1/badges/',
        endpoint: (channel ? `channels/${channel}` : 'global') + '/display',
        data: { language: 'en' }
    }).then(data => {
        return data.badge_sets
    })
}

function test(user) {
    console.log(user, user.profile_image_url.split('/')[-1])
    const { display_name, id, login } = user
    const color = ['#789def', '#4d7a90', '#000000', '#ffffff']
    const message = ['다람쥐 헌 쳇바퀴에 타고파', '닭 콩팥 훔친 집사', '물컵 속 팥 찾던 형', '동틀 녘 햇빛 포개짐', '자동차 바퀴 틈새가 파랗니', '해태 옆 치킨집 닭맛', '코털 팽 대감네 첩 좋소', '추운 겨울에는 따뜻한 커피와 티를 마셔야지요', '그는 미쳐서 칼부림하는 인성파탄자일 뿐이다.', '으웽~. 얘! 위에 이 애 우유의 양 외워와! 아오~ 왜요? 어여! 예...', '웬 초콜릿? 제가 원했던 건 뻥튀기 쬐끔과 의류예요.']

    const state = {
        "badge-info": null,
        "badges": {
            "broadcaster": "1",
            "bits-charity": "1"
        },
        "client-nonce": '',
        "color": color.random(),
        "display-name": display_name,
        "emotes": null,
        "first-msg": false,
        "flags": null,
        "id": '',
        "mod": false,
        "returning-chatter": false,
        "room-id": id,
        "subscriber": false,
        "tmi-sent-ts": new Date().getTime(),
        "turbo": false,
        "user-id": id,
        "user-type": null,
        "emotes-raw": null,
        "badge-info-raw": null,
        "badges-raw": "broadcaster/1,bits-charity/1",
        "username": login,
        "message-type": "chat"
    }

    setInterval(() => {
        state.color = color.random()
        handleMessage(`#${twitchID}`, state, message.random())
    }, 10000)
    handleMessage(`#${twitchID}`, state, '유쾌했던 땃쥐 토끼풀 쫓기 바쁨')
}

function loadTheme(theme) {
    config.theme = theme

    const elHead = document.querySelector('head')
    const styleSheet = document.createElement('link')
    styleSheet.href = `./${theme}`
    styleSheet.rel = 'stylesheet'

    elHead.querySelectorAll('link[rel=stylesheet]').forEach((r) => r.remove())
    elHead.append(styleSheet)

    document.querySelector('#chat').innerHTML = ''
}

Array.prototype.random = function () {
    const n = random(0, this.length - 1)
    return this[n]
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}