'use client'

import {deleteCommunicationDraft} from '@/actions/admin'

export function DeleteCommunicationButton({draftId}:{draftId:string}){return <form action={deleteCommunicationDraft} onSubmit={event=>{if(!window.confirm('¿Eliminar este borrador de comunicación?'))event.preventDefault()}}><input type="hidden" name="draftId" value={draftId}/><button className="text-sm font-semibold text-red-700">Eliminar</button></form>}
