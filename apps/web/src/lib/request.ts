import { api } from "./api";

export const request = <T,>(path:string, options?:RequestInit) => api<{data:T}>(path, options).then((value)=>value.data);
