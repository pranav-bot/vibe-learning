export const globalFetch = (relativeURL: string, init?: RequestInit) => {
    return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${relativeURL}`, init);
}