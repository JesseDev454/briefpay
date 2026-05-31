import { ReactNode } from "react";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

export function Brand({inverse=false}:{inverse?:boolean}) { return <Link to="/" className={`flex items-center gap-2 text-xl font-black tracking-tight ${inverse?"text-white":"text-slate-900"}`}><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">B</span>BriefPay</Link>; }
export function Button({children,variant="primary",className="",...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?:"primary"|"secondary"|"ghost"}) { return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>; }
export function Badge({value}:{value:string}) { return <span className={`badge badge-${value}`}>{value.replaceAll("_"," ")}</span>; }
export function Help({children}:{children:ReactNode}) { return <p className="muted -mt-1 mb-2 text-xs leading-5">{children}</p>; }
export function Field({label,hint,...props}:React.InputHTMLAttributes<HTMLInputElement>&{label:string;hint?:string}) { return <label><span className="label">{label}</span>{hint&&<Help>{hint}</Help>}<input className="field" {...props}/></label>; }
export function Area({label,hint,...props}:React.TextareaHTMLAttributes<HTMLTextAreaElement>&{label:string;hint?:string}) { return <label><span className="label">{label}</span>{hint&&<Help>{hint}</Help>}<textarea className="field min-h-24 resize-y" {...props}/></label>; }
export function Empty({title,copy,action}:{title:string;copy:string;action?:ReactNode}) { return <div className="card p-10 text-center"><FileText className="mx-auto mb-3 text-slate-300"/><h3 className="font-bold">{title}</h3><p className="muted mx-auto max-w-md">{copy}</p>{action}</div>; }
