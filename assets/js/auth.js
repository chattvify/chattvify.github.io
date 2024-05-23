const { pathname } = location

$(() => {
    if (pathname.includes('auth')) {
        const clientId = 'kx356i9esjnwv91g7brmxay629ugyl'
        const uri = encodeURIComponent(`${location.origin}/access_token`)
        const searchParams = new URLSearchParams(location.search)

        if (!searchParams.has('error')) {
            location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_params=client_id&redirect_uri=${uri}&response_type=token&force_verify=false`
        }
    }
    else if (pathname.includes('access_token')) {
        const hash = location.hash.length > 0 ? location.hash.replace('#', '?') : ''

        const hashParams = new URLSearchParams(hash)
        if (hashParams.has('access_token')) {
            console.log(hashParams.get('access_token'))
            sessionStorage.setItem('token', hashParams.get('access_token'))

            location.href = '/'
        }
    }

    const btnAuth = $('.btn-auth')
    const btnUser = $('.btn-user')
    if (sessionStorage.getItem('token')) {
        btnAuth.parent().hide()
        btnUser.parent().show()

        getUsers({}).then((res) => {
            const { id, login, display_name, profile_image_url } = res
            const img = document.createElement('img')
            img.src = profile_image_url
            img.title = display_name
            img.setAttribute('tw-id', login)
            btnUser.append(img)
        })
    }
    else {
        btnAuth.parent().show()
        btnUser.parent().hide()
    }

    initTheme()
    loadSample()
})

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

const api = ({ base = 'https://api.twitch.tv/helix/', endpoint = '', data, headers = {}, method = 'get' }) => {
    const cliendID = 'kx356i9esjnwv91g7brmxay629ugyl'
    const authToken = sessionStorage.getItem('token')

    const qs = Object.keys(data).map(k => `${k}=${data[k]}`).join('&')

    return fetch(`${base}${endpoint}?${qs}`, {
        method,
        headers: new Headers({
            'Client-Id': cliendID,
            'Authorization': `Bearer ${authToken}`
        })
    }).then((res) => res.json())
}

$('#twitchId').change(chatUrl)

function chatUrl() {
    const obj = {
        id: $('#twitchId').val(),
        token: sessionStorage.getItem('token') || '',
    }

    if (obj.token) {
        const url = `${location.origin}/v1/chat.html?${btoa(JSON.stringify(obj))}`

        $('#chatURL').val(url)
    }
    else {
        $('#chatURL').val('트위치 로그인 버튼을 눌러 로그인 해주세요.')
    }
}

function loadSample() {
    const obj = {
        id: $('.btn-user img').attr('tw-id'),
        token: sessionStorage.getItem('token') || '',
        test: true,
    }
    const url = `${location.origin}/v1/chat.html?${btoa(JSON.stringify(obj))}`

    const iframe = document.createElement('iframe')
    iframe.name = 'chat-sample'
    iframe.src = url
    document.querySelector('.chat-sample').append(iframe)
}

function initTheme() {
    const theme = [
        { title: '기본', value: 'style.css' },
        { title: '탄막', value: 'bullet.css' },
        { title: '카카오톡', value: 'kakao.css' },
    ]
    const elTheme = document.querySelector('#chatTheme')

    theme.forEach(({ title, value }) => {
        const elOption = document.createElement('option')
        elOption.title = title
        elOption.innerText = title
        elOption.value = value
        elTheme.append(elOption)
    })

    elTheme.onchange = (e) => {
        const { value } = e.target
        const frm = window['chat-sample']
        if (frm) {
            frm.loadTheme(value)
        }
    }
}