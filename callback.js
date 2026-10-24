/* 認証情報はURLのfragmentからのみ読み取り、ネットワークやログへ送信しない。 */
;(() => {
  const params = new URLSearchParams(window.location.hash.slice(1))
  try {
    history.replaceState(null, '', window.location.href.split('#')[0])
  } catch {
    /* file preview */
  }
  const title = document.getElementById('title')
  const message = document.getElementById('message')
  if (params.get('result') === 'denied') {
    title.textContent = '認証をキャンセルしました'
    message.textContent = 'アプリに保存済みの認証は変更していません。'
    return
  }
  const accessToken = params.get('access_token')
  const expiresIn = Number(params.get('expires_in'))
  const state = params.get('state')
  if (
    !accessToken ||
    accessToken.length > 4096 ||
    !Number.isSafeInteger(expiresIn) ||
    expiresIn <= 0
  ) {
    title.textContent = '認証情報を読み取れませんでした'
    message.textContent = 'とるキャスの設定から認証をやり直してください。'
    return
  }
  const receivedAt = Date.now()
  if (!Number.isSafeInteger(receivedAt + expiresIn * 1000)) {
    title.textContent = '有効期限を読み取れませんでした'
    message.textContent = 'とるキャスの設定から認証をやり直してください。'
    return
  }
  const bundle = { version: 1, accessToken, receivedAt, expiresIn }
  const canReturn = !!state && /^[a-f0-9]{64}$/.test(state)
  const callback =
    'torucas://oauth/callback#' +
    new URLSearchParams({
      access_token: accessToken,
      received_at: String(receivedAt),
      expires_in: String(expiresIn),
      state: state || ''
    })
  title.textContent = '認証が完了しました'
  message.textContent = canReturn
    ? 'とるキャスに戻り、認証を反映します。'
    : '認証情報をコピーして、とるキャスの設定に貼り付けてください。'
  document.getElementById('success').hidden = false
  document.getElementById('expiry').textContent =
    '有効期限：' + new Date(receivedAt + expiresIn * 1000).toLocaleString('ja-JP')
  document.getElementById('token').value = accessToken
  document.getElementById('return').hidden = !canReturn
  document.getElementById('return').onclick = () => {
    window.location.href = callback
  }
  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      message.textContent = 'コピーしました。とるキャスの設定に貼り付けて保存してください。'
    } catch {
      message.textContent =
        'コピーできませんでした。ブラウザのクリップボード権限を確認してください。'
    }
  }
  document.getElementById('copy').onclick = () => copy(JSON.stringify(bundle))
  document.getElementById('legacy').onclick = () => copy(accessToken)
  if (canReturn) window.location.href = callback
})()
