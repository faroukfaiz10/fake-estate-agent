import fetch from "node-fetch";
export class Utils{
    static async asyncFilter(arr, predicate) {
        const results = await Promise.all(arr.map(predicate));
        return arr.filter((_v, index) => results[index]);
    }

    static haveSameElements(arr1, arr2) {
        let s = new Set([...arr1, ...arr2]);
        return s.size == arr1.length && s.size == arr2.length;
    }

    static fetchJson = async (url, token) => {
        const response = token
            ? await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            : await fetch(url);
        return await response.json();
    };
}