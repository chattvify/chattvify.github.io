const { pathname } = location

$(() => {
    console.log(pathname)
    if (pathname.includes('auth')) {
        const clientId = 'kx356i9esjnwv91g7brmxay629ugyl'
        const uri = encodeURIComponent(`${location.origin}/access_token`)
        const searchParams = new URLSearchParams(location.search)
        
        if(!searchParams.has('error')) {
            location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_params=client_id&redirect_uri=${uri}&response_type=token&force_verify=false`
        }
    }
    else if (pathname.includes('access_token')) {
        const hash = location.hash.length > 0 ? location.hash.replace('#', '?') : ''

        const hashParams = new URLSearchParams(hash)
        if(hashParams.has('access_token')){
            console.log(hashParams.get('access_token'))
            sessionStorage.setItem('token', hashParams.get('access_token'))

            location.href = '/'
        }
    }
})