import { FormEvent, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Area, Button, Field, Help } from "../../components/ui";
import { currency } from "../../lib/format";
import { request } from "../../lib/request";
import { Client, Proposal, ProposalContent } from "../../types";

const emptyContent:ProposalContent={problemSummary:"",proposedSolution:"",deliverables:[""],timeline:"",lineItems:[{description:"",quantity:1,rate:0}],paymentTerms:"50% deposit before work begins.",callToAction:"Accept Proposal"};

export function ProposalForm({editing=false}:{editing?:boolean}) {
 const {id}=useParams(),nav=useNavigate();
 const clients=useQuery({queryKey:["clients"],queryFn:()=>request<{items:Client[]}>("/clients")});
 const existing=useQuery({queryKey:["proposal",id],queryFn:()=>request<Proposal>(`/proposals/${id}`),enabled:editing});
 const [form,setForm]=useState({clientId:"",title:"",currency:"NGN",depositAmount:"",depositPercent:"",paymentDueDate:"",content:emptyContent});
 const [error,setError]=useState("");
 useEffect(()=>{if(existing.data)setForm({clientId:existing.data.clientId,title:existing.data.title,currency:existing.data.currency,depositAmount:existing.data.depositAmount||"",depositPercent:existing.data.depositPercent||"",paymentDueDate:existing.data.paymentDueDate||"",content:existing.data.currentVersion!.contentJson})},[existing.data]);
 const content=(key:keyof ProposalContent,value:unknown)=>setForm({...form,content:{...form.content,[key]:value}});
 const total=form.content.lineItems.reduce((sum,item)=>sum+Number(item.quantity)*Number(item.rate),0);
 const depositAmount=Number(form.depositAmount||0);
 const pricingError=total<=0?"Add a unit price above zero to calculate the proposal total.":depositAmount>total?"Deposit amount cannot be greater than the proposal total.":"";
 const updateLine=(index:number,values:Partial<ProposalContent["lineItems"][number]>)=>content("lineItems",form.content.lineItems.map((line,i)=>i===index?{...line,...values}:line));
 const submit=async(e:FormEvent)=>{e.preventDefault();if(pricingError){setError(pricingError);return}setError("");try{const body={...form,depositAmount:form.depositAmount?Number(form.depositAmount):undefined,depositPercent:form.depositPercent?Number(form.depositPercent):undefined};const result=await request<Proposal>(editing?`/proposals/${id}`:"/proposals",{method:editing?"PATCH":"POST",body:JSON.stringify(body)});nav(`/proposals/${result.id}`)}catch(submitError){setError(submitError instanceof Error?submitError.message:"Could not save the proposal.")}};
 return <form onSubmit={submit}>
  <div className="mb-7"><h1 className="page-title">{editing?"Edit proposal":"Create proposal"}</h1><p className="muted mt-2">Build a clear proposal and define external deposit instructions.</p></div>
  <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
   <div className="card space-y-5 p-6">
    <label><span className="label">Client</span><Help>Select the person or business receiving this proposal.</Help><select className="field" required value={form.clientId} onChange={e=>setForm({...form,clientId:e.target.value})}><option value="">Choose a client</option>{clients.data?.items.map(client=><option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
    <Field hint="Use a short, recognizable project name. Your client will see this at the top of the proposal." label="Proposal title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
    <Area hint="Describe the client's current challenge in a few clear sentences." label="Problem summary" value={form.content.problemSummary} onChange={e=>content("problemSummary",e.target.value)} required/>
    <Area hint="Explain how your work will solve the problem and what approach you recommend." label="Proposed solution" value={form.content.proposedSolution} onChange={e=>content("proposedSolution",e.target.value)} required/>
    <Area hint="List the specific outcomes the client will receive. Put each deliverable on its own line." label="Deliverables (one per line)" value={form.content.deliverables.join("\n")} onChange={e=>content("deliverables",e.target.value.split("\n"))} required/>
    <Field hint="Tell the client how long the project should take, such as 3 weeks or May 1 to May 21." label="Timeline" value={form.content.timeline} onChange={e=>content("timeline",e.target.value)} required/>
    <div>
     <span className="label">Line items</span>
     <p className="muted mb-3 text-sm">Add each service and its price. The proposal total is quantity x unit price.</p>
     <div className="overflow-x-auto">
      <div className="min-w-[650px]">
       <div className="mb-2 grid grid-cols-[1fr_70px_120px_120px_42px] gap-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500"><span>Service</span><span>Qty</span><span>Unit price</span><span>Subtotal</span><span/></div>
       {form.content.lineItems.map((item,index)=><div className="mb-2 grid grid-cols-[1fr_70px_120px_120px_42px] items-center gap-2" key={index}>
        <input className="field" aria-label={`Line item ${index+1} service`} placeholder="e.g. Website design" value={item.description} onChange={e=>updateLine(index,{description:e.target.value})}/>
        <input className="field" aria-label={`Line item ${index+1} quantity`} type="number" min="1" value={item.quantity} onChange={e=>updateLine(index,{quantity:Number(e.target.value)})}/>
        <input className="field" aria-label={`Line item ${index+1} unit price`} placeholder="Enter price" type="number" min="1" value={item.rate||""} onChange={e=>updateLine(index,{rate:Number(e.target.value)})}/>
        <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm font-bold">{currency(Number(item.quantity)*Number(item.rate),form.currency)}</div>
        <button aria-label={`Remove line item ${index+1}`} className="btn btn-ghost p-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-30" disabled={form.content.lineItems.length===1} type="button" onClick={()=>content("lineItems",form.content.lineItems.filter((_,i)=>i!==index))}><Trash2 size={16}/></button>
       </div>)}
      </div>
     </div>
     <Button type="button" variant="secondary" onClick={()=>content("lineItems",[...form.content.lineItems,{description:"",quantity:1,rate:0}])}><Plus size={15}/>Add line item</Button>
    </div>
    <Area hint="Set expectations for when the client should pay and when work will begin." label="Payment terms" value={form.content.paymentTerms} onChange={e=>content("paymentTerms",e.target.value)} required/>
   </div>
   <aside className="card h-fit space-y-4 p-5">
    <div><h2 className="text-xl font-black">Proposal summary</h2><p className="muted mt-1 text-xs leading-5">Review the pricing details that will shape the payment request after acceptance.</p></div>
    <Field hint="Enter the three-letter currency code used for this project, such as NGN, USD, or GBP." label="Currency" value={form.currency} maxLength={3} onChange={e=>setForm({...form,currency:e.target.value.toUpperCase()})}/>
    <Field hint="Optional: enter the exact amount you want the client to pay before work begins." label="Deposit amount" type="number" min="1" value={form.depositAmount} onChange={e=>setForm({...form,depositAmount:e.target.value,depositPercent:""})}/>
    <Field hint="Optional: use a percentage instead of a fixed deposit amount. Choose one deposit option only." label="Or deposit percent" type="number" min="1" max="100" value={form.depositPercent} onChange={e=>setForm({...form,depositPercent:e.target.value,depositAmount:""})}/>
    <Field hint="Optional: choose when the external deposit or payment should be made." label="Payment due date" type="date" value={form.paymentDueDate} onChange={e=>setForm({...form,paymentDueDate:e.target.value})}/>
    <div className="rounded-lg bg-blue-50 p-4"><span className="muted text-xs">Proposal total</span><p className="mt-1 text-2xl font-black text-primary">{currency(total,form.currency)}</p><p className="mt-2 text-xs leading-5 text-slate-600">Calculated automatically from the quantity and unit price of your line items.</p></div>
    {(error||pricingError)&&<p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error||pricingError}</p>}
    <div><Button className="w-full" disabled={Boolean(pricingError)} type="submit"><Save size={16}/>Save draft</Button><p className="muted mt-2 text-center text-xs leading-5">Save your progress now. You can review the proposal before sending its public link.</p></div>
   </aside>
  </div>
 </form>;
}
