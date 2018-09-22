export async function getJson(url: string) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onload = () => {
      if (xhr.status === 200) {
        return resolve(xhr.response)
      }
      return reject("Status not OK " + xhr.status)
    }

    function onFailure(evt: ProgressEvent) {
      return reject("Error " + evt)
    }
    xhr.onerror = onFailure
    xhr.onabort = onFailure

    xhr.open("GET", url)
    xhr.responseType = "json"
    xhr.send()
  })
}

export function NeverNull<T>(item: T | null): T {
  return item as T
}

export function NeverUndefined<T>(item: T | undefined): T {
  return item as T
}