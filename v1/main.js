const config = Object.assign(params, {
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
    }).then((res) => res.json())
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
const isTest = false
if (isTest) {

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
            console.log(user)
            streamerId = user.id
            getBadges(user.id).then((r) => {
                cache.badge[twitchID] = r

                if (params.hasOwnProperty('test')) {
                    test()
                }
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
    elMessage.classList.add('message')

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


    elChat.appendChild(elChatBox)

    setTimeout(() => {
        elChat.remove()
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

function test() {
    const state = {
        "badge-info": null,
        "badges": {
            "broadcaster": "1",
            "bits-charity": "1"
        },
        "client-nonce": "a16f47e7c8c0336da1907ec8aee2d7a1",
        "color": "#29738F",
        "display-name": "쿨쿨이",
        "emotes": null,
        "first-msg": false,
        "flags": null,
        "id": "1a4ebf9c-4b69-44fb-8f38-8093ce546fa8",
        "mod": false,
        "returning-chatter": false,
        "room-id": "223491434",
        "subscriber": false,
        "tmi-sent-ts": "1681820546923",
        "turbo": false,
        "user-id": "223491434",
        "user-type": null,
        "emotes-raw": null,
        "badge-info-raw": null,
        "badges-raw": "broadcaster/1,bits-charity/1",
        "username": "snorlaxh_",
        "message-type": "chat"
    }

    setInterval(() => {
        handleMessage(`#${twitchID}`, state, '테스트')
    }, 10000)
    handleMessage(`#${twitchID}`, state, 'adsfasdf')
}